package com.fptu.fcms.service.event;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

public final class RefundPolicyCalculator {

    public static final String POLICY_VERSION = "TIME_BASED_REFUND_V2";
    private static final BigDecimal FULL = new BigDecimal("100.00");
    private static final BigDecimal SEVENTY_FIVE = new BigDecimal("75.00");
    private static final BigDecimal FIFTY = new BigDecimal("50.00");
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private RefundPolicyCalculator() {
    }

    /**
     * Mức hoàn được quyết định bởi TRẠNG THÁI sự kiện tại thời điểm huỷ, không phải bởi so sánh
     * với một mốc thời gian sửa được. Còn đang mở đăng ký nghĩa là ghế vẫn bán lại được
     * (waitlist sẽ được đôn lên) nên hoàn đủ; đóng rồi thì áp bậc thang theo giờ bắt đầu vì
     * thiệt hại của CLB tăng dần theo mức độ đã cam kết chi.
     */
    public static RefundQuote quoteFor(Event event, BigDecimal paidAmount, LocalDateTime cancelledAt,
                                       boolean organizerCancelled) {
        return quote(paidAmount,
                event == null ? null : event.getStartDate(),
                isRegistrationOpen(event),
                cancelledAt,
                organizerCancelled);
    }

    public static boolean isRegistrationOpen(Event event) {
        return event != null && EventStatus.REGISTRATION_OPEN.equals(event.getEventStatus());
    }

    public static RefundQuote quote(BigDecimal paidAmount, LocalDateTime eventStart, boolean registrationOpen,
                                    LocalDateTime cancelledAt, boolean organizerCancelled) {
        String tier = organizerCancelled ? "ORGANIZER_CANCELLED_100"
                : participantTier(eventStart, registrationOpen, cancelledAt);
        BigDecimal rate = rateOf(tier);
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
        // Làm tròn về đồng chẵn: không thể chuyển khoản phần lẻ xu, để lại số lẻ thì khoản hoàn
        // vĩnh viễn không khớp được khi đối soát.
        return safeAmount.multiply(safeRate)
                .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.UNNECESSARY);
    }

    private static BigDecimal rateOf(String tier) {
        return switch (tier) {
            case "ORGANIZER_CANCELLED_100", "REGISTRATION_OPEN_100", "AT_LEAST_7_DAYS_100" -> FULL;
            case "AT_LEAST_3_DAYS_75" -> SEVENTY_FIVE;
            case "AT_LEAST_24_HOURS_50" -> FIFTY;
            default -> ZERO;
        };
    }

    private static String participantTier(LocalDateTime eventStart, boolean registrationOpen,
                                          LocalDateTime cancelledAt) {
        if (registrationOpen) {
            return "REGISTRATION_OPEN_100";
        }
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
