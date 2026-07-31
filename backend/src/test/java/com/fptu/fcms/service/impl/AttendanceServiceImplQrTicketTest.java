package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.AttendanceCheckInRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.VerificationMethod;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceImplQrTicketTest {

    @Mock
    private AttendanceSessionRepository attendanceSessionRepository;
    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;
    @Mock
    private EventRepository eventRepository;
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

    @InjectMocks
    private AttendanceServiceImpl service;

    @Test
    void validStaticQrChecksInConfirmedTicketForTheSessionEvent() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration registration = confirmedRegistration(301, 201, 401, "ticket-201-301");
        registration.setPaymentStatus(PaymentStatus.PAID);
        UserAccount user = new UserAccount();
        user.setUserID(401);
        user.setFullName("Nguyen Van An");
        user.setStudentId("SE123456");
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-201-301"))
                .thenReturn(Optional.of(registration));
        when(userRepository.findByUserIDAndIsDeletedFalse(401)).thenReturn(Optional.of(user));
        when(attendanceRecordRepository.findBySessionIDAndRegistrationID(101, 301)).thenReturn(Optional.empty());
        when(attendanceRecordRepository.saveAndFlush(any(AttendanceRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceCheckInResponse response = service.checkIn(101, qrRequest("ticket-201-301"), staff);

        assertEquals(AttendanceStatus.PRESENT, response.getStatus());
        assertEquals(301, response.getRegistrationId());
        assertEquals("Nguyen Van An", response.getFullName());
        assertEquals("SE123456", response.getStudentId());
        assertEquals("PARTICIPANT", response.getParticipantType());
        ArgumentCaptor<AttendanceRecord> recordCaptor = ArgumentCaptor.forClass(AttendanceRecord.class);
        verify(attendanceRecordRepository).saveAndFlush(recordCaptor.capture());
        assertEquals(VerificationMethod.QR_TICKET.name(), recordCaptor.getValue().getVerificationMethod());
        assertEquals(CheckInMethod.QR_CODE, recordCaptor.getValue().getCheckInMethod());
        assertEquals(901, recordCaptor.getValue().getCheckedInBy());
        verify(eventAssignmentAccessService).ensureCanManageCheckIn(201, staff);
    }

    @Test
    void unpaidMemberQrTicketIsRejected() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration registration = confirmedRegistration(301, 201, 401, "member-unpaid");
        registration.setPaymentStatus(PaymentStatus.PENDING);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "member-unpaid"))
                .thenReturn(Optional.of(registration));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("member-unpaid"), staff)
        );

        assertEquals("TICKET_INVALID", error.getErrorCode());
        verify(attendanceRecordRepository, never())
                .findBySessionIDAndRegistrationID(any(), any());
    }

    @Test
    void paidGuestQrTicketChecksInAndReturnsGuestIdentity() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        GuestEventRegistration guest = confirmedGuestRegistration(601, 201, "guest-paid", PaymentStatus.PAID);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(guestEventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "guest-paid"))
                .thenReturn(Optional.of(guest));
        when(guestEventRegistrationRepository.findByGuestRegistrationIDAndIsDeletedFalse(601))
                .thenReturn(Optional.of(guest));
        when(attendanceRecordRepository.findBySessionIDAndGuestRegistrationID(101, 601))
                .thenReturn(Optional.empty());
        when(attendanceRecordRepository.save(any(AttendanceRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceCheckInResponse response = service.checkIn(101, qrRequest("guest-paid"), staff);

        assertEquals(AttendanceStatus.PRESENT, response.getStatus());
        assertEquals(601, response.getRegistrationId());
        assertEquals("Guest User", response.getFullName());
        assertNull(response.getStudentId());
        assertEquals("GUEST", response.getParticipantType());
    }

    @Test
    void repeatGuestQrForPresentRecordReturnsConflict() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        GuestEventRegistration guest = confirmedGuestRegistration(601, 201, "guest-paid", PaymentStatus.PAID);
        AttendanceRecord presentRecord = new AttendanceRecord();
        presentRecord.setAttendanceStatus(AttendanceStatus.PRESENT);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(guestEventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "guest-paid"))
                .thenReturn(Optional.of(guest));
        when(guestEventRegistrationRepository.findByGuestRegistrationIDAndIsDeletedFalse(601))
                .thenReturn(Optional.of(guest));
        when(attendanceRecordRepository.findBySessionIDAndGuestRegistrationID(101, 601))
                .thenReturn(Optional.of(presentRecord));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("guest-paid"), staff)
        );

        assertEquals(ApiErrorCode.ALREADY_CHECKED_IN.name(), error.getErrorCode());
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verify(attendanceRecordRepository, never()).save(any(AttendanceRecord.class));
        verify(attendanceRecordRepository, never()).saveAndFlush(any(AttendanceRecord.class));
    }

    @Test
    void unpaidGuestQrTicketIsRejected() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        GuestEventRegistration guest =
                confirmedGuestRegistration(601, 201, "guest-unpaid", PaymentStatus.PENDING);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(guestEventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "guest-unpaid"))
                .thenReturn(Optional.of(guest));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("guest-unpaid"), staff)
        );

        assertEquals("TICKET_INVALID", error.getErrorCode());
        verify(attendanceRecordRepository, never())
                .findBySessionIDAndGuestRegistrationID(any(), any());
    }

    @Test
    void unpaidMemberManualLookupIsRejected() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration registration = confirmedRegistration(301, 201, 401, null);
        registration.setPaymentStatus(PaymentStatus.PENDING);
        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setRegistrationId(301);
        request.setVerificationMethod(VerificationMethod.STUDENT_CARD.name());

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByRegistrationIDAndIsDeletedFalse(301))
                .thenReturn(Optional.of(registration));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, request, 901));

        assertEquals("TICKET_PAYMENT_REQUIRED", error.getErrorCode());
        verify(attendanceRecordRepository, never()).save(any(AttendanceRecord.class));
    }

    @Test
    void unpaidGuestManualLookupIsRejected() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        GuestEventRegistration guest = confirmedGuestRegistration(601, 201, null, PaymentStatus.PENDING);
        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setGuestRegistrationId(601);
        request.setVerificationMethod(VerificationMethod.PHONE_LAST4.name());

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(guestEventRegistrationRepository.findByGuestRegistrationIDAndIsDeletedFalse(601))
                .thenReturn(Optional.of(guest));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, request, 901));

        assertEquals("TICKET_PAYMENT_REQUIRED", error.getErrorCode());
        verify(attendanceRecordRepository, never()).save(any(AttendanceRecord.class));
    }
    @Test
    void qrTicketFromAnotherEventReturnsGenericInvalidTicketError() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        UserPrincipal staff = staffPrincipal();
        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-from-event-202"))
                .thenReturn(Optional.empty());

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("ticket-from-event-202"), staff)
        );

        assertEquals("TICKET_INVALID", error.getErrorCode());
        verify(eventAssignmentAccessService).ensureCanManageCheckIn(201, staff);
    }

    @Test
    void revokedTicketIsRejectedBeforeCreatingAttendanceRecord() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration registration = confirmedRegistration(301, 201, 401, "revoked-ticket");
        registration.setTicketRevokedAt(LocalDateTime.now());
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "revoked-ticket"))
                .thenReturn(Optional.of(registration));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("revoked-ticket"), staff)
        );

        assertEquals("TICKET_INVALID", error.getErrorCode());
        verify(eventAssignmentAccessService).ensureCanManageCheckIn(201, staff);
    }

    @Test
    void existingAbsentRecordUsesAtomicQrUpdateAndReturnsSuccess() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration registration = confirmedRegistration(301, 201, 401, "ticket-201-301");
        AttendanceRecord absentRecord = new AttendanceRecord();
        absentRecord.setRecordID(501);
        absentRecord.setAttendanceStatus(AttendanceStatus.ABSENT);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-201-301"))
                .thenReturn(Optional.of(registration));
        when(attendanceRecordRepository.findBySessionIDAndRegistrationID(101, 301))
                .thenReturn(Optional.of(absentRecord));
        when(attendanceRecordRepository.markPresentWithQrTicketIfNotAlreadyCheckedIn(
                any(), any(), any(), any(), any(), any()
        )).thenReturn(1);

        AttendanceCheckInResponse response = service.checkIn(101, qrRequest("ticket-201-301"), staff);

        assertEquals(AttendanceStatus.PRESENT, response.getStatus());
        verify(attendanceRecordRepository).markPresentWithQrTicketIfNotAlreadyCheckedIn(
                eq(501),
                eq(AttendanceStatus.PRESENT),
                eq(CheckInMethod.QR_CODE),
                eq(VerificationMethod.QR_TICKET.name()),
                eq(901),
                any(LocalDateTime.class)
        );
        verify(attendanceRecordRepository, never()).save(absentRecord);
        verify(attendanceRecordRepository, never()).saveAndFlush(any(AttendanceRecord.class));
    }

    @Test
    void concurrentQrLosingAtomicAbsentUpdateReturnsConflict() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration registration = confirmedRegistration(301, 201, 401, "ticket-201-301");
        AttendanceRecord absentRecord = new AttendanceRecord();
        absentRecord.setRecordID(501);
        absentRecord.setAttendanceStatus(AttendanceStatus.ABSENT);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-201-301"))
                .thenReturn(Optional.of(registration));
        when(attendanceRecordRepository.findBySessionIDAndRegistrationID(101, 301))
                .thenReturn(Optional.of(absentRecord));
        when(attendanceRecordRepository.markPresentWithQrTicketIfNotAlreadyCheckedIn(
                any(), any(), any(), any(), any(), any()
        )).thenReturn(0);

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("ticket-201-301"), staff)
        );

        assertEquals(ApiErrorCode.ALREADY_CHECKED_IN.name(), error.getErrorCode());
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verify(attendanceRecordRepository, never()).save(absentRecord);
        verify(attendanceRecordRepository, never()).saveAndFlush(any(AttendanceRecord.class));
    }

    @Test
    void repeatStaticQrForPresentRecordReturnsConflictWithoutSaving() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration registration = confirmedRegistration(301, 201, 401, "ticket-201-301");
        AttendanceRecord presentRecord = new AttendanceRecord();
        presentRecord.setAttendanceStatus(AttendanceStatus.PRESENT);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-201-301"))
                .thenReturn(Optional.of(registration));
        when(attendanceRecordRepository.findBySessionIDAndRegistrationID(101, 301)).thenReturn(Optional.of(presentRecord));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("ticket-201-301"), staff)
        );

        assertEquals(ApiErrorCode.ALREADY_CHECKED_IN.name(), error.getErrorCode());
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verify(eventAssignmentAccessService).ensureCanManageCheckIn(201, staff);
        verify(attendanceRecordRepository, never()).save(any(AttendanceRecord.class));
        verify(attendanceRecordRepository, never()).saveAndFlush(any(AttendanceRecord.class));
    }

    @Test
    void groupOrderQrChecksInEveryTicketHolderOfTheOrder() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration leader = confirmedRegistration(301, 201, 401, "ticket-leader");
        leader.setPaymentStatus(PaymentStatus.PAID);
        leader.setTicketOrderCode("ORD-201-ABC");
        EventRegistration friend = confirmedRegistration(302, 201, null, "ticket-friend");
        friend.setPaymentStatus(PaymentStatus.PAID);
        friend.setTicketOrderCode("ORD-201-ABC");
        friend.setGuestFullName("Tran Minh Quan");
        UserAccount leaderUser = new UserAccount();
        leaderUser.setUserID(401);
        leaderUser.setFullName("Nguyen Hoang Long");
        leaderUser.setStudentId("SE171203");
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-leader"))
                .thenReturn(Optional.of(leader));
        when(eventRegistrationRepository
                .findByEventIDAndTicketOrderCodeAndIsDeletedFalseOrderByRegistrationIDAsc(201, "ORD-201-ABC"))
                .thenReturn(List.of(leader, friend));
        when(userRepository.findByUserIDAndIsDeletedFalse(401)).thenReturn(Optional.of(leaderUser));
        when(attendanceRecordRepository.findBySessionIDAndRegistrationID(eq(101), any()))
                .thenReturn(Optional.empty());
        when(attendanceRecordRepository.saveAndFlush(any(AttendanceRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceCheckInResponse response = service.checkIn(101, qrRequest("ticket-leader"), staff);

        assertEquals(AttendanceStatus.PRESENT, response.getStatus());
        assertEquals("ORD-201-ABC", response.getTicketOrderCode());
        assertEquals(2, response.getGroupMembers().size());
        assertEquals("CHECKED_IN", response.getGroupMembers().get(0).getOutcome());
        assertEquals("Tran Minh Quan", response.getGroupMembers().get(1).getFullName());
        assertEquals("CHECKED_IN", response.getGroupMembers().get(1).getOutcome());
        verify(attendanceRecordRepository, times(2)).saveAndFlush(any(AttendanceRecord.class));
    }

    @Test
    void groupOrderQrSkipsUnpaidMemberButStillChecksInTheRest() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration leader = confirmedRegistration(301, 201, 401, "ticket-leader");
        leader.setPaymentStatus(PaymentStatus.PAID);
        leader.setTicketOrderCode("ORD-201-ABC");
        EventRegistration revoked = confirmedRegistration(302, 201, null, "ticket-revoked");
        revoked.setPaymentStatus(PaymentStatus.PAID);
        revoked.setTicketOrderCode("ORD-201-ABC");
        revoked.setTicketRevokedAt(LocalDateTime.now());
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-leader"))
                .thenReturn(Optional.of(leader));
        when(eventRegistrationRepository
                .findByEventIDAndTicketOrderCodeAndIsDeletedFalseOrderByRegistrationIDAsc(201, "ORD-201-ABC"))
                .thenReturn(List.of(leader, revoked));
        when(userRepository.findByUserIDAndIsDeletedFalse(401)).thenReturn(Optional.empty());
        when(attendanceRecordRepository.findBySessionIDAndRegistrationID(101, 301))
                .thenReturn(Optional.empty());
        when(attendanceRecordRepository.saveAndFlush(any(AttendanceRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceCheckInResponse response = service.checkIn(101, qrRequest("ticket-leader"), staff);

        assertEquals(AttendanceStatus.PRESENT, response.getStatus());
        assertEquals("SKIPPED", response.getGroupMembers().get(1).getOutcome());
        verify(attendanceRecordRepository, times(1)).saveAndFlush(any(AttendanceRecord.class));
        verify(attendanceRecordRepository, never()).findBySessionIDAndRegistrationID(101, 302);
    }

    @Test
    void groupOrderQrWhereEveryoneIsAlreadyPresentReturnsConflict() {
        AttendanceSession session = openSession(101, 201);
        Event event = ongoingEvent(201);
        EventRegistration leader = confirmedRegistration(301, 201, 401, "ticket-leader");
        leader.setPaymentStatus(PaymentStatus.PAID);
        leader.setTicketOrderCode("ORD-201-ABC");
        EventRegistration friend = confirmedRegistration(302, 201, null, "ticket-friend");
        friend.setPaymentStatus(PaymentStatus.PAID);
        friend.setTicketOrderCode("ORD-201-ABC");
        AttendanceRecord presentRecord = new AttendanceRecord();
        presentRecord.setAttendanceStatus(AttendanceStatus.PRESENT);
        UserPrincipal staff = staffPrincipal();

        when(attendanceSessionRepository.findBySessionIDForUpdate(101)).thenReturn(Optional.of(session));
        when(eventRepository.findByEventIDAndIsDeletedFalse(201)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(201, "ticket-leader"))
                .thenReturn(Optional.of(leader));
        when(eventRegistrationRepository
                .findByEventIDAndTicketOrderCodeAndIsDeletedFalseOrderByRegistrationIDAsc(201, "ORD-201-ABC"))
                .thenReturn(List.of(leader, friend));
        when(userRepository.findByUserIDAndIsDeletedFalse(401)).thenReturn(Optional.empty());
        when(attendanceRecordRepository.findBySessionIDAndRegistrationID(eq(101), any()))
                .thenReturn(Optional.of(presentRecord));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.checkIn(101, qrRequest("ticket-leader"), staff)
        );

        assertEquals(ApiErrorCode.ALREADY_CHECKED_IN.name(), error.getErrorCode());
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verify(attendanceRecordRepository, never()).saveAndFlush(any(AttendanceRecord.class));
    }

    private AttendanceCheckInRequest qrRequest(String ticketCode) {
        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setVerificationMethod(VerificationMethod.QR_TICKET.name());
        request.setVerificationValue(ticketCode);
        return request;
    }

    private AttendanceSession openSession(Integer sessionId, Integer eventId) {
        AttendanceSession session = new AttendanceSession();
        session.setSessionID(sessionId);
        session.setEventID(eventId);
        session.setStatus(AttendanceSessionStatus.OPEN);
        return session;
    }

    private Event ongoingEvent(Integer eventId) {
        Event event = new Event();
        event.setEventID(eventId);
        event.setEventStatus(EventStatus.ONGOING);
        return event;
    }

    private EventRegistration confirmedRegistration(Integer registrationId, Integer eventId, Integer userId, String ticketCode) {
        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(registrationId);
        registration.setEventID(eventId);
        registration.setUserID(userId);
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        registration.setParticipantType(ParticipantType.PARTICIPANT);
        registration.setTicketCode(ticketCode);
        return registration;
    }

    private GuestEventRegistration confirmedGuestRegistration(
            Integer registrationId,
            Integer eventId,
            String ticketCode,
            PaymentStatus paymentStatus
    ) {
        GuestEventRegistration guest = new GuestEventRegistration();
        guest.setGuestRegistrationID(registrationId);
        guest.setEventID(eventId);
        guest.setGuestFullName("Guest User");
        guest.setParticipantType(ParticipantType.GUEST);
        guest.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        guest.setTicketCode(ticketCode);
        guest.setPaymentStatus(paymentStatus);
        return guest;
    }
    private UserPrincipal staffPrincipal() {
        return new UserPrincipal(
                901,
                "staff@fpt.edu.vn",
                3,
                "Student",
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_Student"))
        );
    }
}
