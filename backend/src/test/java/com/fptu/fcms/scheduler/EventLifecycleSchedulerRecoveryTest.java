package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventCapacityService;
import com.fptu.fcms.service.EventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventLifecycleSchedulerRecoveryTest {

    @Mock private EventRepository eventRepository;
    @Mock private EventCapacityService eventCapacityService;
    @Mock private EventService eventService;
    @InjectMocks private EventLifecycleScheduler scheduler;

    @Test
    void approvedEventMissedAcrossOpenCloseAndStartCatchesUpAllTransitions() {
        Event event = new Event();
        event.setEventID(50);
        event.setMaxParticipants(100);
        event.setRegistrationOpenAt(LocalDateTime.now().minusDays(2));
        event.setRegistrationCloseAt(LocalDateTime.now().minusDays(1));
        event.setStartDate(LocalDateTime.now().minusHours(1));
        when(eventRepository.findByEventStatusAndIsDeletedFalse(EventStatus.APPROVED))
                .thenReturn(List.of(event));

        scheduler.openRegistrationWhenDue();

        var ordered = inOrder(eventService, eventCapacityService);
        ordered.verify(eventService).openRegistrationAutomatically(50);
        ordered.verify(eventCapacityService).resetCapacity(50, 100);
        ordered.verify(eventService).closeRegistrationAutomatically(50);
        ordered.verify(eventService).startEventAutomatically(50);
    }
}
