package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.EventReportStatisticsResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventFeedbackRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventReportStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventReportStatisticsServiceImpl implements EventReportStatisticsService {

    private static final Set<RegistrationStatus> VALID_REGISTRATION_STATUSES = EnumSet.of(
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.REGISTERED,
            RegistrationStatus.PROMOTED
    );
    private static final Set<PaymentStatus> UNRESOLVED_PAYMENT_STATUSES = EnumSet.of(
            PaymentStatus.PENDING,
            PaymentStatus.AWAITING_VERIFICATION
    );

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventFeedbackRepository eventFeedbackRepository;
    private final EventAssignmentAccessService eventAssignmentAccessService;

    @Override
    @Transactional(readOnly = true)
    public EventReportStatisticsResponse calculate(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));

        List<EventRegistration> registrations =
                eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        List<GuestEventRegistration> guestRegistrations =
                guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);

        long totalRegistrations = registrations.size() + guestRegistrations.size();
        long confirmedRegistrations = registrations.stream().filter(this::isValid).count()
                + guestRegistrations.stream().filter(this::isValid).count();
        long cancelledRegistrations = registrations.stream().filter(this::isCancelledOrRejected).count()
                + guestRegistrations.stream().filter(this::isCancelledOrRejected).count();
        long fptuRegistrations = registrations.stream()
                .filter(this::isValid)
                .filter(registration -> registration.getUserID() != null)
                .count();
        long guestRegistrationCount = registrations.stream()
                .filter(this::isValid)
                .filter(registration -> registration.getUserID() == null)
                .count()
                + guestRegistrations.stream().filter(this::isValid).count();
        long pendingPaymentCount = registrations.stream()
                .filter(this::isValid)
                .filter(registration -> UNRESOLVED_PAYMENT_STATUSES.contains(registration.getPaymentStatus()))
                .count()
                + guestRegistrations.stream()
                .filter(this::isValid)
                .filter(registration -> UNRESOLVED_PAYMENT_STATUSES.contains(registration.getPaymentStatus()))
                .count();
        long paidTicketCount = registrations.stream()
                .filter(this::isValid)
                .filter(registration -> PaymentStatus.PAID.equals(registration.getPaymentStatus()))
                .count()
                + guestRegistrations.stream()
                .filter(this::isValid)
                .filter(registration -> PaymentStatus.PAID.equals(registration.getPaymentStatus()))
                .count();
        BigDecimal revenue = registrations.stream()
                .filter(this::isValid)
                .filter(registration -> PaymentStatus.PAID.equals(registration.getPaymentStatus()))
                .map(EventRegistration::getAmountPaid)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(guestRegistrations.stream()
                        .filter(this::isValid)
                        .filter(registration -> PaymentStatus.PAID.equals(registration.getPaymentStatus()))
                        .map(GuestEventRegistration::getAmountPaid)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        long walkInParticipants = registrations.stream()
                .filter(this::isValid)
                .filter(registration -> RegistrationChannel.WALK_IN.equals(registration.getRegistrationChannel()))
                .count()
                + guestRegistrations.stream()
                .filter(this::isValid)
                .filter(registration -> RegistrationChannel.WALK_IN.equals(registration.getRegistrationChannel()))
                .count();

        List<AttendanceSession> sessions =
                attendanceSessionRepository.findByEventIDAndIsDeletedFalseOrderByCheckInTimeAsc(eventId);
        List<Integer> sessionIds = sessions.stream()
                .map(AttendanceSession::getSessionID)
                .filter(Objects::nonNull)
                .toList();
        List<AttendanceRecord> attendanceRecords = sessionIds.isEmpty()
                ? List.of()
                : attendanceRecordRepository.findBySessionIDInAndIsDeletedFalse(new ArrayList<>(sessionIds));
        Set<String> presentIdentities = new HashSet<>();
        Set<String> absentIdentities = new HashSet<>();
        for (AttendanceRecord record : attendanceRecords) {
            String identity = attendanceIdentity(record);
            if (AttendanceStatus.PRESENT.equals(record.getAttendanceStatus())) {
                presentIdentities.add(identity);
            } else if (AttendanceStatus.ABSENT.equals(record.getAttendanceStatus())) {
                absentIdentities.add(identity);
            }
        }
        absentIdentities.removeAll(presentIdentities);

        List<EventFeedback> feedbacks = eventFeedbackRepository.findByEventIDAndIsDeletedFalse(eventId);
        double averageRating = feedbacks.stream()
                .map(EventFeedback::getOverallRating)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);

        long presentParticipants = presentIdentities.size();
        BigDecimal attendanceRate = percentage(presentParticipants, confirmedRegistrations);
        BigDecimal feedbackResponseRate = percentage(feedbacks.size(), presentParticipants);

        return EventReportStatisticsResponse.builder()
                .eventId(event.getEventID())
                .eventName(event.getEventName())
                .internalEvent(Boolean.TRUE.equals(event.getIsInternal()))
                .paidEvent(Boolean.TRUE.equals(event.getIsPaidEvent()))
                .maximumParticipants(event.getMaxParticipants() != null
                        ? event.getMaxParticipants() : event.getTotalCapacity())
                .plannedBudget(event.getBudget())
                .totalRegistrations(totalRegistrations)
                .confirmedRegistrations(confirmedRegistrations)
                .cancelledRegistrations(cancelledRegistrations)
                .fptuRegistrations(fptuRegistrations)
                .guestRegistrations(guestRegistrationCount)
                .pendingPaymentCount(pendingPaymentCount)
                .paidTicketCount(paidTicketCount)
                .revenue(revenue)
                .currency(event.getTicketCurrency() == null ? "VND" : event.getTicketCurrency())
                .attendanceSessionCount(sessions.size())
                .attendanceSessionsClosed(sessions.stream()
                        .allMatch(session -> AttendanceSessionStatus.CLOSED.equals(session.getStatus())))
                .presentParticipants(presentParticipants)
                .absentParticipants(absentIdentities.size())
                .walkInParticipants(walkInParticipants)
                .attendanceRate(attendanceRate)
                .feedbackCount(feedbacks.size())
                .averageOverallRating(BigDecimal.valueOf(averageRating).setScale(2, RoundingMode.HALF_UP))
                .feedbackResponseRate(feedbackResponseRate)
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    private boolean isValid(EventRegistration registration) {
        return VALID_REGISTRATION_STATUSES.contains(registration.getRegistrationStatus());
    }

    private boolean isValid(GuestEventRegistration registration) {
        return VALID_REGISTRATION_STATUSES.contains(registration.getRegistrationStatus());
    }

    private boolean isCancelledOrRejected(EventRegistration registration) {
        return RegistrationStatus.CANCELLED.equals(registration.getRegistrationStatus())
                || RegistrationStatus.REJECTED.equals(registration.getRegistrationStatus());
    }

    private boolean isCancelledOrRejected(GuestEventRegistration registration) {
        return RegistrationStatus.CANCELLED.equals(registration.getRegistrationStatus())
                || RegistrationStatus.REJECTED.equals(registration.getRegistrationStatus());
    }

    private String attendanceIdentity(AttendanceRecord record) {
        if (record.getRegistrationID() != null) {
            return "R:" + record.getRegistrationID();
        }
        if (record.getGuestRegistrationID() != null) {
            return "G:" + record.getGuestRegistrationID();
        }
        if (record.getUserID() != null) {
            return "U:" + record.getUserID();
        }
        return "A:" + record.getRecordID();
    }

    private BigDecimal percentage(long numerator, long denominator) {
        if (denominator <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);
    }
}
