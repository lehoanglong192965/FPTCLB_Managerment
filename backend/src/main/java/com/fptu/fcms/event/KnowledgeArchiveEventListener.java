package com.fptu.fcms.event;

import com.fptu.fcms.service.KnowledgeIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Lắng nghe KnowledgeArchiveIndexedEvent SAU khi transaction DEV2 commit (AFTER_COMMIT).
 * Batch 4 — chỉ ingestion, không chat.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class KnowledgeArchiveEventListener {

    private final KnowledgeIngestionService knowledgeIngestionService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onKnowledgeArchiveIndexed(KnowledgeArchiveIndexedEvent event) {
        if (event == null || event.archiveID() == null || event.operation() == null) {
            log.warn("Ignore invalid KnowledgeArchiveIndexedEvent: {}", event);
            return;
        }

        String operation = event.operation().trim().toUpperCase();
        Integer archiveID = event.archiveID();
        log.info("KnowledgeArchiveIndexedEvent AFTER_COMMIT archiveID={} operation={}",
                archiveID, operation);

        switch (operation) {
            case "CREATE" -> knowledgeIngestionService.ingest(archiveID);
            case "UPDATE" -> knowledgeIngestionService.reingest(archiveID);
            case "DELETE" -> knowledgeIngestionService.removeFromIndex(archiveID);
            default -> log.warn("Unknown operation '{}' for archiveID={}", operation, archiveID);
        }
    }
}
