package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.entity.KnowledgeChunk;
import com.fptu.fcms.repository.KnowledgeArchiveRepository;
import com.fptu.fcms.repository.KnowledgeChunkRepository;
import com.fptu.fcms.service.KnowledgeIngestionService;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * LangChain4j ingestion core (Batch 4).
 * <p>
 * Retry strategy: model builder maxRetries(3) xử lý lỗi mạng tầng HTTP (LangChain4j),
 * @Retryable(maxAttempts=3) bọc ngoài method ingest/reingest để bắt thêm lỗi DB tạm thời.
 * Hai lớp retry hoạt động độc lập: LangChain4j retry WITHIN một call, @Retryable retry CÁCH NHAU
 * các method call toàn bộ. Không xảy ra retry lồng nhau theo nghĩa đệ quy vô hạn.
 * TC3-06 verify: sau khi @Retryable exhausted (3 lần) → indexingStatus = "Failed".
 */
@Service
@Slf4j
public class KnowledgeIngestionServiceImpl implements KnowledgeIngestionService {

    private final KnowledgeArchiveRepository knowledgeArchiveRepository;
    private final KnowledgeChunkRepository knowledgeChunkRepository;
    private final EmbeddingModel documentEmbeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final ObjectMapper objectMapper;

    public KnowledgeIngestionServiceImpl(
            KnowledgeArchiveRepository knowledgeArchiveRepository,
            KnowledgeChunkRepository knowledgeChunkRepository,
            @Qualifier("documentEmbeddingModel") EmbeddingModel documentEmbeddingModel,
            EmbeddingStore<TextSegment> embeddingStore,
            ObjectMapper objectMapper) {
        this.knowledgeArchiveRepository = knowledgeArchiveRepository;
        this.knowledgeChunkRepository = knowledgeChunkRepository;
        this.documentEmbeddingModel = documentEmbeddingModel;
        this.embeddingStore = embeddingStore;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void rehydrateOnStartup() {
        try {
            rehydrateEmbeddingStore();
        } catch (Exception e) {
            // Không chặn boot nếu DB chưa sẵn sàng / empty — log rõ để debug.
            log.warn("Rehydrate embedding store failed on startup: {}", e.getMessage());
        }
    }

    /**
     * Quá trình nhúng Vector (Vector Embedding) với cơ chế tự động thử lại.
     * Đầu vào: Nhận ID tài liệu (archiveID) từ event sau khi transaction được commit.
     * Đầu ra: Hàm được bọc bằng @Retryable kết hợp cấu hình maxRetries(3) của LangChain4j nhằm tự động thực hiện lại nếu gặp lỗi mạng đột xuất. Sau 3 lần thất bại sẽ gọi logic recover.
     */
    @Override
    @Retryable(
            retryFor = Exception.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 500, multiplier = 2.0)
    )
    @Transactional
    public void ingest(Integer archiveID) {
        doIngest(archiveID, false);
    }

