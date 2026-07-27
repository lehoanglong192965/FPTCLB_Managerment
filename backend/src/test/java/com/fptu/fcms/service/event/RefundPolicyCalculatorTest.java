package com.fptu.fcms.service.event;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundPolicyCalculatorTest {

    private final LocalDateTime start = LocalDateTime.of(2026, 8, 15, 8, 0);
    private final BigDecimal paid = new BigDecimal("30000");

    @Test
    void appliesParticipantTimeTiersAtExactBoundaries() {
        assertQuote(start.minusDays(7), "100.00", "30000.00");
        assertQuote(start.minusDays(3), "75.00", "22500.00");
        assertQuote(start.minusHours(24), "50.00", "15000.00");
        assertQuote(start.minusHours(23).minusMinutes(59), "0.00", "0.00");
    }

    @Test
    void organizerCancellationAlwaysRefundsInFull() {
        var quote = RefundPolicyCalculator.quote(paid, start, start.plusHours(1), true);
        assertEquals(new BigDecimal("100.00"), quote.rate());
        assertEquals(new BigDecimal("30000.00"), quote.amount());
        assertEquals("TIME_BASED_REFUND_V1:ORGANIZER_CANCELLED_100", quote.policySnapshot());
    }

    private void assertQuote(LocalDateTime cancelledAt, String expectedRate, String expectedAmount) {
        var quote = RefundPolicyCalculator.quote(paid, start, cancelledAt, false);
        assertEquals(new BigDecimal(expectedRate), quote.rate());
        assertEquals(new BigDecimal(expectedAmount), quote.amount());
    }
}

