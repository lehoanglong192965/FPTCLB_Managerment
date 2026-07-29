package com.fptu.fcms.dto.reporting;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object (DTO) đại diện cho toàn bộ số liệu snapshot tổng hợp của một sự kiện tại thời điểm lập báo cáo.
 * Layer: DTO.
 * Trách nhiệm chính: Đóng gói đầy đủ các chỉ số thống kê (thông tin sự kiện, đăng ký, vé, tài chính, điểm danh, đánh giá, cảnh báo và độ sẵn sàng nộp báo cáo).
 * Phụ thuộc/Sử dụng: Được tính toán bởi EventReportCalculationService từ EventReportingDataset, sau đó được trả về cho Frontend hoặc truyền sang EventReportPdfRenderer để render file PDF.
 */
public record EventReportSnapshot(
        EventOverview event,
        RegistrationMetrics registrations,
        TicketMetrics tickets,
        PaymentMetrics payments,
        AttendanceMetrics attendance,
        FeedbackMetrics feedback,
        List<ReportWarning> warnings,
        ReportReadiness readiness,
        LocalDateTime generatedAt,
        String generatorVersion,
        String templateVersion
) {
    public record EventOverview(
            Integer eventId,
            String eventCode,
            String eventName,
            String clubName,
            String semester,
            String location,
            String locationDetail,
            String description,
            Boolean isInternal,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime registrationStartTime,
            LocalDateTime registrationEndTime,
            LocalDateTime checkInOpenAt,
            LocalDateTime checkInCloseAt,
            Integer capacity,
            Boolean allowWalkIn,
            Boolean isPaid,
            BigDecimal ticketPrice,
            String currency,
            BigDecimal plannedBudget,
            String eventStatus
    ) {
        public boolean getIsInternal() { return isInternal != null && isInternal; }
        public boolean getIsPaid() { return isPaid != null && isPaid; }
        public boolean getAllowWalkIn() { return allowWalkIn != null && allowWalkIn; }
    }

    public record RegistrationMetrics(
            int totalRegistrations,
            int confirmedRegistrations,
            int cancelledRegistrations,
            int rejectedRegistrations,
            int fptuRegistrations,
            int guestRegistrations,
            int walkInRegistrations,
            double confirmationRate,
            double cancellationRate,
            Map<String, Integer> statusBreakdown,
            Map<String, Integer> channelBreakdown
    ) {}

    public record TicketMetrics(
            int issuedTicketCount,
            int activeTicketCount,
            int revokedTicketCount,
            int validRegistrationsWithoutTicket,
            int freeTicketCount,
            int paidTicketCount,
            int distinctOrderCount,
            int multiTicketOrderCount,
            double averageTicketsPerOrder,
            int maxTicketsInSingleOrder
    ) {}

    public record PaymentMetrics(
            BigDecimal totalAmountDue,
            BigDecimal totalAmountPaid,
            BigDecimal totalAmountRemaining,
            int paidPaymentCount,
            int pendingPaymentCount,
            int awaitingVerificationCount,
            int expiredPaymentCount,
            int notRequiredPaymentCount,
            double collectionRate,
            BigDecimal revenuePerAttendee,
            BigDecimal revenueToBudgetRatio,
            Map<String, Integer> statusBreakdown,
            Map<String, Integer> methodBreakdown
    ) {}

    public record AttendanceMetrics(
            int attendanceSessionCount,
            int eligibleAttendees,
            int presentParticipants,
            int absentParticipants,
            double attendanceRate,
            double noShowRate,
            int walkInParticipants,
            int fptuPresent,
            int guestPresent,
            int paidPresent,
            int paidNoShow,
            int freePresent,
            Map<String, Integer> methodBreakdown,
            Map<String, Integer> verificationBreakdown
    ) {}

    public record FeedbackMetrics(
            int feedbackCount,
            BigDecimal averageOverallRating,
            BigDecimal feedbackResponseRate
    ) {}

    public record ReportWarning(
            String code,
            String severity, // INFO, WARNING, BLOCKING
            String title,
            String description,
            int affectedCount,
            boolean blocking
    ) {}

    public record ReportReadiness(
            boolean isReady,
            boolean eventCompleted,
            boolean attendanceReady,
            boolean noPendingPayments,
            boolean currencyConsistent,
            int blockingWarningCount
    ) {}
}
