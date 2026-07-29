package com.fptu.fcms.service.event;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundPolicyCalculatorTest {

    private static final boolean OPEN = true;
    private static final boolean CLOSED = false;

    private final LocalDateTime start = LocalDateTime.of(2026, 8, 15, 8, 0);
    private final BigDecimal paid = new BigDecimal("30000");

    @Test
    void appliesEventStartTiersOnceRegistrationHasClosed() {
        assertQuote(CLOSED, start.minusDays(7), "100.00", "30000.00");
        assertQuote(CLOSED, start.minusDays(3), "75.00", "22500.00");
        assertQuote(CLOSED, start.minusHours(24), "50.00", "15000.00");
        assertQuote(CLOSED, start.minusHours(23).minusMinutes(59), "0.00", "0.00");
    }

    @Test
    void refundsInFullWhileRegistrationIsOpen() {
        // Sát giờ bắt đầu nhưng vẫn đang mở đăng ký: ghế bán lại được nên vẫn hoàn đủ.
        assertQuote(OPEN, start.minusMinutes(30), "100.00", "30000.00");

        var quote = RefundPolicyCalculator.quote(paid, start, OPEN, start.minusMinutes(30), false);
        assertEquals("TIME_BASED_REFUND_V2:REGISTRATION_OPEN_100", quote.policySnapshot());
    }

    @Test
    void tierFollowsEventStatusNotAnyTimestamp() {
        LocalDateTime cancelledAt = start.minusDays(1);
        Event event = event(EventStatus.REGISTRATION_OPEN);

        assertEquals(new BigDecimal("100.00"),
                RefundPolicyCalculator.quoteFor(event, paid, cancelledAt, false).rate());

        // Leader đóng đăng ký: cùng thời điểm huỷ đó giờ rơi xuống bậc thang, không cần đụng
        // tới bất kỳ mốc thời gian nào.
        event.setEventStatus(EventStatus.REGISTRATION_CLOSED);
        assertEquals(new BigDecimal("50.00"),
                RefundPolicyCalculator.quoteFor(event, paid, cancelledAt, false).rate());
    }

    @Test
    void editingTheScheduleCannotChangeTheTier() {
        Event event = event(EventStatus.REGISTRATION_CLOSED);
        LocalDateTime cancelledAt = start.minusDays(5);
        BigDecimal before = RefundPolicyCalculator.quoteFor(event, paid, cancelledAt, false).rate();

        event.setRegistrationCloseAt(start.minusYears(1));
        event.setRegistrationOpenAt(start.minusYears(2));

        assertEquals(before, RefundPolicyCalculator.quoteFor(event, paid, cancelledAt, false).rate());
    }

    @Test
    void organizerCancellationAlwaysRefundsInFull() {
        var quote = RefundPolicyCalculator.quote(paid, start, CLOSED, start.plusHours(1), true);
        assertEquals(new BigDecimal("100.00"), quote.rate());
        assertEquals(new BigDecimal("30000.00"), quote.amount());
        assertEquals("TIME_BASED_REFUND_V2:ORGANIZER_CANCELLED_100", quote.policySnapshot());
    }

    private Event event(EventStatus status) {
        Event event = new Event();
        event.setStartDate(start);
        event.setRegistrationCloseAt(start.minusDays(2));
        event.setEventStatus(status);
        return event;
    }

    private void assertQuote(boolean registrationOpen, LocalDateTime cancelledAt,
                             String expectedRate, String expectedAmount) {
        var quote = RefundPolicyCalculator.quote(paid, start, registrationOpen, cancelledAt, false);
        assertEquals(new BigDecimal(expectedRate), quote.rate());
        assertEquals(new BigDecimal(expectedAmount), quote.amount());
    }
}