    @Override
    @Retryable(
            retryFor = Exception.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 500, multiplier = 2.0)
    )
    @Transactional
    public void reingest(Integer archiveID) {
        doIngest(archiveID, true);
    }

    /**
     * Recover chung cho cả ingest() và reingest() khi @Retryable hết attempts.
     * Spring Retry dùng cùng @Recover method nếu signature khớp.
     * TC3-06: sau retry exhausted → indexingStatus = "Failed", không còn "Processing".
     */
    @Recover
    public void recoverIngest(Exception e, Integer archiveID) {
        log.error("Ingest/reingest exhausted retries for archiveID={}: {}", archiveID, e.getMessage(), e);
        markFailed(archiveID);
    }

    @Override
    @Transactional
    public void removeFromIndex(Integer archiveID) {
        softDeleteChunksAndRemoveEmbeddings(archiveID);
        log.info("Removed knowledge index for archiveID={}", archiveID);
    }

    /**
     * Rehydrate InMemoryEmbeddingStore từ KnowledgeChunk SQL table khi app khởi động.
     * TC3-10: sau restart/simulate, embeddingStore chứa lại đúng số chunk; retrieve vẫn hoạt động.
     */
    @Override
    @Transactional
    public void rehydrateEmbeddingStore() {
        List<KnowledgeChunk> chunks = knowledgeChunkRepository.findByIsDeletedFalse();
        if (chunks.isEmpty()) {
            log.info("Rehydrate: no KnowledgeChunk rows to load");
            return;
        }

        Set<Integer> archiveIds = chunks.stream()
                .map(KnowledgeChunk::getArchiveID)
                .collect(Collectors.toSet());

        Map<Integer, KnowledgeArchive> archivesById = new HashMap<>();
        for (Integer archiveId : archiveIds) {
            knowledgeArchiveRepository.findByArchiveIDAndIsDeletedFalse(archiveId)
                    .ifPresent(a -> archivesById.put(archiveId, a));
        }

        int loaded = 0;
        for (KnowledgeChunk chunk : chunks) {
            KnowledgeArchive archive = archivesById.get(chunk.getArchiveID());
            if (archive == null) {
                log.warn("Rehydrate skip chunkID={} — archive {} missing/deleted",
                        chunk.getChunkID(), chunk.getArchiveID());
                continue;
            }
            if (!StringUtils.hasText(chunk.getEmbeddingVector())
                    || !StringUtils.hasText(chunk.getChunkText())) {
                log.warn("Rehydrate skip chunkID={} — missing vector/text", chunk.getChunkID());
                continue;
            }

            float[] vector = deserializeVector(chunk.getEmbeddingVector());
            Embedding embedding = Embedding.from(vector);

            Metadata metadata = new Metadata();
            metadata.put("archiveId", String.valueOf(chunk.getArchiveID()));
            metadata.put("title", archive.getTitle() != null ? archive.getTitle() : "");
            metadata.put("index", chunk.getChunkIndex() != null ? chunk.getChunkIndex() : 0);

            TextSegment segment = TextSegment.from(chunk.getChunkText(), metadata);

            // Runtime id mới sau restart — cập nhật DB để UPDATE/DELETE remove đúng entry.
            String newStoreId = embeddingStore.add(embedding, segment);
            if (newStoreId != null && !newStoreId.equals(chunk.getEmbeddingStoreId())) {
                chunk.setEmbeddingStoreId(newStoreId);
                knowledgeChunkRepository.save(chunk);
            }
            loaded++;
        }
        log.info("Rehydrate complete: loaded {} chunks into InMemoryEmbeddingStore", loaded);
    }

    // ──────────────────────────── Private Helpers ────────────────────────────

    private void doIngest(Integer archiveID, boolean replaceExisting) {
        Optional<KnowledgeArchive> optional =
                knowledgeArchiveRepository.findByArchiveIDAndIsDeletedFalse(archiveID);
        if (optional.isEmpty()) {
            log.warn("Ingest skipped: archiveID={} not found or deleted", archiveID);
            return;
        }

        KnowledgeArchive archive = optional.get();

        // Blocker 3 fix: For UPDATE (replaceExisting=true), always cleanup old embeddings FIRST —
        // before any early return. Ensures stale embeddings are never left in RAM/DB
        // even if new content is empty/invalid.
        if (replaceExisting) {
            // TC3-04: UPDATE — remove old chunks from DB (isDeleted=true) and from RAM by embeddingStoreId
            softDeleteChunksAndRemoveEmbeddings(archiveID);
        }

        if (!StringUtils.hasText(archive.getContent())) {
            log.warn("Ingest skipped: archiveID={} has empty content — mark Failed", archiveID);
            archive.setIndexingStatus("Failed");
            knowledgeArchiveRepository.save(archive);
            return;
        }

        archive.setIndexingStatus("Processing");
        knowledgeArchiveRepository.save(archive);

        String title = archive.getTitle() != null ? archive.getTitle() : "";
        Metadata docMeta = Metadata.from(Map.of(
                "archiveId", String.valueOf(archiveID),
                "title", title
        ));
        Document document = Document.from(archive.getContent(), docMeta);

        // Phân rã văn bản (Chunking):
        // Đầu vào: Nội dung Markdown đã khử độc toàn phần.
        // Đầu ra: Dùng DocumentSplitters.recursive(500, 100) để chia nhỏ văn bản thành các TextSegment (tối đa 500 ký tự, đè lên 100 ký tự để không mất thông tin giáp ranh).
        List<TextSegment> rawSegments = DocumentSplitters.recursive(500, 100).split(document);

        int chunkIndex = 0;
        for (TextSegment raw : rawSegments) {
            // Chèn tiêu đề ngữ cảnh (Contextual Headers):
            // Đầu vào: Tên tài liệu gốc (archiveTitle) và nội dung chunk.
            // Đầu ra: Ghép nối tên tài liệu vào trước mỗi chunk, giúp các chunk giữ được thông tin nguồn gốc của CLB khi đứng riêng lẻ trước khi đem đi nhúng.
            String headedText = title + "\n" + raw.text();

            Metadata segmentMeta = raw.metadata() != null ? raw.metadata().copy() : new Metadata();
            segmentMeta.put("archiveId", String.valueOf(archiveID));
            segmentMeta.put("title", title);
            // Giữ index từ splitter nếu có; fallback loop index
            Integer metaIndex = resolveIndex(segmentMeta, chunkIndex);
            segmentMeta.put("index", metaIndex);

            TextSegment segment = TextSegment.from(headedText, segmentMeta);

            Embedding embedding = documentEmbeddingModel.embed(segment).content();
            // LangChain4j 1.17.2: interface EmbeddingStore chỉ có add(Embedding, Embedded)
            // — không có overload add(String id, Embedding, Embedded).
            String embeddingStoreId = embeddingStore.add(embedding, segment);

            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setArchiveID(archiveID);
            chunk.setChunkIndex(metaIndex);
            chunk.setChunkText(headedText);
            chunk.setEmbeddingVector(serializeVector(embedding.vector()));
            chunk.setEmbeddingStoreId(embeddingStoreId);
            chunk.setCreatedAt(LocalDateTime.now());
            chunk.setIsDeleted(false);
            knowledgeChunkRepository.save(chunk);

            chunkIndex++;
        }

        // Cập nhật trạng thái Vector hóa (Persistence):
        // Đầu vào: Tất cả các chunk đã được nhúng vector và lưu vào Database/Memory.
        // Đầu ra: Đổi cột indexingStatus của bản ghi KnowledgeArchive tương ứng thành Success (hoặc Failed nếu xảy ra lỗi trong tiến trình).
        archive.setIndexingStatus("Success");
        knowledgeArchiveRepository.save(archive);
        log.info("Ingest success archiveID={} chunks={}", archiveID, chunkIndex);
    }

    /**
     * Soft-delete chunks trong DB và remove runtime embeddings.
     * TC3-04: UPDATE event — old chunks isDeleted=true; old storeIds removed từ RAM.
     * TC3-11: DELETE event — tương tự, chunks bị xoá, không retrieve được nữa.
     */
    private void softDeleteChunksAndRemoveEmbeddings(Integer archiveID) {
        List<KnowledgeChunk> existing =
                knowledgeChunkRepository.findByArchiveIDAndIsDeletedFalse(archiveID);
        for (KnowledgeChunk chunk : existing) {
            if (StringUtils.hasText(chunk.getEmbeddingStoreId())) {
                embeddingStore.remove(chunk.getEmbeddingStoreId());
            }
            chunk.setIsDeleted(true);
            knowledgeChunkRepository.save(chunk);
        }
    }

    private void markFailed(Integer archiveID) {
        knowledgeArchiveRepository.findByArchiveIDAndIsDeletedFalse(archiveID).ifPresent(archive -> {
            archive.setIndexingStatus("Failed");
            knowledgeArchiveRepository.save(archive);
        });
    }

    /**
     * Resolve chunk index từ metadata — ưu tiên integer key, fallback string parse, cuối cùng loop counter.
     */
    private Integer resolveIndex(Metadata metadata, int fallback) {
        if (metadata == null) {
            return fallback;
        }
        Integer asInt = metadata.getInteger("index");
        if (asInt != null) {
            return asInt;
        }
        String asString = metadata.getString("index");
        if (asString != null) {
            try {
                return Integer.parseInt(asString);
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return fallback;
    }

    /**
     * Serialize float[] → JSON string để lưu DB.
     * TC3-10: deserializeVector parse lại chính xác → Embedding từ DB đúng.
     */
    private String serializeVector(float[] vector) {
        try {
            return objectMapper.writeValueAsString(vector);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize embedding vector to JSON", e);
        }
    }

    private float[] deserializeVector(String json) {
        try {
            return objectMapper.readValue(json, float[].class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize embedding vector from JSON", e);
        }
    }
}
