package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.repository.ContributionBatchRepository;
import com.fptu.fcms.repository.SchedulerLogRepository;
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

    public AppealFinalizeScheduler(SchedulerLogRepository schedulerLogRepository,
                                   ContributionBatchRepository batchRepository) {
        super(schedulerLogRepository);
        this.batchRepository = batchRepository;
    }

    /**
     * BE-CON-08: Auto-finalize contribution batches that are in APPEAL_RESOLUTION status.
     * After the appeal window closes (handled by ContributionAppealWindowScheduler),
     * batches move to APPEAL_RESOLUTION. This scheduler then finalizes them.
     */
    @Scheduled(cron = "${fcms.scheduler.appeal-finalize.cron:0 0 * * * ?}")
    @Transactional
    public void finalizeExpiredAppeals() {
        LocalDateTime now = LocalDateTime.now();
        String slotSuffix = String.valueOf(now.getHour());
        executeIdempotentIntraday("AppealFinalizeScheduler", slotSuffix, () -> {
            List<ContributionBatch> batches = batchRepository.findByStatusAndIsDeletedFalse(
                    ContributionBatchStatus.APPEAL_RESOLUTION);

            for (ContributionBatch batch : batches) {
                batch.setStatus(ContributionBatchStatus.FINALIZED);
                batch.setUpdatedAt(LocalDateTime.now());
                log.info("Auto-finalized contribution batch {} from APPEAL_RESOLUTION to CONTRIBUTION_FINALIZED",
                        batch.getBatchID());
            }

            if (!batches.isEmpty()) {
                batchRepository.saveAll(batches);
                log.info("Finalized {} contribution batches", batches.size());
            }
        });
    }
}
