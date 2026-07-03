package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.repository.ContributionBatchRepository;
import com.fptu.fcms.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ContributionAppealWindowScheduler {

    private final ContributionBatchRepository contributionBatchRepository;
    private final AuditLogService auditLogService;

    @Scheduled(cron = "0 */5 * * * ?")
    @Transactional
    public void closeExpiredAppealWindows() {
        LocalDateTime now = LocalDateTime.now();
        for (ContributionBatch batch : contributionBatchRepository
                .findByStatusAndAppealClosesAtBeforeAndIsDeletedFalse(ContributionBatchStatus.APPEAL_OPEN, now)) {
            ContributionBatchStatus beforeStatus = batch.getStatus();
            batch.setStatus(ContributionBatchStatus.APPEAL_RESOLUTION);
            batch.setUpdatedAt(now);
            ContributionBatch saved = contributionBatchRepository.save(batch);
            auditLogService.record(
                    null,
                    "ContributionBatch",
                    saved.getBatchID(),
                    "CONTRIBUTION_APPEAL_WINDOW_CLOSED",
                    beforeStatus,
                    saved.getStatus(),
                    "Automatically closed expired 24-hour appeal window"
            );
        }
    }
}