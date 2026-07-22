package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;

import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.repository.projection.HistoricalUserView;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventExportServiceImplTest {

    private static final Integer EVENT_ID = 99;

    @Mock
    private EventRegistrationRepository eventRegistrationRepository;
    @Mock
    private GuestEventRegistrationRepository guestEventRegistrationRepository;
    @Mock
    private AttendanceSessionRepository attendanceSessionRepository;
    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private EventExportServiceImpl service;

    @Test
    void registrationExportNeutralizesFormulasAndRedactsGuestContactForNonHostManager() {
        UserPrincipal principal = principal(42);
        EventRegistration memberRegistration = new EventRegistration();
        memberRegistration.setUserID(10);
        memberRegistration.setParticipantType(ParticipantType.PARTICIPANT);
        memberRegistration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        memberRegistration.setRegistrationChannel(RegistrationChannel.FPTU);
        memberRegistration.setRegisteredAt(LocalDateTime.of(2026, 7, 20, 9, 0));

        HistoricalUserView member = Mockito.mock(HistoricalUserView.class);
        when(member.getUserId()).thenReturn(10);
        when(member.getStudentId()).thenReturn("=A1");
        when(member.getFullName()).thenReturn("+Member");
        when(member.getEmail()).thenReturn("member@example.edu");

        GuestEventRegistration guestRegistration = new GuestEventRegistration();
        guestRegistration.setGuestRegistrationID(20);
        guestRegistration.setGuestFullName("-Guest");
        guestRegistration.setGuestEmail("private-guest@example.edu");
        guestRegistration.setGuestPhone("secret-phone");
        guestRegistration.setParticipantType(ParticipantType.GUEST);
        guestRegistration.setRegistrationStatus(RegistrationStatus.WAITLISTED);
        guestRegistration.setRegistrationChannel(RegistrationChannel.ONLINE);
        guestRegistration.setRegisteredAt(LocalDateTime.of(2026, 7, 20, 10, 0));

        when(eventAssignmentAccessService.canViewGuestContact(EVENT_ID, principal)).thenReturn(false);
        when(eventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of(memberRegistration));
        when(guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of(guestRegistration));
        when(userRepository.findHistoricalUsersByIds(anyCollection()))
                .thenReturn(List.of(member));

        CsvExportResult export = service.exportRegistrations(EVENT_ID, principal);
        String csv = csv(export);

        assertTrue(csv.startsWith("\uFEFF\"MSSV\",\"H\u1ecd t\u00ean\""));
        assertTrue(csv.contains("\"'=A1\""));
        assertTrue(csv.contains("\"'+Member\""));
        assertTrue(csv.contains("\"'-Guest\""));
        assertFalse(csv.contains("private-guest@example.edu"));
        assertFalse(csv.contains("secret-phone"));
        assertEquals(2, export.dataRowCount());

        InOrder callOrder = inOrder(eventAssignmentAccessService, eventRegistrationRepository);
        callOrder.verify(eventAssignmentAccessService).ensureCanManageEvent(EVENT_ID, principal);
        callOrder.verify(eventAssignmentAccessService).canViewGuestContact(EVENT_ID, principal);
        callOrder.verify(eventRegistrationRepository).findByEventIDAndIsDeletedFalse(EVENT_ID);
        verifyAudit(principal, "EVENT_REGISTRATIONS_EXPORTED", 2);
    }

    @Test
    void registrationExportBatchesPurchaserWithParticipantUsers() {
        UserPrincipal principal = principal(46);
        EventRegistration registration = new EventRegistration();
        registration.setUserID(10);
        registration.setPurchaserUserID(11);
        registration.setParticipantType(ParticipantType.PARTICIPANT);
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        registration.setRegistrationChannel(RegistrationChannel.FPTU);

        HistoricalUserView participant = Mockito.mock(HistoricalUserView.class);
        when(participant.getUserId()).thenReturn(10);
        when(participant.getFullName()).thenReturn("Participant");
        when(participant.getEmail()).thenReturn("participant@example.edu");
        HistoricalUserView purchaser = Mockito.mock(HistoricalUserView.class);
        when(purchaser.getUserId()).thenReturn(11);
        when(purchaser.getEmail()).thenReturn("purchaser@example.edu");

        when(eventAssignmentAccessService.canViewGuestContact(EVENT_ID, principal)).thenReturn(false);
        when(eventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of(registration));
        when(guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of());
        when(userRepository.findHistoricalUsersByIds(anyCollection()))
                .thenReturn(List.of(participant, purchaser));

        String csv = csv(service.exportRegistrations(EVENT_ID, principal));

        assertTrue(csv.contains("purchaser@example.edu"));
        verify(userRepository).findHistoricalUsersByIds(Mockito.argThat(
                userIds -> userIds.equals(java.util.Set.of(10, 11))
        ));
        verify(userRepository, Mockito.never()).findByUserIDAndIsDeletedFalse(Mockito.anyInt());
        verifyAudit(principal, "EVENT_REGISTRATIONS_EXPORTED", 1);
    }

    @Test
    void registrationExportIncludesGuestEmailForHostClubBoard() {
        UserPrincipal principal = principal(43);
        GuestEventRegistration guestRegistration = new GuestEventRegistration();
        guestRegistration.setGuestRegistrationID(21);
        guestRegistration.setGuestFullName("Guest");
        guestRegistration.setGuestEmail("visible-guest@example.edu");
        guestRegistration.setParticipantType(ParticipantType.GUEST);
        guestRegistration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        guestRegistration.setRegistrationChannel(RegistrationChannel.ONLINE);
        guestRegistration.setRegisteredAt(LocalDateTime.of(2026, 7, 20, 10, 0));

        when(eventAssignmentAccessService.canViewGuestContact(EVENT_ID, principal)).thenReturn(true);
        when(eventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(List.of());
        when(guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of(guestRegistration));

        String csv = csv(service.exportRegistrations(EVENT_ID, principal));

        assertTrue(csv.contains("visible-guest@example.edu"));
        verifyAudit(principal, "EVENT_REGISTRATIONS_EXPORTED", 1);
    }

    @Test
    void attendanceExportWithoutSessionsReturnsHeaderAndAuditsZeroRows() {
        UserPrincipal principal = principal(44);
        when(attendanceSessionRepository.findByEventIDAndIsDeletedFalseOrderByCheckInTimeAsc(EVENT_ID))
                .thenReturn(List.of());

        String csv = csv(service.exportAttendance(EVENT_ID, principal));

        assertTrue(csv.startsWith("\uFEFF\"Phi\u00ean \u0111i\u1ec3m danh\",\"MSSV\""));
        verifyNoInteractions(
                attendanceRecordRepository,
                userRepository,
                eventRegistrationRepository,
                guestEventRegistrationRepository
        );
        verifyAudit(principal, "EVENT_ATTENDANCE_EXPORTED", 0);
    }

    @Test
    void attendanceExportUsesLegacyGuestRegistrationWhenAttendanceRecordHasNoGuestRegistrationId() {
        UserPrincipal principal = principal(45);
        AttendanceSession session = new AttendanceSession();
        session.setSessionID(7);
        session.setSessionName("Check-in");
        session.setCheckInTime(LocalDateTime.of(2026, 7, 20, 9, 0));

        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(7);
        record.setRegistrationID(8);
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        record.setCheckInMethod(CheckInMethod.QR_CODE);
        record.setVerificationMethod("QR_TICKET");
        record.setCheckedInAt(LocalDateTime.of(2026, 7, 20, 9, 5));

        EventRegistration legacyGuestRegistration = new EventRegistration();
        legacyGuestRegistration.setRegistrationID(8);
        legacyGuestRegistration.setGuestFullName("Legacy Guest");
        legacyGuestRegistration.setParticipantType(ParticipantType.GUEST);

        when(attendanceSessionRepository.findByEventIDAndIsDeletedFalseOrderByCheckInTimeAsc(EVENT_ID))
                .thenReturn(List.of(session));
        when(attendanceRecordRepository.findBySessionIDInAndIsDeletedFalse(anyCollection()))
                .thenReturn(List.of(record));
        when(eventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of(legacyGuestRegistration));
        when(guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(List.of());

        String csv = csv(service.exportAttendance(EVENT_ID, principal));

        assertTrue(csv.contains("\"Legacy Guest\""));
        assertTrue(csv.contains("\"GUEST\""));
        verifyAudit(principal, "EVENT_ATTENDANCE_EXPORTED", 1);
    }

    private String csv(CsvExportResult export) {
        byte[] content = export.content();
        return new String(content, StandardCharsets.UTF_8);
    }

    private UserPrincipal principal(Integer userId) {
        return new UserPrincipal(userId, "manager@example.edu", 3, List.of());
    }

    private void verifyAudit(UserPrincipal principal, String actionType, int rowCount) {
        verify(auditLogService).recordWithRefs(
                eq(principal.getUserId()),
                eq("Event"),
                eq(EVENT_ID),
                eq(actionType),
                isNull(),
                eq("rows=" + rowCount),
                eq(EVENT_ID),
                isNull(),
                isNull(),
                isNull()
        );
    }
}
