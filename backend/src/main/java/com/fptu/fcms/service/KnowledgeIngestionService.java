package com.fptu.fcms.service;

/**
 * Ingest KnowledgeArchive → chunk + embed + lưu KnowledgeChunk + InMemoryEmbeddingStore.
 * Batch 4 — không bao gồm chat/retrieval endpoint.
 */
public interface KnowledgeIngestionService {

    /**
     * Ingest (CREATE): set Processing → chunk/embed/store → Success; retry hết → Failed.
     */
    void ingest(Integer archiveID);

    /**
     * Re-ingest (UPDATE): soft-delete + remove runtime embeddings cũ, rồi ingest lại.
     */
    void reingest(Integer archiveID);

    /**
     * Remove index (DELETE): soft-delete chunks + remove runtime embeddings.
     * Không cần load archive (có thể đã soft-delete do @SQLRestriction).
     */
    void removeFromIndex(Integer archiveID);

    /**
     * Rehydrate InMemoryEmbeddingStore từ KnowledgeChunk (source of truth) lúc startup.
     * Cập nhật embeddingStoreId runtime mới vào DB nếu id thay đổi.
     */
    void rehydrateEmbeddingStore();
}
