package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventService;
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
public class RegistrationCloseScheduler {

    private static final EventStatus STATUS_REGISTRATION_OPEN = EventStatus.REGISTRATION_OPEN;

    private final EventRepository eventRepository;
    private final EventService eventService;

    @Scheduled(cron = "0 */5 * * * ?")
    @Transactional
    public void closeExpiredRegistrations() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> openEvents = eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_REGISTRATION_OPEN);
        for (Event event : openEvents) {
            if (event.getRegistrationCloseAt() == null || event.getRegistrationCloseAt().isAfter(now)) {
                continue;
            }
            try {
                eventService.closeRegistration(event.getEventID(), null);
                log.info("Auto-closed registration for event {}", event.getEventID());
            } catch (Exception ex) {
                log.warn("Skipping auto-close for event {}: {}", event.getEventID(), ex.getMessage());
            }
        }
    }
}
