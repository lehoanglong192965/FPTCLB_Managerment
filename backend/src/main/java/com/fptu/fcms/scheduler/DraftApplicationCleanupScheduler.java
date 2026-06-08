package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.RecruitmentApplication;
import com.fptu.fcms.repository.RecruitmentApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DraftApplicationCleanupScheduler {

    private static final int DRAFT_EXPIRED_DAYS = 7;

    private final RecruitmentApplicationRepository recruitmentApplicationRepository;

    // Chạy mỗi ngày lúc 01:00 sáng
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void softDeleteExpiredDraftApplications() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(DRAFT_EXPIRED_DAYS);

        List<RecruitmentApplication> expiredDrafts =
                recruitmentApplicationRepository
                        .findByStatusAndIsDeletedFalseAndCreatedAtBefore("Draft", threshold);

        if (expiredDrafts.isEmpty()) {
            log.info("No expired Draft recruitment applications found.");
            return;
        }

        for (RecruitmentApplication app : expiredDrafts) {
            app.setIsDeleted(true);
        }

        recruitmentApplicationRepository.saveAll(expiredDrafts);

        log.info("Soft deleted {} expired Draft recruitment applications older than {} days.",
                expiredDrafts.size(),
                DRAFT_EXPIRED_DAYS);
    }
}