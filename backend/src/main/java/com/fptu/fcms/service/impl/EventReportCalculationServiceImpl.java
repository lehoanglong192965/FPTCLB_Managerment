package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.service.EventReportCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ tính toán số liệu snapshot cho báo cáo sự kiện.
 * Layer: Service Implementation.
 * Trách nhiệm chính: Thực hiện thuần túy các thuật toán tính toán thống kê (đăng ký, tham dự, tài chính, vé, đánh giá, phát hiện cảnh báo bất thường và đánh giá độ sẵn sàng nộp báo cáo).
 * Phụ thuộc trong luồng báo cáo tự động: Nhận vào EventReportingDataset do EventReportingDatasetService nạp sẵn, hoàn toàn xử lý tính toán trên RAM mà không thực hiện bất kỳ truy vấn CSDL nào.
 */
@Service
@RequiredArgsConstructor
public class EventReportCalculationServiceImpl implements EventReportCalculationService {

    public static final String GENERATOR_VERSION = "1.0.0";
    public static final String TEMPLATE_VERSION = "1.0.0";

    private static final Set<RegistrationStatus> VALID_REGISTRATION_STATUSES = EnumSet.of(
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.REGISTERED,
            RegistrationStatus.PROMOTED
    );

    private static final Set<PaymentStatus> UNRESOLVED_PAYMENT_STATUSES = EnumSet.of(
            PaymentStatus.PENDING,
            PaymentStatus.AWAITING_VERIFICATION
    );

