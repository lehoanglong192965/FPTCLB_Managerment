package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.SchedulerLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
public class GuestOtpExpiryScheduler extends BaseScheduler {

    private final EventRegistrationRepository registrationRepository;

    public GuestOtpExpiryScheduler(SchedulerLogRepository schedulerLogRepository,
                                   EventRegistrationRepository registrationRepository) {
        super(schedulerLogRepository);
        this.registrationRepository = registrationRepository;
    }

    @Scheduled(cron = "${fcms.scheduler.guest-otp-expiry.cron:0 0 * * * ?}")
    @Transactional
    public void expireGuestOtps() {
        LocalDateTime now = LocalDateTime.now();
        String slotSuffix = String.valueOf(now.getHour());
        executeIdempotentIntraday("GuestOtpExpiryScheduler", slotSuffix, () -> {
            LocalDateTime threshold = LocalDateTime.now().minusHours(24);

            // Use custom query instead of findAll() to avoid loading entire table into memory
            List<EventRegistration> pendingRegistrations = registrationRepository
                    .findByRegistrationStatusAndCreatedAtBeforeAndIsDeletedFalse(
                            RegistrationStatus.PENDING_VERIFICATION, threshold);

            for (EventRegistration reg : pendingRegistrations) {
                reg.setRegistrationStatus(RegistrationStatus.CANCELLED);
                reg.setUpdatedAt(LocalDateTime.now());
                log.info("Auto-cancelled expired guest registration: {}", reg.getRegistrationID());
            }

            if (!pendingRegistrations.isEmpty()) {
                registrationRepository.saveAll(pendingRegistrations);
                log.info("Expired {} pending guest registrations", pendingRegistrations.size());
            }
        });
    }
}
