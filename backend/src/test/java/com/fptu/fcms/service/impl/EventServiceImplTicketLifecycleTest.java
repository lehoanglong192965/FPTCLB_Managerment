package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTicketLifecycleTest {

    private static final Integer EVENT_ID = 100;

    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventRegistrationRepository registrationRepository;
    @Mock
    private GuestEventRegistrationRepository guestRegistrationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private ApplicationEventPublisher applicationEventPublisher;
    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;

    @InjectMocks
    private EventServiceImpl service;

    @Test
    void cancellingEventRevokesOnlyActiveStaticTickets() {
        Event event = new Event();
        event.setEventID(EVENT_ID);
        event.setClubID(10);
        event.setEventName("Secure QR event");
        event.setEventStatus(EventStatus.APPROVED);

        EventRegistration activeTicket = registration(201, "active-ticket", null);
        EventRegistration withoutTicket = registration(202, null, null);
        LocalDateTime alreadyRevokedAt = LocalDateTime.now().minusDays(1);
        EventRegistration alreadyRevoked = registration(203, "old-ticket", alreadyRevokedAt);

        when(eventRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);
        when(registrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of(activeTicket, withoutTicket, alreadyRevoked));
        when(userRepository.findAllByUserIDIn(any())).thenReturn(List.of());
        when(guestRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(List.of());

        CancelEventRequest request = new CancelEventRequest();
        request.setReason("Venue unavailable");
        service.cancelEvent(10, EVENT_ID, request, principal());

        assertEquals(EventStatus.CANCELLED, event.getEventStatus());
        assertNotNull(activeTicket.getTicketRevokedAt());
        assertNull(withoutTicket.getTicketRevokedAt());
        assertEquals(alreadyRevokedAt, alreadyRevoked.getTicketRevokedAt());

        ArgumentCaptor<Iterable<EventRegistration>> savedTickets = ArgumentCaptor.forClass(Iterable.class);
        verify(registrationRepository).saveAll(savedTickets.capture());
        List<EventRegistration> persisted = new java.util.ArrayList<>();
        savedTickets.getValue().forEach(persisted::add);
        assertEquals(List.of(activeTicket, withoutTicket, alreadyRevoked), persisted);
        verify(applicationEventPublisher).publishEvent(any(Object.class));
    }

    private EventRegistration registration(Integer id, String ticketCode, LocalDateTime ticketRevokedAt) {
        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(id);
        registration.setUserID(id);
        registration.setTicketCode(ticketCode);
        registration.setTicketRevokedAt(ticketRevokedAt);
        return registration;
    }

    private UserPrincipal principal() {
        return new UserPrincipal(
                17,
                "leader@fpt.edu.vn",
                3,
                "Leader",
                "Leader",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_Leader"))
        );
    }
}
