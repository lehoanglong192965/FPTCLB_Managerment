package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.AttendanceSessionRequest;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.statemachine.AttendanceSessionStateMachineService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceSessionServiceImplTest {

    private static final Integer EVENT_ID = 20;
    private static final Integer SESSION_ID = 10;

    @Mock
    private AttendanceSessionRepository attendanceSessionRepository;
    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;
    @Mock
    private EventRegistrationRepository eventRegistrationRepository;
    @Mock
    private GuestEventRegistrationRepository guestEventRegistrationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private AttendanceSessionStateMachineService stateMachineService;

    @InjectMocks
    private AttendanceSessionServiceImpl service;

    @Test
    void creatingSecondActiveSessionForEventReturnsConflict() {
        when(attendanceSessionRepository.existsByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(true);

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.create(EVENT_ID, request(), principal())
        );

        assertConflict(exception);
        verify(attendanceSessionRepository, never()).saveAndFlush(any(AttendanceSession.class));
    }

    @Test
    void concurrentCreateConstraintViolationReturnsConflict() {
        when(attendanceSessionRepository.existsByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(false);
        when(attendanceSessionRepository.saveAndFlush(any(AttendanceSession.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key in UX_AttendanceSession_Event_Active"));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> service.create(EVENT_ID, request(), principal())
        );

        assertConflict(exception);
    }

    @Test
    void unrelatedDataIntegrityViolationIsNotMaskedAsDuplicateSession() {
        when(attendanceSessionRepository.existsByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(false);
        DataIntegrityViolationException databaseFailure =
                new DataIntegrityViolationException("unrelated foreign key violation");
        when(attendanceSessionRepository.saveAndFlush(any(AttendanceSession.class)))
                .thenThrow(databaseFailure);

        DataIntegrityViolationException thrown = assertThrows(
                DataIntegrityViolationException.class,
                () -> service.create(EVENT_ID, request(), principal())
        );

        assertSame(databaseFailure, thrown);
    }

    @Test
    void finalizeLegacyMemberWithNullParticipantTypeDefaultsToParticipant() {
        AttendanceSession session = new AttendanceSession();
        session.setSessionID(SESSION_ID);
        session.setEventID(EVENT_ID);
        session.setStatus(AttendanceSessionStatus.OPEN);
        session.setIsDeleted(false);

        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(30);
        registration.setUserID(40);
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        registration.setParticipantType(null);

        when(attendanceSessionRepository.findBySessionIDForUpdate(SESSION_ID)).thenReturn(Optional.of(session));
        when(attendanceRecordRepository.findBySessionID(SESSION_ID)).thenReturn(List.of());
        when(eventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of(registration));
        when(guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of());
        when(attendanceSessionRepository.save(session)).thenReturn(session);

        service.close(SESSION_ID, principal());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<AttendanceRecord>> recordsCaptor = ArgumentCaptor.forClass(List.class);
        verify(attendanceRecordRepository).saveAll(recordsCaptor.capture());
        AttendanceRecord record = recordsCaptor.getValue().get(0);
        assertEquals("PARTICIPANT", record.getParticipantTypeSnapshot());
        assertEquals(AttendanceStatus.ABSENT, record.getAttendanceStatus());
    }

    private AttendanceSessionRequest request() {
        AttendanceSessionRequest request = new AttendanceSessionRequest();
        request.setName("Main attendance");
        return request;
    }

    private UserPrincipal principal() {
        return new UserPrincipal(1, "manager@example.edu", 3, List.of());
    }

    private void assertConflict(BusinessRuleException exception) {
        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("ATTENDANCE_SESSION_ALREADY_EXISTS", exception.getErrorCode());
        assertEquals("Event already has an attendance session.", exception.getMessage());
    }
}