    @Override
    public EventReportSnapshot calculateSnapshot(EventReportingDataset dataset) {
        Event event = dataset.event();
        List<EventRegistration> registrations = dataset.registrations() != null ? dataset.registrations() : List.of();
        List<GuestEventRegistration> guestRegistrations = dataset.guestRegistrations() != null ? dataset.guestRegistrations() : List.of();
        List<AttendanceSession> sessions = dataset.attendanceSessions() != null ? dataset.attendanceSessions() : List.of();
        List<AttendanceRecord> attendanceRecords = dataset.attendanceRecords() != null ? dataset.attendanceRecords() : List.of();

        // 1. Overview
        String eventCurrency = StringUtils.hasText(event.getTicketCurrency()) ? event.getTicketCurrency() : "VND";
        String clubName = event.getClubID() != null ? "CLB #" + event.getClubID() : "";
        String semester = event.getSemesterID() != null ? "Semester #" + event.getSemesterID() : "";

        EventReportSnapshot.EventOverview overview = new EventReportSnapshot.EventOverview(
                event.getEventID(),
                event.getEventCode(),
                event.getEventName(),
                clubName,
                semester,
                event.getLocation(),
                event.getLocationDetail(),
                event.getDescription(),
                Boolean.TRUE.equals(event.getIsInternal()),
                event.getStartDate(),
                event.getEndDate(),
                event.getRegistrationOpenAt(),
                event.getRegistrationCloseAt(),
                event.getCheckInOpenAt(),
                event.getCheckInCloseAt(),
                event.getMaxParticipants() != null ? event.getMaxParticipants() : event.getTotalCapacity(),
                Boolean.TRUE.equals(event.getAllowWalkIn()),
                Boolean.TRUE.equals(event.getIsPaidEvent()),
                event.getTicketPrice() != null ? event.getTicketPrice() : BigDecimal.ZERO,
                eventCurrency,
                event.getBudget() != null ? event.getBudget() : BigDecimal.ZERO,
                event.getEventStatus() != null ? event.getEventStatus().name() : ""
        );

        // 2. Registration Metrics & Breakdowns
        int totalRegistrations = registrations.size() + guestRegistrations.size();
        int confirmedRegistrations = (int) (registrations.stream().filter(this::isValid).count()
                + guestRegistrations.stream().filter(this::isValid).count());
        int cancelledRegistrations = (int) (registrations.stream().filter(r -> RegistrationStatus.CANCELLED.equals(r.getRegistrationStatus())).count()
                + guestRegistrations.stream().filter(r -> RegistrationStatus.CANCELLED.equals(r.getRegistrationStatus())).count());
        int rejectedRegistrations = (int) (registrations.stream().filter(r -> RegistrationStatus.REJECTED.equals(r.getRegistrationStatus())).count()
                + guestRegistrations.stream().filter(r -> RegistrationStatus.REJECTED.equals(r.getRegistrationStatus())).count());

        int fptuRegistrations = (int) registrations.stream().filter(this::isValid).filter(r -> r.getUserID() != null).count();
        int guestRegistrationCount = (int) (registrations.stream().filter(this::isValid).filter(r -> r.getUserID() == null).count()
                + guestRegistrations.stream().filter(this::isValid).count());
        int walkInRegistrations = (int) (registrations.stream().filter(this::isValid).filter(r -> RegistrationChannel.WALK_IN.equals(r.getRegistrationChannel())).count()
                + guestRegistrations.stream().filter(this::isValid).filter(r -> RegistrationChannel.WALK_IN.equals(r.getRegistrationChannel())).count());

        double confirmationRate = percentage(confirmedRegistrations, totalRegistrations);
        double cancellationRate = percentage(cancelledRegistrations, totalRegistrations);

        Map<String, Integer> regStatusBreakdown = new HashMap<>();
        registrations.forEach(r -> regStatusBreakdown.merge(enumName(r.getRegistrationStatus()), 1, Integer::sum));
        guestRegistrations.forEach(r -> regStatusBreakdown.merge(enumName(r.getRegistrationStatus()), 1, Integer::sum));

        Map<String, Integer> regChannelBreakdown = new HashMap<>();
        registrations.forEach(r -> regChannelBreakdown.merge(enumName(r.getRegistrationChannel()), 1, Integer::sum));
        guestRegistrations.forEach(r -> regChannelBreakdown.merge(enumName(r.getRegistrationChannel()), 1, Integer::sum));

        EventReportSnapshot.RegistrationMetrics registrationMetrics = new EventReportSnapshot.RegistrationMetrics(
                totalRegistrations,
                confirmedRegistrations,
                cancelledRegistrations,
                rejectedRegistrations,
                fptuRegistrations,
                guestRegistrationCount,
                walkInRegistrations,
                confirmationRate,
                cancellationRate,
                regStatusBreakdown,
                regChannelBreakdown
        );

        // 3. Ticket Metrics & Group Order Calculations
        List<EventRegistration> validMemberRegs = registrations.stream().filter(this::isValid).toList();
        List<GuestEventRegistration> validGuestRegs = guestRegistrations.stream().filter(this::isValid).toList();

        int issuedTicketCount = (int) (validMemberRegs.stream().filter(r -> StringUtils.hasText(r.getTicketCode())).count()
                + validGuestRegs.stream().filter(r -> StringUtils.hasText(r.getTicketCode())).count());

        int activeTicketCount = (int) (validMemberRegs.stream().filter(r -> StringUtils.hasText(r.getTicketCode()) && r.getTicketRevokedAt() == null).count()
                + validGuestRegs.stream().filter(r -> StringUtils.hasText(r.getTicketCode()) && r.getTicketRevokedAt() == null).count());

        int revokedTicketCount = (int) (validMemberRegs.stream().filter(r -> StringUtils.hasText(r.getTicketCode()) && r.getTicketRevokedAt() != null).count()
                + validGuestRegs.stream().filter(r -> StringUtils.hasText(r.getTicketCode()) && r.getTicketRevokedAt() != null).count());

        int validRegistrationsWithoutTicket = confirmedRegistrations - issuedTicketCount;

        int freeTicketCount = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.NOT_REQUIRED.equals(r.getPaymentStatus()) || (r.getAmountDue() != null && r.getAmountDue().compareTo(BigDecimal.ZERO) <= 0)).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.NOT_REQUIRED.equals(r.getPaymentStatus()) || (r.getAmountDue() != null && r.getAmountDue().compareTo(BigDecimal.ZERO) <= 0)).count());

        int paidTicketCount = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus())).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus())).count());

        Map<String, Integer> ticketsPerOrderMap = new HashMap<>();
        int legacyMemberOrders = 0;
        for (EventRegistration r : validMemberRegs) {
            if (StringUtils.hasText(r.getTicketOrderCode())) {
                ticketsPerOrderMap.put(r.getTicketOrderCode(), ticketsPerOrderMap.getOrDefault(r.getTicketOrderCode(), 0) + 1);
            } else {
                legacyMemberOrders++;
            }
        }
        int guestOrders = validGuestRegs.size();
        int distinctOrderCount = ticketsPerOrderMap.size() + legacyMemberOrders + guestOrders;
        int multiTicketOrderCount = (int) ticketsPerOrderMap.values().stream().filter(c -> c > 1).count();
        double averageTicketsPerOrder = distinctOrderCount > 0 ? (double) issuedTicketCount / distinctOrderCount : 0.0;
        int maxTicketsInSingleOrder = ticketsPerOrderMap.values().stream().mapToInt(v -> v).max().orElse(issuedTicketCount > 0 ? 1 : 0);

        EventReportSnapshot.TicketMetrics ticketMetrics = new EventReportSnapshot.TicketMetrics(
                issuedTicketCount,
                activeTicketCount,
                revokedTicketCount,
                validRegistrationsWithoutTicket,
                freeTicketCount,
                paidTicketCount,
                distinctOrderCount,
                multiTicketOrderCount,
                averageTicketsPerOrder,
                maxTicketsInSingleOrder
        );

        // 4. Payment Metrics & Breakdowns
        BigDecimal totalAmountDue = validMemberRegs.stream()
                .map(EventRegistration::getAmountDue)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(validGuestRegs.stream()
                        .map(GuestEventRegistration::getAmountDue)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        BigDecimal totalAmountPaid = validMemberRegs.stream()
                .filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()))
                .map(EventRegistration::getAmountPaid)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(validGuestRegs.stream()
                        .filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()))
                        .map(GuestEventRegistration::getAmountPaid)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        BigDecimal totalAmountRemaining = totalAmountDue.subtract(totalAmountPaid).max(BigDecimal.ZERO);

        int paidPaymentCount = paidTicketCount;
        int pendingPaymentCount = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.PENDING.equals(r.getPaymentStatus())).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.PENDING.equals(r.getPaymentStatus())).count());
        int awaitingVerificationCount = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.AWAITING_VERIFICATION.equals(r.getPaymentStatus())).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.AWAITING_VERIFICATION.equals(r.getPaymentStatus())).count());
        int expiredPaymentCount = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.EXPIRED.equals(r.getPaymentStatus())).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.EXPIRED.equals(r.getPaymentStatus())).count());
        int notRequiredPaymentCount = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.NOT_REQUIRED.equals(r.getPaymentStatus())).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.NOT_REQUIRED.equals(r.getPaymentStatus())).count());

        double collectionRate = totalAmountDue.compareTo(BigDecimal.ZERO) > 0
                ? totalAmountPaid.multiply(BigDecimal.valueOf(100)).divide(totalAmountDue, 2, RoundingMode.HALF_UP).doubleValue()
                : 100.0;

        Map<String, Integer> paymentStatusBreakdown = new HashMap<>();
        validMemberRegs.forEach(r -> paymentStatusBreakdown.merge(enumName(r.getPaymentStatus()), 1, Integer::sum));
        validGuestRegs.forEach(r -> paymentStatusBreakdown.merge(enumName(r.getPaymentStatus()), 1, Integer::sum));

        Map<String, Integer> paymentMethodBreakdown = new HashMap<>();
        validMemberRegs.forEach(r -> paymentMethodBreakdown.merge(enumName(r.getPaymentMethod()), 1, Integer::sum));
        validGuestRegs.forEach(r -> paymentMethodBreakdown.merge(enumName(r.getPaymentMethod()), 1, Integer::sum));

        // 5. Attendance Metrics & Breakdowns
        Set<String> presentIdentities = new HashSet<>();
        Set<String> absentIdentities = new HashSet<>();

        Map<String, Integer> attendanceMethodBreakdown = new HashMap<>();
        Map<String, Integer> verificationMethodBreakdown = new HashMap<>();

        for (AttendanceRecord record : attendanceRecords) {
            String identity = attendanceIdentity(record);
            if (AttendanceStatus.PRESENT.equals(record.getAttendanceStatus())) {
                presentIdentities.add(identity);
            } else if (AttendanceStatus.ABSENT.equals(record.getAttendanceStatus())) {
                absentIdentities.add(identity);
            }
            if (record.getCheckInMethod() != null) {
                attendanceMethodBreakdown.merge(record.getCheckInMethod().name(), 1, Integer::sum);
            }
            if (StringUtils.hasText(record.getVerificationMethod())) {
                verificationMethodBreakdown.merge(record.getVerificationMethod(), 1, Integer::sum);
            }
        }
        absentIdentities.removeAll(presentIdentities);

        int presentParticipants = presentIdentities.size();
        int absentParticipants = absentIdentities.size();
        double attendanceRate = percentage(presentParticipants, confirmedRegistrations);
        double noShowRate = percentage(absentParticipants, confirmedRegistrations);

        BigDecimal revenuePerAttendee = presentParticipants > 0
                ? totalAmountPaid.divide(BigDecimal.valueOf(presentParticipants), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal revenueToBudgetRatio = overview.plannedBudget().compareTo(BigDecimal.ZERO) > 0
                ? totalAmountPaid.multiply(BigDecimal.valueOf(100)).divide(overview.plannedBudget(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        EventReportSnapshot.PaymentMetrics paymentMetrics = new EventReportSnapshot.PaymentMetrics(
                totalAmountDue,
                totalAmountPaid,
                totalAmountRemaining,
                paidPaymentCount,
                pendingPaymentCount,
                awaitingVerificationCount,
                expiredPaymentCount,
                notRequiredPaymentCount,
                collectionRate,
                revenuePerAttendee,
                revenueToBudgetRatio,
                paymentStatusBreakdown,
                paymentMethodBreakdown
        );

        int fptuPresent = (int) validMemberRegs.stream().filter(r -> r.getUserID() != null && presentIdentities.contains("R:" + r.getRegistrationID())).count();
        int guestPresent = (int) (validMemberRegs.stream().filter(r -> r.getUserID() == null && presentIdentities.contains("R:" + r.getRegistrationID())).count()
                + validGuestRegs.stream().filter(r -> presentIdentities.contains("G:" + r.getGuestRegistrationID())).count());
        int paidPresent = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()) && presentIdentities.contains("R:" + r.getRegistrationID())).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()) && presentIdentities.contains("G:" + r.getGuestRegistrationID())).count());
        int paidNoShow = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()) && absentIdentities.contains("R:" + r.getRegistrationID())).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()) && absentIdentities.contains("G:" + r.getGuestRegistrationID())).count());
        int freePresent = presentParticipants - paidPresent;

        EventReportSnapshot.AttendanceMetrics attendanceMetrics = new EventReportSnapshot.AttendanceMetrics(
                sessions.size(),
                confirmedRegistrations,
                presentParticipants,
                absentParticipants,
                attendanceRate,
                noShowRate,
                walkInRegistrations,
                fptuPresent,
                guestPresent,
                paidPresent,
                paidNoShow,
                freePresent,
                attendanceMethodBreakdown,
                verificationMethodBreakdown
        );

        // 6. Comprehensive Warning Engine (All 12 Rules)
        List<EventReportSnapshot.ReportWarning> warnings = new ArrayList<>();

        // Rule 1: No attendance session
        if (sessions.isEmpty()) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "NO_ATTENDANCE_SESSION", "BLOCKING", "Chưa tạo phiên điểm danh",
                    "Sự kiện chưa có phiên điểm danh nào.", 1, true
            ));
        }

        // Rule 2: Unclosed attendance session
        int unclosedCount = (int) sessions.stream().filter(s -> !AttendanceSessionStatus.CLOSED.equals(s.getStatus())).count();
        if (unclosedCount > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "SESSION_NOT_CLOSED", "BLOCKING", "Phiên điểm danh chưa đóng",
                    "Có " + unclosedCount + " phiên điểm danh chưa chuyển sang trạng thái CLOSED.", unclosedCount, true
            ));
        }

        // Rule 3: Pending/Awaiting Payments
        int unresolvedPayments = pendingPaymentCount + awaitingVerificationCount;
        if (unresolvedPayments > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "UNRESOLVED_PAYMENT", "BLOCKING", "Còn giao dịch chờ xử lý",
                    "Vẫn còn " + unresolvedPayments + " đăng ký ở trạng thái PENDING hoặc AWAITING_VERIFICATION.", unresolvedPayments, true
            ));
        }

        // Rule 4: Currency mismatch
        boolean currencyConsistent = true;
        Set<String> distinctCurrencies = new HashSet<>();
        validMemberRegs.stream().map(EventRegistration::getPaymentCurrency).filter(StringUtils::hasText).forEach(distinctCurrencies::add);
        validGuestRegs.stream().map(GuestEventRegistration::getPaymentCurrency).filter(StringUtils::hasText).forEach(distinctCurrencies::add);
        if (distinctCurrencies.size() > 1 || (distinctCurrencies.size() == 1 && !distinctCurrencies.contains(eventCurrency))) {
            currencyConsistent = false;
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "CURRENCY_CONFLICT", "BLOCKING", "Bất đồng đơn vị tiền tệ",
                    "Phát hiện nhiều loại tiền tệ khác nhau trong danh sách đăng ký.", distinctCurrencies.size(), true
            ));
        }

        // Rule 5: Paid with zero amount
        int paidZeroAmount = (int) (validMemberRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()) && (r.getAmountPaid() == null || r.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0)).count()
                + validGuestRegs.stream().filter(r -> PaymentStatus.PAID.equals(r.getPaymentStatus()) && (r.getAmountPaid() == null || r.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0)).count());
        if (paidZeroAmount > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "PAID_ZERO_AMOUNT", "WARNING", "Đã thanh toán nhưng số tiền = 0",
                    "Có " + paidZeroAmount + " vé có trạng thái PAID nhưng số tiền đã trả <= 0.", paidZeroAmount, false
            ));
        }

        // Rule 6: Overpaid amount
        int overpaidCount = (int) (validMemberRegs.stream().filter(r -> r.getAmountPaid() != null && r.getAmountDue() != null && r.getAmountPaid().compareTo(r.getAmountDue()) > 0).count()
                + validGuestRegs.stream().filter(r -> r.getAmountPaid() != null && r.getAmountDue() != null && r.getAmountPaid().compareTo(r.getAmountDue()) > 0).count());
        if (overpaidCount > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "OVERPAID", "WARNING", "Thanh toán thừa tiền",
                    "Có " + overpaidCount + " đăng ký có số tiền thanh toán lớn hơn số tiền phải trả.", overpaidCount, false
            ));
        }

        // Rule 7: Valid registration missing ticket
        if (validRegistrationsWithoutTicket > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "MISSING_TICKET", "WARNING", "Đăng ký hợp lệ chưa có mã vé",
                    "Có " + validRegistrationsWithoutTicket + " đăng ký hợp lệ nhưng chưa được phát hành mã vé.", validRegistrationsWithoutTicket, false
            ));
        }

        // Rule 8: Invalid registration with active ticket
        int invalidWithActiveTicket = (int) (registrations.stream().filter(r -> !isValid(r) && StringUtils.hasText(r.getTicketCode()) && r.getTicketRevokedAt() == null).count()
                + guestRegistrations.stream().filter(r -> !isValid(r) && StringUtils.hasText(r.getTicketCode()) && r.getTicketRevokedAt() == null).count());
        if (invalidWithActiveTicket > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "INVALID_REGISTRATION_WITH_TICKET", "WARNING", "Đăng ký đã hủy/từ chối vẫn giữ vé active",
                    "Có " + invalidWithActiveTicket + " đăng ký đã hủy hoặc bị từ chối nhưng vé vẫn ở trạng thái hiệu lực.", invalidWithActiveTicket, false
            ));
        }

        // Rule 9: Revoked ticket marked PRESENT
        int revokedTicketPresent = (int) (validMemberRegs.stream().filter(r -> r.getTicketRevokedAt() != null && presentIdentities.contains("R:" + r.getRegistrationID())).count()
                + validGuestRegs.stream().filter(r -> r.getTicketRevokedAt() != null && presentIdentities.contains("G:" + r.getGuestRegistrationID())).count());
        if (revokedTicketPresent > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "REVOKED_TICKET_PRESENT", "WARNING", "Vé bị thu hồi nhưng vẫn điểm danh PRESENT",
                    "Có " + revokedTicketPresent + " người dùng có vé bị thu hồi nhưng vẫn được điểm danh tham dự.", revokedTicketPresent, false
            ));
        }

        // Rule 10: Pending payment marked PRESENT
        int pendingPaymentPresent = (int) (validMemberRegs.stream().filter(r -> UNRESOLVED_PAYMENT_STATUSES.contains(r.getPaymentStatus()) && presentIdentities.contains("R:" + r.getRegistrationID())).count()
                + validGuestRegs.stream().filter(r -> UNRESOLVED_PAYMENT_STATUSES.contains(r.getPaymentStatus()) && presentIdentities.contains("G:" + r.getGuestRegistrationID())).count());
        if (pendingPaymentPresent > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "PENDING_PAYMENT_PRESENT", "WARNING", "Chưa hoàn tất thanh toán nhưng đã check-in",
                    "Có " + pendingPaymentPresent + " đăng ký chưa hoàn tất thanh toán nhưng đã được điểm danh PRESENT.", pendingPaymentPresent, false
            ));
        }

        // Rule 11: Duplicate payment reference
        Map<String, Long> refCounts = new HashMap<>();
        validMemberRegs.stream().map(EventRegistration::getPaymentReference).filter(StringUtils::hasText).forEach(ref -> refCounts.merge(ref, 1L, Long::sum));
        validGuestRegs.stream().map(GuestEventRegistration::getPaymentReference).filter(StringUtils::hasText).forEach(ref -> refCounts.merge(ref, 1L, Long::sum));
        int duplicateRefs = (int) refCounts.values().stream().filter(c -> c > 1).count();
        if (duplicateRefs > 0) {
            warnings.add(new EventReportSnapshot.ReportWarning(
                    "DUPLICATE_PAYMENT_REF", "WARNING", "Mã đối chiếu thanh toán trùng lặp",
                    "Phát hiện " + duplicateRefs + " mã đối chiếu thanh toán bị dùng trùng cho nhiều đơn đăng ký.", duplicateRefs, false
            ));
        }

        boolean eventCompleted = EventStatus.COMPLETED.equals(event.getEventStatus())
                || EventStatus.REPORT_REJECTED.equals(event.getEventStatus())
                || EventStatus.REPORT_UPLOADED.equals(event.getEventStatus())
                || EventStatus.REPORT_PENDING_APPROVAL.equals(event.getEventStatus())
                || EventStatus.REPORT_APPROVED.equals(event.getEventStatus());
        boolean attendanceReady = !sessions.isEmpty() && unclosedCount == 0;
        int blockingWarningCount = (int) warnings.stream().filter(EventReportSnapshot.ReportWarning::blocking).count();
        boolean isReady = eventCompleted && attendanceReady && (unresolvedPayments == 0) && currencyConsistent && (blockingWarningCount == 0);

        EventReportSnapshot.ReportReadiness readiness = new EventReportSnapshot.ReportReadiness(
                isReady,
                eventCompleted,
                attendanceReady,
                unresolvedPayments == 0,
                currencyConsistent,
                blockingWarningCount
        );

        List<com.fptu.fcms.entity.EventFeedback> feedbacks = dataset.feedbacks() != null ? dataset.feedbacks() : List.of();
        int feedbackCount = feedbacks.size();
        double averageRatingDouble = feedbacks.stream()
                .map(com.fptu.fcms.entity.EventFeedback::getOverallRating)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        BigDecimal averageOverallRating = BigDecimal.valueOf(averageRatingDouble).setScale(2, RoundingMode.HALF_UP);
        double feedbackResponseRateDouble = presentParticipants > 0 ? (feedbackCount * 100.0 / presentParticipants) : 0.0;
        BigDecimal feedbackResponseRate = BigDecimal.valueOf(feedbackResponseRateDouble).setScale(2, RoundingMode.HALF_UP);

        EventReportSnapshot.FeedbackMetrics feedbackMetrics = new EventReportSnapshot.FeedbackMetrics(
                feedbackCount,
                averageOverallRating,
                feedbackResponseRate
        );

        return new EventReportSnapshot(
                overview,
                registrationMetrics,
                ticketMetrics,
                paymentMetrics,
                attendanceMetrics,
                feedbackMetrics,
                warnings,
                readiness,
                LocalDateTime.now(),
                GENERATOR_VERSION,
                TEMPLATE_VERSION
        );
    }

    private boolean isValid(EventRegistration registration) {
        return VALID_REGISTRATION_STATUSES.contains(registration.getRegistrationStatus());
    }

    private boolean isValid(GuestEventRegistration registration) {
        return VALID_REGISTRATION_STATUSES.contains(registration.getRegistrationStatus());
    }

    private String attendanceIdentity(AttendanceRecord record) {
        if (record.getRegistrationID() != null) return "R:" + record.getRegistrationID();
        if (record.getGuestRegistrationID() != null) return "G:" + record.getGuestRegistrationID();
        if (record.getUserID() != null) return "U:" + record.getUserID();
        return "A:" + record.getRecordID();
    }

    private String enumName(Enum<?> value) {
        return value == null ? "N/A" : value.name();
    }

    private double percentage(long numerator, long denominator) {
        if (denominator <= 0) return 0.0;
        return BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
