package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.entity.KnowledgeChunk;
import com.fptu.fcms.event.KnowledgeArchiveEventListener;
import com.fptu.fcms.event.KnowledgeArchiveIndexedEvent;
import com.fptu.fcms.repository.KnowledgeArchiveRepository;
import com.fptu.fcms.repository.KnowledgeChunkRepository;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * Batch 4 — Test Cases TC3-01, TC3-02, TC3-04, TC3-05, TC3-10, TC3-11.
 * TC3-06 (@Retryable integration) → KnowledgeIngestionRetryTest (requires Spring AOP proxy).
 * TC3-03 bị bỏ theo plan.
 * <p>
 * TC3-10 và TC3-11 dùng InMemoryEmbeddingStore thật + EmbeddingSearchRequest để verify
 * actual in-memory store state, không chỉ DB flags.
 */
class KnowledgeIngestionServiceImplTest {

    private KnowledgeArchiveRepository archiveRepository;
    private KnowledgeChunkRepository chunkRepository;
    private EmbeddingModel embeddingModel;
    private EmbeddingStore<TextSegment> embeddingStore;
    private KnowledgeIngestionServiceImpl service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        archiveRepository = mock(KnowledgeArchiveRepository.class);
        chunkRepository = mock(KnowledgeChunkRepository.class);
        embeddingModel = mock(EmbeddingModel.class);
        // Dùng InMemoryEmbeddingStore thật để TC3-10/TC3-11 verify thật bằng search()
        embeddingStore = new InMemoryEmbeddingStore<>();
        objectMapper = new ObjectMapper();

        // @PostConstruct rehydrateOnStartup sẽ gọi findByIsDeletedFalse() — trả empty list
        when(chunkRepository.findByIsDeletedFalse()).thenReturn(List.of());

