package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventCapacityService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EventLifecycleScheduler {

    private static final EventStatus STATUS_APPROVED = EventStatus.APPROVED;
    private static final EventStatus STATUS_REG_OPEN = EventStatus.REGISTRATION_OPEN;
    private static final EventStatus STATUS_ONGOING = EventStatus.ONGOING;
    private static final EventStatus STATUS_COMPLETED = EventStatus.COMPLETED;
    private static final EventStatus STATUS_CLOSED = EventStatus.CLOSED;

    private final EventRepository eventRepository;
    private final EventCapacityService eventCapacityService;

    @Scheduled(cron = "0 */5 * * * ?")
    @Transactional
    public void openRegistrationWhenDue() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_APPROVED);
        for (Event event : events) {
            LocalDateTime openAt = event.getStartDate() == null ? null : event.getStartDate().minusDays(7);
            if (openAt != null && !now.isBefore(openAt)) {
                event.setEventStatus(STATUS_REG_OPEN);
                eventRepository.save(event);
                eventCapacityService.resetCapacity(event.getEventID(), event.getMaxParticipants());
            }
        }
    }

    @Scheduled(cron = "0 */5 * * * ?")
    @Transactional
    public void closeEventsWhenDue() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findByEventStatusInAndIsDeletedFalse(List.of(STATUS_REG_OPEN, STATUS_ONGOING));
        for (Event event : events) {
            if (event.getEndDate() != null && !now.isBefore(event.getEndDate())) {
                event.setEventStatus(STATUS_CLOSED);
                eventRepository.save(event);
            }
        }
    }
}
