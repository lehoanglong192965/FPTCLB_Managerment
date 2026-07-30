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

    // Quét mỗi phút: mốc mở đăng ký do Leader đặt chính xác tới phút, quét 5 phút/lần
    // khiến sự kiện "đến giờ rồi mà chưa mở" lâu nhất tới gần 5 phút.
    @Scheduled(cron = "${fcms.scheduler.event-lifecycle.open-cron:0 * * * * ?}")
    public void openRegistrationWhenDue() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_APPROVED);
        for (Event event : events) {
            LocalDateTime openAt = event.getRegistrationOpenAt() != null
                    ? event.getRegistrationOpenAt()
                    : (event.getStartDate() == null ? null : event.getStartDate().minusDays(7));
            if (openAt != null && !now.isBefore(openAt)) {
                try {
                    // Always perform the missing transition first. This also
                    // recovers an APPROVED event when the application was down
                    // across both its registration-open and registration-close times.
                    eventService.openRegistrationAutomatically(event.getEventID());
                    eventCapacityService.resetCapacity(event.getEventID(), event.getMaxParticipants());
                    boolean closeReached = event.getRegistrationCloseAt() != null
                            && !now.isBefore(event.getRegistrationCloseAt());
                    boolean startReached = event.getStartDate() != null
                            && !now.isBefore(event.getStartDate());
                    if (closeReached || startReached) {
                        eventService.closeRegistrationAutomatically(event.getEventID());
                    }
                    if (startReached) {
                        eventService.startEventAutomatically(event.getEventID());
                    }
                } catch (RuntimeException exception) {
                    log.warn("Could not recover registration lifecycle for event {}", event.getEventID(), exception);
                }
            }
        }
    }

    @Scheduled(cron = "${fcms.scheduler.event-lifecycle.start-cron:30 * * * * ?}")
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

    @Scheduled(cron = "${fcms.scheduler.event-lifecycle.complete-cron:0 * * * * ?}")
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
