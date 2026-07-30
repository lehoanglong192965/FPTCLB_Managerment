package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.ReopenRegistrationRequest;
import com.fptu.fcms.dto.request.UpdateEventRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.event.EventStateMachineService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventServiceImplRegistrationWindowTest {

    private static final Integer EVENT_ID = 500;

    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventRegistrationRepository registrationRepository;
    @Mock
    private GuestEventRegistrationRepository guestRegistrationRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private EventStateMachineService stateMachineService;
    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

    @InjectMocks
    private EventServiceImpl service;

    @Test
    void reopeningRegistrationRestoresOpenStatusAndExtendsCloseTime() {
        Event event = closedEvent();
        LocalDateTime newCloseAt = LocalDateTime.now().plusDays(2);

        service.reopenRegistration(EVENT_ID, request(newCloseAt), leader());

        assertEquals(EventStatus.REGISTRATION_OPEN, event.getEventStatus());
        assertEquals(newCloseAt, event.getRegistrationCloseAt());
    }

    @Test
    void reopeningRejectsCloseTimeInThePast() {
        closedEvent();

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.reopenRegistration(EVENT_ID, request(LocalDateTime.now().minusMinutes(5)), leader()));
        assertTrue(error.getMessage().contains("tương lai"));
    }

    @Test
    void reopeningRejectsCloseTimeAfterEventStart() {
        Event event = closedEvent();

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.reopenRegistration(EVENT_ID, request(event.getStartDate().plusHours(1)), leader()));
        assertTrue(error.getMessage().contains("giờ bắt đầu"));
    }

    @Test
    void reopeningRejectsEventThatAlreadyStarted() {
        Event event = closedEvent();
        event.setStartDate(LocalDateTime.now().minusHours(1));

        assertThrows(BusinessRuleException.class,
                () -> service.reopenRegistration(EVENT_ID, request(LocalDateTime.now().plusMinutes(30)), leader()));
    }

    @Test
    void closingEarlyOnlyChangesStatusAndLeavesTheScheduleAlone() {
        Event event = closedEvent();
        event.setEventStatus(EventStatus.REGISTRATION_OPEN);
        LocalDateTime configuredCloseAt = LocalDateTime.now().plusDays(3);
        event.setRegistrationCloseAt(configuredCloseAt);

        service.closeRegistration(EVENT_ID, leader());

        // Mức hoàn tụt xuống bậc thang nhờ trạng thái đổi, nên không cần bẻ mốc lịch.
        assertEquals(EventStatus.REGISTRATION_CLOSED, event.getEventStatus());
        assertEquals(configuredCloseAt, event.getRegistrationCloseAt());
    }

    @Test
    void updateRejectsMovingTheCloseScheduleIntoThePast() {
        closedEvent();

        UpdateEventRequest request = new UpdateEventRequest();
        request.setRegistrationCloseAt(LocalDateTime.now().minusHours(1));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.updateEvent(EVENT_ID, request, leader()));
        assertTrue(error.getMessage().contains("tương lai"));
    }

    @Test
    void updateAllowsOtherEditsWhenTheCloseScheduleIsUnchanged() {
        Event event = closedEvent();
        LocalDateTime alreadyPassedCloseAt = event.getRegistrationCloseAt();
        when(registrationRepository
                .countByEventIDAndRegistrationStatusInAndCapacityExemptFalseAndIsDeletedFalse(eq(EVENT_ID), anyList()))
                .thenReturn(2L);
        when(guestRegistrationRepository
                .countByEventIDAndRegistrationStatusInAndIsDeletedFalse(eq(EVENT_ID), anyList()))
                .thenReturn(0L);

        UpdateEventRequest request = new UpdateEventRequest();
        request.setRegistrationCloseAt(alreadyPassedCloseAt);
        request.setMaxParticipants(80);

        service.updateEvent(EVENT_ID, request, leader());

        assertEquals(80, event.getMaxParticipants());
    }

    private Event closedEvent() {
        Event event = new Event();
        event.setEventID(EVENT_ID);
        event.setEventName("Workshop");
        event.setEventStatus(EventStatus.REGISTRATION_CLOSED);
        event.setStartDate(LocalDateTime.now().plusDays(5));
        event.setEndDate(LocalDateTime.now().plusDays(5).plusHours(3));
        event.setRegistrationOpenAt(LocalDateTime.now().minusDays(10));
        event.setRegistrationCloseAt(LocalDateTime.now().minusHours(2));
        when(eventRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        return event;
    }

    private ReopenRegistrationRequest request(LocalDateTime closeAt) {
        ReopenRegistrationRequest request = new ReopenRegistrationRequest();
        request.setRegistrationCloseAt(closeAt);
        return request;
    }

    private UserPrincipal leader() {
        return new UserPrincipal(9, "leader@fpt.edu.vn", 3, "Leader", "Leader", null,
                List.of(new SimpleGrantedAuthority("ROLE_Leader")));
    }
}