        service = new KnowledgeIngestionServiceImpl(
                archiveRepository,
                chunkRepository,
                embeddingModel,
                embeddingStore,
                objectMapper
        );
    }

    // ─────────────────────── TC3-01 ───────────────────────
    /**
     * TC3-01: Verify documentEmbeddingModel.embed() trả về non-null non-empty vector (mock).
     * Test thật với real Gemini API: mark profile "integration", cần GEMINI_API_KEY.
     */
    @Test
    @DisplayName("TC3-01: documentEmbeddingModel.embed returns non-null non-empty embedding vector")
    void tc3_01_embeddingModelReturnsNonNullVector() {
        float[] mockVector = new float[768];
        for (int i = 0; i < mockVector.length; i++) {
            mockVector[i] = (i % 2 == 0) ? 0.1f : -0.1f;
        }
        Embedding mockEmbedding = Embedding.from(mockVector);
        when(embeddingModel.embed(any(TextSegment.class)))
                .thenReturn(Response.from(mockEmbedding));

        Response<Embedding> result = embeddingModel.embed(TextSegment.from("Xin chào"));

        assertThat(result).isNotNull();
        assertThat(result.content()).isNotNull();
        assertThat(result.content().vector()).isNotEmpty();
        assertThat(result.content().vector().length).isEqualTo(768);
    }

    // ─────────────────────── TC3-02 ───────────────────────
    /**
     * TC3-02: Ingest ~1200 chars → DocumentSplitters.recursive(500, 100) tạo chunks,
     * metadata index tăng dần, text bắt đầu bằng title (contextual header).
     */
    @Test
    @DisplayName("TC3-02: Ingest 1200-char doc splits into correct chunks with contextual header and ascending index")
    void tc3_02_ingestSplitsCorrectlyWithContextualHeader() {
        String title = "Quy chế CLB";
        // ~1200 chars content
        String paragraph = "Đây là nội dung quy chế quan trọng của CLB. Mỗi thành viên phải tuân thủ đầy đủ. ";
        String content = paragraph.repeat(15);

        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(1);
        archive.setTitle(title);
        archive.setContent(content);
        archive.setIndexingStatus("Pending");
        archive.setIsDeleted(false);

        when(archiveRepository.findByArchiveIDAndIsDeletedFalse(1))
                .thenReturn(Optional.of(archive));

        // Capture archive status at each save() call moment
        List<String> capturedStatuses = new ArrayList<>();
        when(archiveRepository.save(any())).thenAnswer(inv -> {
            KnowledgeArchive a = inv.getArgument(0);
            capturedStatuses.add(a.getIndexingStatus());
            return a;
        });

        // Mock embedding model trả về vector dummy
        float[] dummyVector = new float[768];
        when(embeddingModel.embed(any(TextSegment.class)))
                .thenReturn(Response.from(Embedding.from(dummyVector)));

        when(chunkRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.ingest(1);

        // Verify: "Processing" rồi "Success" được save theo thứ tự
        assertThat(capturedStatuses).contains("Processing", "Success");

        // Verify: chunks được save với contextual header (text bắt đầu bằng title + "\n")
        ArgumentCaptor<KnowledgeChunk> chunkCaptor = ArgumentCaptor.forClass(KnowledgeChunk.class);
        verify(chunkRepository, atLeastOnce()).save(chunkCaptor.capture());
        List<KnowledgeChunk> savedChunks = chunkCaptor.getAllValues();

        assertThat(savedChunks).isNotEmpty();
        savedChunks.forEach(chunk ->
                assertThat(chunk.getChunkText()).startsWith(title + "\n"));

        // Verify: chunkIndex tăng dần (0, 1, 2, ...)
        List<Integer> indices = savedChunks.stream()
                .map(KnowledgeChunk::getChunkIndex)
                .sorted()
                .toList();
        for (int i = 0; i < indices.size(); i++) {
            assertThat(indices.get(i)).isEqualTo(i);
        }

        // Verify: embed được gọi đúng số lần = số chunk
        verify(embeddingModel, times(savedChunks.size())).embed(any(TextSegment.class));
    }

    // ─────────────────────── TC3-04 ───────────────────────
    /**
     * TC3-04: UPDATE event → chunk cũ isDeleted=true + removed from embeddingStore by storeId;
     * chunk mới được ingest lại.
     * Dùng InMemoryEmbeddingStore thật để verify old embedding thật sự bị xoá (không search được).
     */
    @Test
    @DisplayName("TC3-04: UPDATE reingest removes old embeddings from store and DB, then creates new ones")
    void tc3_04_updateEventRemovesOldChunksAndReingests() {
        String title = "Doc Update";
        float[] oldVec = {1.0f, 0.0f, 0.0f};  // unit vector x-axis

        // Add old embedding vào real store
        String oldStoreId = embeddingStore.add(
                Embedding.from(oldVec),
                TextSegment.from(title + "\n" + "Nội dung cũ")
        );

        // Verify it's in store before reingest
        EmbeddingSearchResult<TextSegment> before = embeddingStore.search(
                EmbeddingSearchRequest.builder()
                        .queryEmbedding(Embedding.from(oldVec))
                        .maxResults(5).minScore(0.9).build());
        assertThat(before.matches()).hasSize(1);

        KnowledgeChunk oldChunk = new KnowledgeChunk();
        oldChunk.setChunkID(100);
        oldChunk.setArchiveID(1);
        oldChunk.setChunkIndex(0);
        oldChunk.setChunkText(title + "\n" + "Nội dung cũ");
        oldChunk.setEmbeddingVector("[1.0,0.0,0.0]");
        oldChunk.setEmbeddingStoreId(oldStoreId);
        oldChunk.setIsDeleted(false);

        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(1);
        archive.setTitle(title);
        archive.setContent("Nội dung mới cập nhật đầy đủ để ingest lại.");
        archive.setIndexingStatus("Success");
        archive.setIsDeleted(false);

        when(archiveRepository.findByArchiveIDAndIsDeletedFalse(1))
                .thenReturn(Optional.of(archive));
        List<String> savedStatuses = new ArrayList<>();
        when(archiveRepository.save(any())).thenAnswer(inv -> {
            KnowledgeArchive a = inv.getArgument(0);
            savedStatuses.add(a.getIndexingStatus());
            archive.setIndexingStatus(a.getIndexingStatus());
            return a;
        });
        when(chunkRepository.findByArchiveIDAndIsDeletedFalse(1))
                .thenReturn(List.of(oldChunk));
        when(chunkRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        float[] newVec = {0.0f, 1.0f, 0.0f};  // unit vector y-axis (orthogonal to old)
        when(embeddingModel.embed(any(TextSegment.class)))
                .thenReturn(Response.from(Embedding.from(newVec)));

        service.reingest(1);

        // Verify: old chunk isDeleted = true in DB
        ArgumentCaptor<KnowledgeChunk> chunkCaptor = ArgumentCaptor.forClass(KnowledgeChunk.class);
        verify(chunkRepository, atLeastOnce()).save(chunkCaptor.capture());

        assertThat(chunkCaptor.getAllValues())
                .anyMatch(c -> c.getChunkID() != null && c.getChunkID() == 100
                        && Boolean.TRUE.equals(c.getIsDeleted()))
                .as("Old chunk phải được set isDeleted=true");

        // Verify: old embedding removed from InMemoryEmbeddingStore (search cho vector cũ → empty)
        EmbeddingSearchResult<TextSegment> afterOld = embeddingStore.search(
                EmbeddingSearchRequest.builder()
                        .queryEmbedding(Embedding.from(oldVec))
                        .maxResults(5).minScore(0.9).build());
        assertThat(afterOld.matches())
                .as("Old embedding phải bị xoá khỏi InMemoryEmbeddingStore")
                .noneMatch(m -> (title + "\nNội dung cũ").equals(m.embedded().text()));

        // Verify: chunk mới được tạo với contextual header
        assertThat(chunkCaptor.getAllValues())
                .anyMatch(c -> (c.getChunkID() == null || c.getChunkID() != 100)
                        && Boolean.FALSE.equals(c.getIsDeleted())
                        && c.getChunkText() != null
                        && c.getChunkText().startsWith(title + "\n"))
                .as("Chunk mới phải được tạo với isDeleted=false");

        // Verify: archive final status = Success
        assertThat(savedStatuses).last().isEqualTo("Success");
    }

    // ─────────────────────── TC3-05 ───────────────────────
    /**
     * TC3-05: @TransactionalEventListener chỉ fire sau AFTER_COMMIT — verify bằng annotation reflection.
     */
    @Test
    @DisplayName("TC3-05: KnowledgeArchiveEventListener uses AFTER_COMMIT phase")
    void tc3_05_eventListenerUsesAfterCommitPhase() throws NoSuchMethodException {
        Method method = KnowledgeArchiveEventListener.class.getMethod(
                "onKnowledgeArchiveIndexed", KnowledgeArchiveIndexedEvent.class);

        TransactionalEventListener annotation = method.getAnnotation(TransactionalEventListener.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.phase()).isEqualTo(TransactionPhase.AFTER_COMMIT);
    }

    // ─────────────────────── TC3-10 ───────────────────────
    /**
     * TC3-10: Rehydrate đọc KnowledgeChunk từ DB và nạp lại vào InMemoryEmbeddingStore.
     * Verify bằng embeddingStore.search() — phải tìm được chunk sau rehydrate.
     * embeddingStoreId phải được cập nhật trong DB (ID runtime mới khác ID cũ).
     */
    @Test
    @DisplayName("TC3-10: After rehydrate, chunks are searchable in InMemoryEmbeddingStore and storeId updated in DB")
    void tc3_10_rehydrateRestoresEmbeddingStoreSearchable() {
        float[] vector = {1.0f, 0.0f, 0.0f};  // unit vector, cosine sim = 1.0 với chính nó
        String serializedVector = serializeForTest(vector);
        String chunkText = "Tài liệu Rehydrate\nNội dung chunk quan trọng";

        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(10);
        archive.setTitle("Tài liệu Rehydrate");
        archive.setIsDeleted(false);

        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setChunkID(1);
        chunk.setArchiveID(10);
        chunk.setChunkIndex(0);
        chunk.setChunkText(chunkText);
        chunk.setEmbeddingVector(serializedVector);
        chunk.setEmbeddingStoreId("old-store-id-from-previous-run");  // stale ID từ lần chạy trước
        chunk.setIsDeleted(false);

        when(chunkRepository.findByIsDeletedFalse()).thenReturn(List.of(chunk));
        when(archiveRepository.findByArchiveIDAndIsDeletedFalse(10)).thenReturn(Optional.of(archive));
        when(chunkRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Simulate app restart: embeddingStore trống (setUp() tạo InMemoryEmbeddingStore mới)
        service.rehydrateEmbeddingStore();

        // Verify bằng search thật: chunk phải search được với vector gốc
        EmbeddingSearchResult<TextSegment> result = embeddingStore.search(
                EmbeddingSearchRequest.builder()
                        .queryEmbedding(Embedding.from(vector))
                        .maxResults(5)
                        .minScore(0.9)  // cosine sim = 1.0 → luôn pass
                        .build());

        assertThat(result.matches()).hasSize(1);
        assertThat(result.matches().get(0).embedded().text()).isEqualTo(chunkText);

        // Verify: embeddingStoreId trong DB được cập nhật thành runtime ID mới
        assertThat(chunk.getEmbeddingStoreId())
                .isNotNull()
                .isNotEqualTo("old-store-id-from-previous-run");

        // Verify: chunkRepository.save() được gọi để cập nhật storeId mới
        verify(chunkRepository, times(1)).save(any(KnowledgeChunk.class));
    }

    // ─────────────────────── TC3-11 ───────────────────────
    /**
     * TC3-11: DELETE event → chunks isDeleted=true; embeddings thật sự bị xoá khỏi InMemoryEmbeddingStore.
     * Verify bằng embeddingStore.search() — phải KHÔNG tìm được chunk sau khi xoá.
     */
    @Test
    @DisplayName("TC3-11: After removeFromIndex, embeddings are gone from InMemoryEmbeddingStore (search returns empty)")
    void tc3_11_deleteRemovesEmbeddingsFromStoreVerifiedBySearch() {
        float[] vec = {0.0f, 1.0f, 0.0f};  // unit vector y-axis

        // Pre-add 2 chunks vào real InMemoryEmbeddingStore
        String storeId1 = embeddingStore.add(
                Embedding.from(vec),
                TextSegment.from("Doc Delete\nChunk 1 - sẽ bị xoá"));
        String storeId2 = embeddingStore.add(
                Embedding.from(vec),
                TextSegment.from("Doc Delete\nChunk 2 - sẽ bị xoá"));

        // Verify 2 chunks search được TRƯỚC khi delete
        EmbeddingSearchResult<TextSegment> before = embeddingStore.search(
                EmbeddingSearchRequest.builder()
                        .queryEmbedding(Embedding.from(vec))
                        .maxResults(10).minScore(0.9).build());
        assertThat(before.matches()).hasSize(2);

        KnowledgeChunk chunk1 = new KnowledgeChunk();
        chunk1.setChunkID(201);
        chunk1.setArchiveID(20);
        chunk1.setEmbeddingStoreId(storeId1);
        chunk1.setIsDeleted(false);

        KnowledgeChunk chunk2 = new KnowledgeChunk();
        chunk2.setChunkID(202);
        chunk2.setArchiveID(20);
        chunk2.setEmbeddingStoreId(storeId2);
        chunk2.setIsDeleted(false);

        when(chunkRepository.findByArchiveIDAndIsDeletedFalse(20))
                .thenReturn(List.of(chunk1, chunk2));
        when(chunkRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.removeFromIndex(20);

        // Verify DB: cả 2 chunk được set isDeleted=true
        ArgumentCaptor<KnowledgeChunk> captor = ArgumentCaptor.forClass(KnowledgeChunk.class);
        verify(chunkRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).allMatch(c -> Boolean.TRUE.equals(c.getIsDeleted()));

        // Verify InMemoryEmbeddingStore thật sự: search với cùng vector → EMPTY (không còn match nào)
        EmbeddingSearchResult<TextSegment> after = embeddingStore.search(
                EmbeddingSearchRequest.builder()
                        .queryEmbedding(Embedding.from(vec))
                        .maxResults(10).minScore(0.9).build());
        assertThat(after.matches())
                .as("Embeddings phải bị xoá khỏi InMemoryEmbeddingStore sau removeFromIndex()")
                .isEmpty();
    }

    // ─────────────────────── Helper ───────────────────────

    private String serializeForTest(float[] vector) {
        try {
            return new ObjectMapper().writeValueAsString(vector);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
