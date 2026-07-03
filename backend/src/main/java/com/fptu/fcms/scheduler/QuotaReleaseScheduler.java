package com.fptu.fcms.scheduler;

import com.fptu.fcms.repository.SchedulerLogRepository;
import com.fptu.fcms.service.RegistrationAllocationPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Slf4j
public class QuotaReleaseScheduler extends BaseScheduler {

    private final RegistrationAllocationPort allocationPort;

    public QuotaReleaseScheduler(SchedulerLogRepository schedulerLogRepository,
                                 RegistrationAllocationPort allocationPort) {
        super(schedulerLogRepository);
        this.allocationPort = allocationPort;
    }

    @Scheduled(cron = "${fcms.scheduler.quota-release.cron:0 */15 * * * ?}")
    @Transactional
    public void releaseExpiredQuotas() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String slotSuffix = now.getHour() + "_" + (now.getMinute() / 15);
        executeIdempotentIntraday("QuotaReleaseScheduler", slotSuffix, () -> {
            // Ideally we iterate over active events and call release
            // Assuming allocationPort has a method or we process global release
            log.info("Releasing expired quotas... (Placeholder until allocationPort supports global release)");
        });
    }
}
