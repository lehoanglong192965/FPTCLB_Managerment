package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.repository.KnowledgeArchiveRepository;
import com.fptu.fcms.repository.KnowledgeChunkRepository;
import com.fptu.fcms.service.KnowledgeIngestionService;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC3-06 — @Retryable integration test.
 * <p>
 * Phải dùng Spring context (SpringExtension + @EnableRetry + @EnableAspectJAutoProxy)
 * để @Retryable được áp dụng qua AOP proxy.
 * <p>
 * Test gọi service.ingest() qua proxy → embed() throw → Spring Retry bắt → retry 3 lần
 * → @Recover gọi → indexingStatus = "Failed".
 * <p>
 * ⚠️ Test này chậm hơn (~1.5s) do @Backoff(delay=500, multiplier=2.0): 2 khoảng chờ 500ms + 1000ms.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = KnowledgeIngestionRetryTest.RetryTestConfig.class)
class KnowledgeIngestionRetryTest {

    /**
     * Minimal Spring context: chỉ cần @EnableRetry + @EnableAspectJAutoProxy + mock beans.
     * Không cần @EnableTransactionManagement — @Transactional bị ignore (acceptable cho test này).
     */
    @Configuration
    @EnableRetry
    @EnableAspectJAutoProxy(proxyTargetClass = true)
    static class RetryTestConfig {

        @Bean
        public KnowledgeArchiveRepository archiveRepository() {
            return mock(KnowledgeArchiveRepository.class);
        }

        @Bean
        public KnowledgeChunkRepository chunkRepository() {
            KnowledgeChunkRepository m = mock(KnowledgeChunkRepository.class);
            // Safe default cho @PostConstruct rehydrateOnStartup()
            when(m.findByIsDeletedFalse()).thenReturn(List.of());
            return m;
        }

        @Bean(name = "documentEmbeddingModel")
        public EmbeddingModel documentEmbeddingModel() {
            return mock(EmbeddingModel.class);
        }

        @Bean
        public EmbeddingStore<TextSegment> embeddingStore() {
            return new InMemoryEmbeddingStore<>();
        }

        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        /**
         * KnowledgeIngestionServiceImpl là bean thật (không mock) — cần Spring AOP proxy
         * để @Retryable và @Recover hoạt động.
         */
        @Bean
        public KnowledgeIngestionServiceImpl knowledgeIngestionService(
                KnowledgeArchiveRepository archiveRepository,
                KnowledgeChunkRepository chunkRepository,
                @Qualifier("documentEmbeddingModel") EmbeddingModel documentEmbeddingModel,
                EmbeddingStore<TextSegment> embeddingStore,
                ObjectMapper objectMapper) {
            return new KnowledgeIngestionServiceImpl(
                    archiveRepository, chunkRepository,
                    documentEmbeddingModel, embeddingStore, objectMapper);
        }
    }

    /** Injected via Spring proxy — @Retryable và @Recover sẽ được áp dụng. */
    @Autowired
    KnowledgeIngestionService service;

    @Autowired
    KnowledgeArchiveRepository archiveRepository;

    @Autowired
    @Qualifier("documentEmbeddingModel")
    EmbeddingModel documentEmbeddingModel;

    @Autowired
    KnowledgeChunkRepository chunkRepository;

    @BeforeEach
    void resetMockInteractions() {
        // Xoá invocation history giữa các test (stubs được giữ nguyên)
        clearInvocations(archiveRepository, documentEmbeddingModel, chunkRepository);
        // Restore safe default sau clearInvocations
        when(chunkRepository.findByIsDeletedFalse()).thenReturn(List.of());
    }

    // ─────────────────────── TC3-06 ───────────────────────
    /**
     * TC3-06: @Retryable thật sự chạy qua Spring AOP proxy.
     * - embed() throw RuntimeException → @Retryable retry đúng maxAttempts=3 lần
     * - Sau khi exhausted, @Recover gọi → indexingStatus = "Failed"
     * - Không bị stuck ở "Processing"
     * <p>
     * ⚠️ Test chạy ~1.5 giây (2 khoảng backoff: 500ms + 1000ms).
     */
    @Test
    @DisplayName("TC3-06: @Retryable exhausted after 3 embed() calls → @Recover sets indexingStatus=Failed")
    void tc3_06_retryableExhaustedSetsStatusToFailed() {
        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(5);
        archive.setTitle("Retry Test Doc");
        archive.setContent("Nội dung đủ để tạo ít nhất 1 chunk qua DocumentSplitters.");
        archive.setIndexingStatus("Pending");
        archive.setIsDeleted(false);

        when(archiveRepository.findByArchiveIDAndIsDeletedFalse(5))
                .thenReturn(Optional.of(archive));
        when(chunkRepository.findByArchiveIDAndIsDeletedFalse(5))
                .thenReturn(List.of());

        // Track trạng thái được lưu theo thứ tự
        List<String> savedStatuses = new ArrayList<>();
        when(archiveRepository.save(any())).thenAnswer(inv -> {
            KnowledgeArchive a = inv.getArgument(0);
            savedStatuses.add(a.getIndexingStatus());
            archive.setIndexingStatus(a.getIndexingStatus());
            return a;
        });

        // Mock embed() LUÔN throw → trigger retry mỗi attempt
        when(documentEmbeddingModel.embed(any(TextSegment.class)))
                .thenThrow(new RuntimeException("Simulated Gemini API failure"));

        // *** Gọi qua Spring proxy — @Retryable ĐƯỢC áp dụng ***
        // Không throw exception ra ngoài vì @Recover catch sau khi retry exhausted
        service.ingest(5);

        // ── Verify 1: embed() được gọi đúng 3 lần (maxAttempts=3) ──
        verify(documentEmbeddingModel, times(3)).embed(any(TextSegment.class));

        // ── Verify 2: archive status cuối cùng = "Failed" (không stuck ở "Processing") ──
        assertThat(savedStatuses).last()
                .isEqualTo("Failed")
                .as("@Recover phải set indexingStatus='Failed' sau khi retry exhausted");

        assertThat(archive.getIndexingStatus())
                .isEqualTo("Failed")
                .as("Không được stuck ở 'Processing' sau khi retry hết");

        // ── Verify 3: "Processing" được save (trên mỗi lần retry), "Failed" save lần cuối ──
        assertThat(savedStatuses)
                .contains("Processing")
                .last().isEqualTo("Failed");
    }
}
