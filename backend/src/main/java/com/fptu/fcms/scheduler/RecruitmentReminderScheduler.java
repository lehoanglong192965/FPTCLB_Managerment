package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.RecruitmentCycle;
import com.fptu.fcms.repository.RecruitmentCycleRepository;
import com.fptu.fcms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecruitmentReminderScheduler {

    private final RecruitmentCycleRepository cycleRepository;
    private final NotificationService notificationService;

    // Run daily at 06:00 to check recruitment cycles older than 15 days
    @Scheduled(cron = "0 0 6 * * ?")
    @Transactional
    public void runDailyReminderCheck() {
        log.info("Starting RecruitmentReminderScheduler check (BR-R03). Searching cycles older than 15 days...");

        LocalDate threshold = LocalDate.now().minusDays(15);
        List<RecruitmentCycle> cycles = cycleRepository.findOpenCyclesStartedBefore(threshold);

        if (cycles == null || cycles.isEmpty()) {
            log.info("No recruitment cycles require reminder today.");
            return;
        }

        for (RecruitmentCycle cycle : cycles) {
            try {
                notificationService.notifyAdminCloseOrExtend(cycle);

                // mark as reminded so we don't spam repeatedly
                cycle.setReminded(true);
                cycleRepository.save(cycle);

                log.info("Reminder sent and marked for cycle id={}", cycle.getCycleID());
            } catch (Exception ex) {
                log.error("Failed to send reminder for recruitment cycle id={}", cycle.getCycleID(), ex);
            }
        }
    }
}
