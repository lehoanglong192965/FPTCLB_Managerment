package com.fptu.fcms.event;

import com.fptu.fcms.service.KnowledgeIngestionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest(classes = KnowledgeArchiveEventListenerAsyncIntegrationTest.TestApplication.class)
class KnowledgeArchiveEventListenerAsyncIntegrationTest {

    private static final Integer ARCHIVE_ID = 77;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private ThreadPoolTaskExecutor taskExecutor;

    @MockBean
    private KnowledgeIngestionService knowledgeIngestionService;

    @Test
    @Timeout(10)
    void committedEventDoesNotBlockPublisherWhileIngestionIsRunning() throws Exception {
        CountDownLatch ingestionStarted = new CountDownLatch(1);
        CountDownLatch releaseIngestion = new CountDownLatch(1);
        CountDownLatch ingestionFinished = new CountDownLatch(1);

        doAnswer(invocation -> {
            ingestionStarted.countDown();
            try {
                releaseIngestion.await(5, TimeUnit.SECONDS);
            } finally {
                ingestionFinished.countDown();
            }
            return null;
        }).when(knowledgeIngestionService).ingest(ARCHIVE_ID);

        CompletableFuture<Void> publisherFuture = CompletableFuture.runAsync(() ->
                new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                    eventPublisher.publishEvent(
                            new KnowledgeArchiveIndexedEvent(ARCHIVE_ID, "CREATE")
                    );

                    verifyNoInteractions(knowledgeIngestionService);
                })
        );

        try {
            assertThat(ingestionStarted.await(3, TimeUnit.SECONDS))
                    .as("Listener should run only after the transaction commits")
                    .isTrue();

            publisherFuture.get(1, TimeUnit.SECONDS);
            verify(knowledgeIngestionService).ingest(ARCHIVE_ID);
        } finally {
            releaseIngestion.countDown();
            publisherFuture.get(3, TimeUnit.SECONDS);
            assertThat(ingestionFinished.await(3, TimeUnit.SECONDS)).isTrue();
        }
    }

    @Test
    @Timeout(10)
    void committedEventsMapToTheExpectedIngestionOperations() throws Exception {
        publishAfterCommit(new KnowledgeArchiveIndexedEvent(101, "CREATE"));
        publishAfterCommit(new KnowledgeArchiveIndexedEvent(102, "UPDATE"));
        publishAfterCommit(new KnowledgeArchiveIndexedEvent(103, "DELETE"));
        awaitAsyncTasks();

        verify(knowledgeIngestionService).ingest(101);
        verify(knowledgeIngestionService).reingest(102);
        verify(knowledgeIngestionService).removeFromIndex(103);
    }

    @Test
    @Timeout(10)
    void unknownAndInvalidEventsDoNotInvokeIngestion() throws Exception {
        publishAfterCommit(new KnowledgeArchiveIndexedEvent(104, "UNKNOWN"));
        publishAfterCommit(new KnowledgeArchiveIndexedEvent(null, "CREATE"));
        publishAfterCommit(new KnowledgeArchiveIndexedEvent(105, null));
        awaitAsyncTasks();

        verifyNoInteractions(knowledgeIngestionService);
    }

    private void publishAfterCommit(KnowledgeArchiveIndexedEvent event) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status ->
                eventPublisher.publishEvent(event)
        );
    }

    private void awaitAsyncTasks() throws Exception {
        taskExecutor.submit(() -> { }).get(3, TimeUnit.SECONDS);
    }

    @SpringBootConfiguration
    @EnableAsync
    @EnableTransactionManagement
    @Import(KnowledgeArchiveEventListener.class)
    static class TestApplication {

        @Bean(name = "taskExecutor", destroyMethod = "shutdown")
        ThreadPoolTaskExecutor taskExecutor() {
            ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
            executor.setCorePoolSize(1);
            executor.setMaxPoolSize(1);
            executor.setQueueCapacity(20);
            executor.setThreadNamePrefix("knowledge-archive-test-");
            executor.initialize();
            return executor;
        }

        @Bean
        PlatformTransactionManager transactionManager() {
            return new AbstractPlatformTransactionManager() {
                @Override
                protected Object doGetTransaction() {
                    return new Object();
                }

                @Override
                protected void doBegin(
                        Object transaction,
                        TransactionDefinition definition
                ) {
                    // No external resource is needed; transaction synchronization is sufficient.
                }

                @Override
                protected void doCommit(DefaultTransactionStatus status) {
                    // Commit callbacks are triggered by AbstractPlatformTransactionManager.
                }

                @Override
                protected void doRollback(DefaultTransactionStatus status) {
                    // No external resource to roll back.
                }
            };
        }
    }
}
