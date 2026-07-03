package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.SchedulerLogRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class RegistrationCloseScheduler extends BaseScheduler {

    private static final EventStatus STATUS_REGISTRATION_OPEN = EventStatus.REGISTRATION_OPEN;

    private final EventRepository eventRepository;
    private final EventService eventService;

    public RegistrationCloseScheduler(SchedulerLogRepository schedulerLogRepository, 
                                      EventRepository eventRepository, 
                                      EventService eventService) {
        super(schedulerLogRepository);
        this.eventRepository = eventRepository;
        this.eventService = eventService;
    }

    @Scheduled(cron = "${fcms.scheduler.registration-close.cron:0 */5 * * * ?}")
    @Transactional
    public void closeExpiredRegistrations() {
        LocalDateTime now = LocalDateTime.now();
        String slotSuffix = now.getHour() + "_" + (now.getMinute() / 5);
        executeIdempotentIntraday("RegistrationCloseScheduler", slotSuffix, () -> {
            List<Event> openEvents = eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_REGISTRATION_OPEN);
            
            UserPrincipal systemUser = new UserPrincipal(-1, "system@scheduler", -1, Collections.emptyList());
            
            for (Event event : openEvents) {
                if (event.getRegistrationCloseAt() == null || event.getRegistrationCloseAt().isAfter(now)) {
                    continue;
                }
                try {
                    eventService.closeRegistration(event.getEventID(), systemUser);
                    log.info("Auto-closed registration for event {}", event.getEventID());
                } catch (Exception ex) {
                    log.warn("Skipping auto-close for event {}: {}", event.getEventID(), ex.getMessage());
                }
            }
        });
    }
}
