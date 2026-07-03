package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.repository.ContributionBatchRepository;
import com.fptu.fcms.repository.SchedulerLogRepository;
import com.fptu.fcms.service.ContributionBatchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
public class AppealFinalizeScheduler extends BaseScheduler {

    private final ContributionBatchRepository batchRepository;
    private final ContributionBatchService contributionBatchService;

    public AppealFinalizeScheduler(SchedulerLogRepository schedulerLogRepository,
                                   ContributionBatchRepository batchRepository,
                                   ContributionBatchService contributionBatchService) {
        super(schedulerLogRepository);
        this.batchRepository = batchRepository;
        this.contributionBatchService = contributionBatchService;
    }

    /**
     * BE-CON-08: Auto-finalize contribution batches after the appeal window closes.
     */
    @Scheduled(cron = "${fcms.scheduler.appeal-finalize.cron:0 0 * * * ?}")
    @Transactional
    public void finalizeExpiredAppeals() {
        LocalDateTime now = LocalDateTime.now();
        String slotSuffix = String.valueOf(now.getHour());
        executeIdempotentIntraday("AppealFinalizeScheduler", slotSuffix, () -> {
            List<ContributionBatch> batches = batchRepository.findByStatusAndIsDeletedFalse(
                    ContributionBatchStatus.APPEAL_WINDOW);

            for (ContributionBatch batch : batches) {
                if (batch.getAppealClosesAt() == null || now.isBefore(batch.getAppealClosesAt())) {
                    continue;
                }
                try {
                    contributionBatchService.finalizeBatch(batch.getEventID(), null);
                    log.info("Auto-finalized contribution batch {}", batch.getBatchID());
                } catch (Exception ex) {
                    log.warn("Skipping auto-finalize for contribution batch {}: {}", batch.getBatchID(), ex.getMessage());
                }
            }
        });
    }
}
