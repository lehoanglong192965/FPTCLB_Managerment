-- ============================================================================
-- PATCH: KnowledgeChunk EmbeddingStore ID
-- Required because LangChain4j 1.17.2 does not expose
-- EmbeddingStore.add(String id, Embedding embedding, Embedded embedded).
-- Idempotent: safe for local DBs already patched manually.
-- ============================================================================

IF COL_LENGTH('dbo.KnowledgeChunk', 'embeddingStoreId') IS NULL
BEGIN
    ALTER TABLE dbo.KnowledgeChunk
        ADD embeddingStoreId VARCHAR(64) NULL;
END;
GO

-- ============================================================================
-- END PATCH
-- ============================================================================
