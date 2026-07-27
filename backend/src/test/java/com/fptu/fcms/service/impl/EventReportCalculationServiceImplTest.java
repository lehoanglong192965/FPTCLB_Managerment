package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class EventReportCalculationServiceImplTest {

    private EventReportCalculationServiceImpl calculationService;

    @BeforeEach
    void setUp() {
        calculationService = new EventReportCalculationServiceImpl();
    }

    @Test
    @DisplayName("Group Ticket Order Revenue Semantics Test - 1 Order 3 Tickets = 300,000 VND")
    void testGroupTicketOrderRevenueSemantics() {
        Event event = new Event();
        event.setEventID(100);
        event.setEventName("Tech Workshop 2026");
        event.setIsPaidEvent(true);
        event.setTicketPrice(BigDecimal.valueOf(100000));
        event.setTicketCurrency("VND");
        event.setEventStatus(EventStatus.COMPLETED);

        String orderCode = "ORDER-GROUP-123";

        EventRegistration reg1 = createRegistration(1, orderCode, BigDecimal.valueOf(100000), BigDecimal.valueOf(100000), "TICKET-01");
        EventRegistration reg2 = createRegistration(2, orderCode, BigDecimal.valueOf(100000), BigDecimal.valueOf(100000), "TICKET-02");
        EventRegistration reg3 = createRegistration(3, orderCode, BigDecimal.valueOf(100000), BigDecimal.valueOf(100000), "TICKET-03");

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(1);
        session.setStatus(AttendanceSessionStatus.CLOSED);

        EventReportingDataset dataset = new EventReportingDataset(
                event,
                List.of(reg1, reg2, reg3),
                List.of(),
                List.of(session),
                List.of(),
                List.of(),
                Map.of(),
                LocalDateTime.now()
        );

        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        assertNotNull(snapshot);
        assertEquals(3, snapshot.tickets().issuedTicketCount());
        assertEquals(1, snapshot.tickets().distinctOrderCount());
        assertEquals(1, snapshot.tickets().multiTicketOrderCount());
        assertEquals(3.0, snapshot.tickets().averageTicketsPerOrder());

        assertEquals(0, BigDecimal.valueOf(300000).compareTo(snapshot.payments().totalAmountDue()));
        assertEquals(0, BigDecimal.valueOf(300000).compareTo(snapshot.payments().totalAmountPaid()));
        assertEquals(3, snapshot.payments().paidPaymentCount());
    }

    @Test
    @DisplayName("Attendance readiness should be false if sessions list is empty")
    void testEmptyAttendanceSessionsNotReady() {
        Event event = new Event();
        event.setEventID(101);
        event.setEventStatus(EventStatus.COMPLETED);

        EventReportingDataset dataset = new EventReportingDataset(
                event,
                List.of(),
                List.of(),
                List.of(), // empty sessions
                List.of(),
                List.of(),
                Map.of(),
                LocalDateTime.now()
        );

        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        assertFalse(snapshot.readiness().attendanceReady());
        assertFalse(snapshot.readiness().isReady());
        assertTrue(snapshot.warnings().stream().anyMatch(w -> "NO_ATTENDANCE_SESSION".equals(w.code())));
    }

    @Test
    @DisplayName("Free Event Metrics Test - Zero amounts and NOT_REQUIRED payments")
    void testFreeEventMetrics() {
        Event event = new Event();
        event.setEventID(102);
        event.setEventName("Free Member Orientation");
        event.setIsPaidEvent(false);
        event.setEventStatus(EventStatus.COMPLETED);

        EventRegistration reg1 = new EventRegistration();
        reg1.setRegistrationID(10);
        reg1.setUserID(10);
        reg1.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        reg1.setPaymentStatus(PaymentStatus.NOT_REQUIRED);
        reg1.setAmountDue(BigDecimal.ZERO);
        reg1.setAmountPaid(BigDecimal.ZERO);
        reg1.setTicketCode("FREE-01");

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(2);
        session.setStatus(AttendanceSessionStatus.CLOSED);

        EventReportingDataset dataset = new EventReportingDataset(
                event,
                List.of(reg1),
                List.of(),
                List.of(session),
                List.of(),
                List.of(),
                Map.of(),
                LocalDateTime.now()
        );

        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        assertNotNull(snapshot);
        assertEquals(1, snapshot.registrations().totalRegistrations());
        assertEquals(1, snapshot.tickets().freeTicketCount());
        assertEquals(0, BigDecimal.ZERO.compareTo(snapshot.payments().totalAmountPaid()));
        assertTrue(snapshot.readiness().isReady());
    }

    @Test
    @DisplayName("Cancelled and Rejected Registrations should not be counted as confirmed")
    void testCancelledAndRejectedRegistrationsHandling() {
        Event event = new Event();
        event.setEventID(103);
        event.setEventStatus(EventStatus.COMPLETED);

        EventRegistration regConfirmed = createRegistration(1, "ORD-1", BigDecimal.ZERO, BigDecimal.ZERO, "TCK-1");

        EventRegistration regCancelled = new EventRegistration();
        regCancelled.setRegistrationID(2);
        regCancelled.setUserID(2);
        regCancelled.setRegistrationStatus(RegistrationStatus.CANCELLED);

        EventRegistration regRejected = new EventRegistration();
        regRejected.setRegistrationID(3);
        regRejected.setUserID(3);
        regRejected.setRegistrationStatus(RegistrationStatus.REJECTED);

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(3);
        session.setStatus(AttendanceSessionStatus.CLOSED);

        EventReportingDataset dataset = new EventReportingDataset(
                event,
                List.of(regConfirmed, regCancelled, regRejected),
                List.of(),
                List.of(session),
                List.of(),
                List.of(),
                Map.of(),
                LocalDateTime.now()
        );

        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        assertEquals(3, snapshot.registrations().totalRegistrations());
        assertEquals(1, snapshot.registrations().confirmedRegistrations());
        assertEquals(1, snapshot.registrations().cancelledRegistrations());
        assertEquals(1, snapshot.registrations().rejectedRegistrations());
    }

    @Test
    @DisplayName("Guest Registrations and breakdown maps calculation")
    void testGuestRegistrationsAndBreakdown() {
        Event event = new Event();
        event.setEventID(104);
        event.setEventStatus(EventStatus.COMPLETED);

        GuestEventRegistration guestReg = new GuestEventRegistration();
        guestReg.setGuestRegistrationID(1);
        guestReg.setGuestFullName("Guest User");
        guestReg.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        guestReg.setParticipantType(ParticipantType.GUEST);
        guestReg.setRegistrationChannel(RegistrationChannel.ONLINE);
        guestReg.setPaymentStatus(PaymentStatus.NOT_REQUIRED);

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(4);
        session.setStatus(AttendanceSessionStatus.CLOSED);

        EventReportingDataset dataset = new EventReportingDataset(
                event,
                List.of(),
                List.of(guestReg),
                List.of(session),
                List.of(),
                List.of(),
                Map.of(),
                LocalDateTime.now()
        );

        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        assertEquals(1, snapshot.registrations().guestRegistrations());
        assertEquals(1, snapshot.registrations().confirmedRegistrations());
        assertTrue(snapshot.registrations().channelBreakdown().containsKey("ONLINE"));
    }

    @Test
    @DisplayName("Duplicate payment reference should trigger DUPLICATE_PAYMENT_REF warning")
    void testDuplicatePaymentReferenceWarning() {
        Event event = new Event();
        event.setEventID(105);
        event.setEventStatus(EventStatus.COMPLETED);

        EventRegistration reg1 = createRegistration(1, "ORD-1", BigDecimal.valueOf(50000), BigDecimal.valueOf(50000), "TCK-1");
        reg1.setPaymentReference("REF-DUP-99");
        EventRegistration reg2 = createRegistration(2, "ORD-2", BigDecimal.valueOf(50000), BigDecimal.valueOf(50000), "TCK-2");
        reg2.setPaymentReference("REF-DUP-99");

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(5);
        session.setStatus(AttendanceSessionStatus.CLOSED);

        EventReportingDataset dataset = new EventReportingDataset(
                event,
                List.of(reg1, reg2),
                List.of(),
                List.of(session),
                List.of(),
                List.of(),
                Map.of(),
                LocalDateTime.now()
        );

        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        assertTrue(snapshot.warnings().stream().anyMatch(w -> "DUPLICATE_PAYMENT_REF".equals(w.code())));
    }

    @Test
    @DisplayName("Unclosed attendance session triggers UNCLOSED_ATTENDANCE_SESSION blocking warning")
    void testUnclosedAttendanceSessionBlockingWarning() {
        Event event = new Event();
        event.setEventID(106);
        event.setEventStatus(EventStatus.COMPLETED);

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(6);
        session.setStatus(AttendanceSessionStatus.OPEN);

        EventReportingDataset dataset = new EventReportingDataset(
                event,
                List.of(),
                List.of(),
                List.of(session),
                List.of(),
                List.of(),
                Map.of(),
                LocalDateTime.now()
        );

        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        assertFalse(snapshot.readiness().attendanceReady());
        assertFalse(snapshot.readiness().isReady());
        assertTrue(snapshot.warnings().stream().anyMatch(w -> "SESSION_NOT_CLOSED".equals(w.code())));
    }

    private EventRegistration createRegistration(
            Integer id,
            String orderCode,
            BigDecimal due,
            BigDecimal paid,
            String ticketCode
    ) {
        EventRegistration reg = new EventRegistration();
        reg.setRegistrationID(id);
        reg.setUserID(id);
        reg.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        reg.setPaymentStatus(PaymentStatus.PAID);
        reg.setTicketOrderCode(orderCode);
        reg.setAmountDue(due);
        reg.setAmountPaid(paid);
        reg.setTicketCode(ticketCode);
        reg.setPaymentCurrency("VND");
        return reg;
    }
}
