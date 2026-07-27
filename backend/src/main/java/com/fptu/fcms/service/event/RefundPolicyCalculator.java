package com.fptu.fcms.service.event;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

public final class RefundPolicyCalculator {

    public static final String POLICY_VERSION = "TIME_BASED_REFUND_V1";
    private static final BigDecimal FULL = new BigDecimal("100.00");
    private static final BigDecimal SEVENTY_FIVE = new BigDecimal("75.00");
    private static final BigDecimal FIFTY = new BigDecimal("50.00");
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private RefundPolicyCalculator() {
    }

    public static RefundQuote quote(BigDecimal paidAmount, LocalDateTime eventStart,
                                    LocalDateTime cancelledAt, boolean organizerCancelled) {
        BigDecimal rate = organizerCancelled ? FULL : participantRate(eventStart, cancelledAt);
        String tier = organizerCancelled ? "ORGANIZER_CANCELLED_100"
                : participantTier(eventStart, cancelledAt);
        BigDecimal baseAmount = paidAmount == null ? BigDecimal.ZERO : paidAmount.max(BigDecimal.ZERO);
        BigDecimal refundAmount = calculateAmount(baseAmount, rate);
        String snapshot = POLICY_VERSION + ":" + tier;
        String note = "Số tiền gốc " + baseAmount.setScale(2, RoundingMode.HALF_UP).toPlainString()
                + " x " + rate.setScale(2, RoundingMode.HALF_UP).toPlainString()
                + "% = " + refundAmount.toPlainString();
        return new RefundQuote(rate, refundAmount, snapshot, note);
    }

    public static BigDecimal calculateAmount(BigDecimal paidAmount, BigDecimal rate) {
        BigDecimal safeAmount = paidAmount == null ? BigDecimal.ZERO : paidAmount.max(BigDecimal.ZERO);
        BigDecimal safeRate = rate == null ? FULL : rate.max(ZERO).min(FULL);
        return safeAmount.multiply(safeRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal participantRate(LocalDateTime eventStart, LocalDateTime cancelledAt) {
        String tier = participantTier(eventStart, cancelledAt);
        return switch (tier) {
            case "AT_LEAST_7_DAYS_100" -> FULL;
            case "AT_LEAST_3_DAYS_75" -> SEVENTY_FIVE;
            case "AT_LEAST_24_HOURS_50" -> FIFTY;
            default -> ZERO;
        };
    }

    private static String participantTier(LocalDateTime eventStart, LocalDateTime cancelledAt) {
        if (eventStart == null || cancelledAt == null || !cancelledAt.isBefore(eventStart)) {
            return "LESS_THAN_24_HOURS_0";
        }
        long minutes = Duration.between(cancelledAt, eventStart).toMinutes();
        if (minutes >= 7L * 24 * 60) return "AT_LEAST_7_DAYS_100";
        if (minutes >= 3L * 24 * 60) return "AT_LEAST_3_DAYS_75";
        if (minutes >= 24L * 60) return "AT_LEAST_24_HOURS_50";
        return "LESS_THAN_24_HOURS_0";
    }

    public record RefundQuote(BigDecimal rate, BigDecimal amount, String policySnapshot, String calculationNote) {
    }
}
