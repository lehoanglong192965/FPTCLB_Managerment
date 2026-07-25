package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventCapacityService;
import com.fptu.fcms.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventLifecycleScheduler {

    private static final EventStatus STATUS_APPROVED = EventStatus.APPROVED;
    private static final EventStatus STATUS_REG_CLOSED = EventStatus.REGISTRATION_CLOSED;
    private static final EventStatus STATUS_ONGOING = EventStatus.ONGOING;

    private final EventRepository eventRepository;
    private final EventCapacityService eventCapacityService;
    private final EventService eventService;

    @Scheduled(cron = "0 */5 * * * ?")
    public void openRegistrationWhenDue() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_APPROVED);
        for (Event event : events) {
            LocalDateTime openAt = event.getRegistrationOpenAt() != null
                    ? event.getRegistrationOpenAt()
                    : (event.getStartDate() == null ? null : event.getStartDate().minusDays(7));
            boolean beforeClose = event.getRegistrationCloseAt() == null || now.isBefore(event.getRegistrationCloseAt());
            if (openAt != null && !now.isBefore(openAt) && beforeClose) {
                try {
                    eventService.openRegistrationAutomatically(event.getEventID());
                    eventCapacityService.resetCapacity(event.getEventID(), event.getMaxParticipants());
                } catch (RuntimeException exception) {
                    log.warn("Could not automatically open registration for event {}", event.getEventID(), exception);
                }
            }
        }
    }

    @Scheduled(cron = "30 */5 * * * ?")
    public void startEventsWhenDue() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_REG_CLOSED);
        for (Event event : events) {
            if (event.getStartDate() != null && !now.isBefore(event.getStartDate())) {
                try {
                    eventService.startEventAutomatically(event.getEventID());
                } catch (RuntimeException exception) {
                    log.warn("Could not automatically start event {}", event.getEventID(), exception);
                }
            }
        }
    }

    @Scheduled(cron = "0 */5 * * * ?")
    public void completeEventsWhenDue() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_ONGOING);
        for (Event event : events) {
            if (event.getEndDate() != null && !now.isBefore(event.getEndDate())) {
                try {
                    eventService.finishEventAutomatically(event.getEventID());
                } catch (RuntimeException exception) {
                    log.warn("Could not automatically finish event {}", event.getEventID(), exception);
                }
            }
        }
    }
}
