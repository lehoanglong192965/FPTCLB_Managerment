package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.EventAssignmentRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRole;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.EventRoleRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventAssignmentAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplAssignmentAuthorizationTest {

    private static final Integer EVENT_ID = 100;
    private static final Integer USER_ID = 200;

    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private EventAssignmentRepository eventAssignmentRepository;
    @Mock
    private AttendanceSessionRepository attendanceSessionRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventRoleRepository eventRoleRepository;

    @InjectMocks
    private EventServiceImpl service;

    @Test
    void addAssignmentAuthorizesBeforeLoadingOrSaving() {
        UserPrincipal currentUser = principal();
        EventAssignmentRequest request = new EventAssignmentRequest();
        request.setUserID(USER_ID);
        request.setEventRoleID(5);

        Event event = new Event();
        event.setEventID(EVENT_ID);
        EventRole eventRole = new EventRole();
        eventRole.setEventRoleID(5);

        when(eventRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(Optional.of(event));
        when(eventRoleRepository.findByEventRoleIDAndIsDeletedFalse(5)).thenReturn(Optional.of(eventRole));

        service.addAssignment(EVENT_ID, request, currentUser);

        InOrder order = inOrder(
                eventAssignmentAccessService,
                eventRepository,
                eventRoleRepository,
                eventAssignmentRepository
        );
        order.verify(eventAssignmentAccessService).ensureCanManageEvent(EVENT_ID, currentUser);
        order.verify(eventRepository).findByEventIDAndIsDeletedFalse(EVENT_ID);
        order.verify(eventRoleRepository).findByEventRoleIDAndIsDeletedFalse(5);
        order.verify(eventAssignmentRepository).save(any(EventAssignment.class));
    }

    @Test
    void getAssignmentsAuthorizesBeforeReadingAssignments() {
        UserPrincipal currentUser = principal();
        List<EventAssignment> expected = List.of(new EventAssignment());
        when(eventAssignmentRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(expected);

        List<EventAssignment> actual = service.getAssignments(EVENT_ID, currentUser);

        assertEquals(expected, actual);
        InOrder order = inOrder(eventAssignmentAccessService, eventAssignmentRepository);
        order.verify(eventAssignmentAccessService).ensureCanManageEvent(EVENT_ID, currentUser);
        order.verify(eventAssignmentRepository).findByEventIDAndIsDeletedFalse(EVENT_ID);
    }

    @Test
    void getCheckedInAttendeesAuthorizesBeforeReadingSession() {
        UserPrincipal currentUser = principal();
        when(attendanceSessionRepository.findByEventID(EVENT_ID)).thenReturn(Optional.empty());

        assertTrue(service.getCheckedInAttendees(EVENT_ID, currentUser).isEmpty());

        InOrder order = inOrder(eventAssignmentAccessService, attendanceSessionRepository);
        order.verify(eventAssignmentAccessService).ensureCanManageCheckIn(EVENT_ID, currentUser);
        order.verify(attendanceSessionRepository).findByEventID(EVENT_ID);
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
