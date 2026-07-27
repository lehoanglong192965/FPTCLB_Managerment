package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.*;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.dto.response.EventDetailResponse;
import com.fptu.fcms.dto.response.EventRegistrationPolicyResponse;
import com.fptu.fcms.dto.response.EventSubmissionResponse;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.EventRegistrationPolicy;
import com.fptu.fcms.entity.EventRole;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.*;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.event.EventLifecycleChangedEvent;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.EventRegistrationPolicyService;
import com.fptu.fcms.service.EventService;
import com.fptu.fcms.service.ImageCleanupService;
import com.fptu.fcms.service.SystemConfigService;
import com.fptu.fcms.service.AttendanceSessionService;
import com.fptu.fcms.service.event.EventPermissionService;
import com.fptu.fcms.service.event.EventStateMachineService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import com.fptu.fcms.service.event.RefundPolicyCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.http.HttpStatus;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventServiceImpl implements EventService {

    private static final EventStatus STATUS_DRAFT = EventStatus.DRAFT;
    private static final EventStatus STATUS_PENDING = EventStatus.PENDING;
    private static final EventStatus STATUS_PENDING_APPROVAL = EventStatus.PENDING_APPROVAL;
    private static final EventStatus STATUS_APPROVED = EventStatus.APPROVED;
    private static final EventStatus STATUS_REJECTED = EventStatus.REJECTED;
    private static final EventStatus STATUS_WITHDRAWN = EventStatus.WITHDRAWN;
    private static final EventStatus STATUS_CANCELLED = EventStatus.CANCELLED;
    private static final EventStatus STATUS_REGISTRATION_OPEN = EventStatus.REGISTRATION_OPEN;
    private static final EventStatus STATUS_REGISTRATION_CLOSED = EventStatus.REGISTRATION_CLOSED;
    private static final EventStatus STATUS_ONGOING = EventStatus.ONGOING;
    private static final EventStatus STATUS_COMPLETED = EventStatus.COMPLETED;
    private static final EventStatus STATUS_CLOSED = EventStatus.CLOSED;
    private static final EventStatus STATUS_REPORT_UPLOADED = EventStatus.REPORT_UPLOADED;
    private static final EventStatus STATUS_REPORT_PENDING_APPROVAL = EventStatus.REPORT_PENDING_APPROVAL;
    private static final EventStatus STATUS_REPORT_APPROVED = EventStatus.REPORT_APPROVED;
    private static final EventStatus STATUS_REPORT_REJECTED = EventStatus.REPORT_REJECTED;
    private static final EventStatus STATUS_CONTRIBUTION_DRAFT = EventStatus.CONTRIBUTION_DRAFT;
    private static final EventStatus STATUS_CONTRIBUTION_PENDING_APPROVAL = EventStatus.CONTRIBUTION_PENDING_APPROVAL;
    private static final EventStatus STATUS_CONTRIBUTION_APPROVED = EventStatus.CONTRIBUTION_APPROVED;
    private static final EventStatus STATUS_CONTRIBUTION_SCORING = EventStatus.CONTRIBUTION_SCORING;
    private static final EventStatus STATUS_CONTRIBUTION_FINALIZED = EventStatus.CONTRIBUTION_FINALIZED;
    private static final List<EventStatus> ICPDP_APPROVED_LIFECYCLE_STATUSES = List.copyOf(
            java.util.EnumSet.complementOf(java.util.EnumSet.of(
                    EventStatus.DRAFT,
                    EventStatus.PENDING,
                    EventStatus.PENDING_APPROVAL,
                    EventStatus.REJECTED,
                    EventStatus.WITHDRAWN,
                    EventStatus.CANCELLED
            ))
    );
    private static final List<EventStatus> ICPDP_ALL_LIFECYCLE_STATUSES = List.copyOf(
            java.util.EnumSet.complementOf(java.util.EnumSet.of(
                    EventStatus.DRAFT,
                    EventStatus.PENDING,
                    EventStatus.PENDING_APPROVAL,
                    EventStatus.REJECTED
            ))
    );
    private static final List<EventStatus> PUBLIC_EVENT_STATUSES = List.of(
            STATUS_APPROVED, STATUS_REGISTRATION_OPEN, STATUS_REGISTRATION_CLOSED,
            STATUS_ONGOING, STATUS_COMPLETED, STATUS_REPORT_UPLOADED,
            STATUS_REPORT_PENDING_APPROVAL, STATUS_REPORT_APPROVED, STATUS_REPORT_REJECTED,
            STATUS_CONTRIBUTION_DRAFT, STATUS_CONTRIBUTION_PENDING_APPROVAL,
            STATUS_CONTRIBUTION_APPROVED, STATUS_CONTRIBUTION_SCORING,
            STATUS_CONTRIBUTION_FINALIZED, STATUS_CLOSED
    );
    private static final List<EventStatus> SCHEDULE_BLOCKING_STATUSES = List.of(
            STATUS_APPROVED, STATUS_REGISTRATION_OPEN, STATUS_REGISTRATION_CLOSED, STATUS_ONGOING
    );
    private static final List<String> DEFAULT_PARTICIPANT_TYPES = List.of(
            "CORE_TEAM",
            "SUPPORT_ORGANIZER",
            "PARTICIPANT"
    );
    private static final BigDecimal HIGH_BUDGET_THRESHOLD = new BigDecimal("5000000");
    private static final String SUBMISSION_MAX_ATTEMPTS_CONFIG = "EVENT_SUBMISSION_MAX_ATTEMPTS";
    private static final String SUBMISSION_COOLDOWN_HOURS_CONFIG = "EVENT_SUBMISSION_COOLDOWN_HOURS";
    private static final int DEFAULT_MAX_SUBMISSION_ATTEMPTS = 3;
    private static final int DEFAULT_SUBMISSION_COOLDOWN_HOURS = 24;
    private static final String EVENT_SUBMISSION_ACTION = "EVENT_PROPOSAL_SUBMITTED";

    private final EventRepository eventRepository;
    private final SemesterRepository semesterRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final EventRoleRepository eventRoleRepository;
    private final EventRegistrationRepository registrationRepository;
    private final GuestEventRegistrationRepository guestRegistrationRepository;
    private final EventRegistrationPolicyRepository registrationPolicyRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final AuditLogService auditLogService;
    private final EventAssignmentAccessService eventAssignmentAccessService;
    private final EventRegistrationPolicyService eventRegistrationPolicyService;
    private final EventPermissionService eventPermissionService;
    private final EventStateMachineService stateMachineService;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final EventReportRepository eventReportRepository;
    private final ContributionBatchRepository contributionBatchRepository;
    private final ImageCleanupService imageCleanupService;
    private final AttendanceSessionService attendanceSessionService;
    private final SystemConfigService systemConfigService;

    @Override
    public boolean isUserAssigned(Integer eventId, Integer userId) {
        return eventAssignmentRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isHostClubLeaderOrVice(Integer eventId, Integer userId) {
        if (eventId == null || userId == null) {
            return false;
        }
        return eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .filter(event -> event.getClubID() != null && event.getSemesterID() != null)
                .map(event -> clubMembershipRepository.existsActiveMembershipByClubUserSemesterAndRoleNames(
                        event.getClubID(),
                        userId,
                        event.getSemesterID(),
                        java.util.Set.of("Leader", "ViceLeader")
                ))
                .orElse(false);
    }

    @Override
    public List<Event> getEventsByUserAssigned(Integer userId) {
        return eventAssignmentRepository.findByUserIDAndIsDeletedFalse(userId).stream()
                .map(a -> eventRepository.findById(a.getEventID()).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createEventProposal(CreateEventProposalRequest request, UserPrincipal currentUser) {
        validateCreateRequest(request);
        validateUserIsClubLeader(request.getClubID(), currentUser);

        LocalDateTime now = LocalDateTime.now();
        boolean isResubmit = Boolean.TRUE.equals(request.getIsResubmitted());
        long daysUntilEvent = ChronoUnit.DAYS.between(now, request.getStartDate());
        long minDays = isResubmit ? 7 : 14;
        if (daysUntilEvent < minDays) {
            throw new IllegalArgumentException(isResubmit
                    ? "Resubmitted events must be created at least 7 days before start date."
                    : "New events must be created at least 14 days before start date.");
        }

        Event event = new Event();
        event.setClubID(request.getClubID());
        event.setSemesterID(request.getSemesterID());
        event.setEventCode(request.getEventCode());
        event.setEventName(request.getEventName().trim());
        event.setDescription(request.getDescription());
        event.setVenueName(request.getVenueName());
        event.setLocation(request.getLocation());
        event.setLocationDetail(request.getLocationDetail());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setBudget(request.getBudget());
        event.setIsPaidEvent(Boolean.TRUE.equals(request.getIsPaidEvent()));
        event.setTicketPrice(Boolean.TRUE.equals(request.getIsPaidEvent()) ? request.getTicketPrice() : null);
        event.setTicketCurrency(StringUtils.hasText(request.getTicketCurrency()) ? request.getTicketCurrency().trim().toUpperCase() : "VND");
        event.setMaxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : request.getTotalCapacity());
        event.setTotalCapacity(request.getTotalCapacity() != null ? request.getTotalCapacity() : request.getMaxParticipants());
        event.setAllowWalkIn(request.getAllowWalkIn() != null ? request.getAllowWalkIn() : Boolean.FALSE);
        event.setRegistrationOpenAt(request.getRegistrationOpenAt());
        event.setRegistrationCloseAt(request.getRegistrationCloseAt());
        event.setCheckInOpenAt(request.getCheckInOpenAt());
        event.setCheckInCloseAt(request.getCheckInCloseAt());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setEventStatus(STATUS_DRAFT);
        event.setIsResubmitted(isResubmit);
        event.setSubmissionAttemptCount(0);
        event.setIsInternal(Boolean.TRUE.equals(request.getIsInternal()));
        event.setIsScoreLocked(false);
        event.setBannerUrl(request.getBannerUrl());
        event.setBannerPublicId(normalizePublicId(request.getBannerPublicId()));
        event.setCreatedAt(now);
        event.setCreatedBy(currentUser.getUserId());
        event.setIsDeleted(false);

        Event savedEvent = eventRepository.save(event);
        if (request.getRegistrationPolicies() == null || request.getRegistrationPolicies().isEmpty()) {
            registrationPolicyRepository.saveAll(eventRegistrationPolicyService.buildDefaultPolicies(savedEvent.getEventID(), now));
        } else {
            eventRegistrationPolicyService.syncPolicies(savedEvent.getEventID(), request.getRegistrationPolicies(), now);
        }

        if (request.getAssignments() != null && !request.getAssignments().isEmpty()) {
            List<EventAssignment> assignments = request.getAssignments().stream().map(dto -> {
                EventAssignment assignment = new EventAssignment();
                assignment.setEventID(savedEvent.getEventID());
                assignment.setUserID(dto.getUserID());
                assignment.setEventRoleID(resolveEventRoleId(dto.getEventRoleID()));
                assignment.setAssignedAt(now);
                assignment.setIsDeleted(false);
                return assignment;
            }).collect(Collectors.toList());
            eventAssignmentRepository.saveAll(assignments);
        }
    }

    @Override
    @Transactional
    public EventSubmissionResponse submitEventProposal(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new BusinessRuleException(
                        "EVENT_NOT_FOUND",
                        "Không tìm thấy sự kiện.",
                        HttpStatus.NOT_FOUND));
        assertCanModifyDraft(event, currentUser);

        EventStatus oldStatus = event.getEventStatus();
        if (!STATUS_DRAFT.equals(oldStatus) && !STATUS_REJECTED.equals(oldStatus)) {
            throw new BusinessRuleException(
                    "EVENT_STATE_INVALID",
                    "Chỉ có thể gửi sự kiện ở trạng thái bản nháp hoặc bị từ chối.",
                    HttpStatus.CONFLICT);
        }

        LocalDateTime now = LocalDateTime.now();
        int maxAttempts = submissionMaxAttempts();
        int cooldownHours = submissionCooldownHours();
        SubmissionQuota quota = submissionQuota(currentUser.getUserId(), now, maxAttempts, cooldownHours);
        validateSubmissionQuota(quota);
        validateEventBeforeSubmission(event);
        eventRegistrationPolicyService.validateBeforeSubmit(eventId);

        int attemptCount = quota.usedAttempts() + 1;
        event.setSubmissionAttemptCount(attemptCount);
        event.setLastSubmittedAt(now);
        event.setSubmissionBlockedUntil(attemptCount >= maxAttempts ? now.plusHours(cooldownHours) : null);
        event.setIsResubmitted(Boolean.TRUE.equals(event.getIsResubmitted()) || STATUS_REJECTED.equals(oldStatus));
        event.setPdpFeedback(null);
        event.setRejectionReason(null);
        event.setApprovedBy(null);
        event.setApprovedAt(null);
        event.setEventStatus(STATUS_PENDING_APPROVAL);
        Event saved = eventRepository.save(event);

        auditLogService.record(
                currentUser.getUserId(),
                "Event",
                saved.getEventID(),
                EVENT_SUBMISSION_ACTION,
                oldStatus.name(),
                "PENDING_APPROVAL; attempt=" + attemptCount,
                null);

        return new EventSubmissionResponse(
                saved.getEventID(),
                saved.getEventStatus(),
                attemptCount,
                Math.max(0, maxAttempts - attemptCount),
                maxAttempts,
                cooldownHours,
                saved.getLastSubmittedAt(),
                saved.getSubmissionBlockedUntil(),
                attemptCount >= maxAttempts
                        ? "Đã gửi đề xuất lần thứ " + maxAttempts
                        + ". Lượt gửi tiếp theo sẽ mở lại sau " + cooldownHours + " giờ."
                        : "Đã gửi đề xuất sự kiện thành công."
        );
    }

    @Override
    @Transactional
    public void withdrawEvent(Integer eventId, WithdrawEventRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new BusinessRuleException(
                        "EVENT_NOT_FOUND", "Khong tim thay su kien.", HttpStatus.NOT_FOUND));

        EventStatus oldStatus = event.getEventStatus();
        if (!STATUS_PENDING_APPROVAL.equals(oldStatus) && !STATUS_PENDING.equals(oldStatus)) {
            throw new BusinessRuleException(
                    "EVENT_STATE_INVALID",
                    "Chi co the rut yeu cau khi su kien dang cho ICPDP duyet. Su kien co the da duoc xu ly; vui long tai lai trang.",
                    HttpStatus.CONFLICT);
        }

        String reason = request.getReason().trim();
        event.setEventStatus(STATUS_WITHDRAWN);
        event.setWithdrawalReason(reason);
        event.setWithdrawnBy(currentUser.getUserId());
        event.setWithdrawnAt(LocalDateTime.now());
        Event saved = eventRepository.save(event);

        auditLogService.record(
                currentUser.getUserId(), "Event", saved.getEventID(), "EVENT_PROPOSAL_WITHDRAWN",
                oldStatus.name(), STATUS_WITHDRAWN.name(), reason);
        publishLifecycleEvent(saved, oldStatus, STATUS_WITHDRAWN, null, reason);
    }

    @Override
    @Transactional
    public void addAssignment(Integer eventId, EventAssignmentRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        EventAssignment assignment = new EventAssignment();
        assignment.setEventID(eventId);
        assignment.setUserID(request.getUserID());
        assignment.setEventRoleID(resolveEventRoleId(request.getEventRoleID()));
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setIsDeleted(false);
        eventAssignmentRepository.save(assignment);
        if (!STATUS_DRAFT.equals(event.getEventStatus())
                && !STATUS_PENDING.equals(event.getEventStatus())
                && !STATUS_PENDING_APPROVAL.equals(event.getEventStatus())
                && !STATUS_REJECTED.equals(event.getEventStatus())
                && !STATUS_CANCELLED.equals(event.getEventStatus())) {
            issueOrganizerTicket(event, request.getUserID(), organizerParticipantType(assignment));
        }
    }

    @Override
    @Transactional
    public void removeAssignment(Integer eventId, Integer userId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        eventAssignmentRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .filter(a -> a.getUserID().equals(userId))
                .forEach(a -> {
                    a.setIsDeleted(true);
                    eventAssignmentRepository.save(a);
                });
        if (!isHostClubLeaderOrVice(eventId, userId)) {
            registrationRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                    .filter(registration -> Boolean.TRUE.equals(registration.getCapacityExempt()))
                    .ifPresent(registration -> revokeOrganizerTicket(event, registration, currentUser));
        }
    }

    @Override
    @Transactional
    public void assignCheckInStaff(Integer eventId, Integer userId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        Integer checkInStaffRoleId = resolveEventRoleIdByName("CHECK_IN_STAFF");

        EventAssignment assignment = eventAssignmentRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .orElseGet(EventAssignment::new);
        assignment.setEventID(event.getEventID());
        assignment.setUserID(userId);
        assignment.setEventRoleID(checkInStaffRoleId);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setIsDeleted(false);
        eventAssignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public void revokeCheckInStaff(Integer eventId, Integer userId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Integer checkInStaffRoleId = resolveEventRoleIdByName("CHECK_IN_STAFF");
        eventAssignmentRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .filter(a -> checkInStaffRoleId.equals(a.getEventRoleID()))
                .ifPresent(a -> {
                    a.setIsDeleted(true);
                    eventAssignmentRepository.save(a);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventAssignment> getAssignments(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        return eventAssignmentRepository.findByEventIDAndIsDeletedFalse(eventId);
    }

    @Override
    @Transactional
    public void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        if (!Objects.equals(event.getClubID(), clubID)) {
            throw new BusinessRuleException("Event not found or not owned by club.", HttpStatus.NOT_FOUND);
        }
        EventStatus oldStatus = event.getEventStatus();

        boolean cancellable = STATUS_APPROVED.equals(oldStatus)
                || STATUS_REGISTRATION_OPEN.equals(oldStatus)
                || STATUS_REGISTRATION_CLOSED.equals(oldStatus);
        if (!cancellable) {
            throw new IllegalArgumentException("Chỉ có thể hủy sự kiện trước khi bắt đầu diễn ra.");
        }

        event.setEventStatus(STATUS_CANCELLED);
        Event savedEvent = eventRepository.save(event);
        publishLifecycleEvent(savedEvent, oldStatus, STATUS_CANCELLED, null, request.getReason());

        List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        LocalDateTime cancelledAt = LocalDateTime.now();
        registrations.forEach(registration -> {
                    if (!RegistrationStatus.CANCELLED.equals(registration.getRegistrationStatus())) {
                        registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
                        registration.setStatus(RegistrationStatus.CANCELLED.name());
                        registration.setCancelledAt(cancelledAt);
                        registration.setCancellationReason(request.getReason());
                        registration.setCancellationSource("ORGANIZER");
                    }
                    if (StringUtils.hasText(registration.getTicketCode())
                            && registration.getTicketRevokedAt() == null) {
                        registration.setTicketRevokedAt(cancelledAt);
                    }
                    if (PaymentStatus.PAID.equals(registration.getPaymentStatus())
                            || PaymentStatus.AWAITING_VERIFICATION.equals(registration.getPaymentStatus())) {
                        BigDecimal refundBase = registration.getAmountPaid() != null
                                ? registration.getAmountPaid() : registration.getAmountDue();
                        RefundPolicyCalculator.RefundQuote quote = RefundPolicyCalculator.quote(
                                refundBase, event.getStartDate(), cancelledAt, true);
                        registration.setRefundRate(quote.rate());
                        registration.setRefundAmount(quote.amount());
                        registration.setRefundPolicySnapshot(quote.policySnapshot());
                        registration.setRefundCalculationNote(quote.calculationNote());
                    }
                    if (PaymentStatus.PAID.equals(registration.getPaymentStatus())) {
                        registration.setPaymentStatus(PaymentStatus.REFUND_PENDING);
                        registration.setRefundRequestedAt(cancelledAt);
                    } else if (PaymentStatus.PENDING.equals(registration.getPaymentStatus())
                            || PaymentStatus.AWAITING_ELIGIBILITY.equals(registration.getPaymentStatus())) {
                        registration.setPaymentStatus(PaymentStatus.FAILED);
                    }
                    registration.setUpdatedAt(cancelledAt);
                    registration.setUpdatedBy(currentUser == null ? null : currentUser.getUserId());
                });
        if (!registrations.isEmpty()) registrationRepository.saveAll(registrations);

        List<com.fptu.fcms.entity.GuestEventRegistration> guestRegistrations =
                guestRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        guestRegistrations.forEach(registration -> {
                    if (!RegistrationStatus.CANCELLED.equals(registration.getRegistrationStatus())) {
                        registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
                        registration.setStatus(RegistrationStatus.CANCELLED.name());
                        registration.setCancelledAt(cancelledAt);
                        registration.setCancellationReason(request.getReason());
                        registration.setCancellationSource("ORGANIZER");
                        registration.setTicketRevokedAt(cancelledAt);
                    }
                    if (PaymentStatus.PAID.equals(registration.getPaymentStatus())
                            || PaymentStatus.AWAITING_VERIFICATION.equals(registration.getPaymentStatus())) {
                        BigDecimal refundBase = registration.getAmountPaid() != null
                                ? registration.getAmountPaid() : registration.getAmountDue();
                        RefundPolicyCalculator.RefundQuote quote = RefundPolicyCalculator.quote(
                                refundBase, event.getStartDate(), cancelledAt, true);
                        registration.setRefundRate(quote.rate());
                        registration.setRefundAmount(quote.amount());
                        registration.setRefundPolicySnapshot(quote.policySnapshot());
                        registration.setRefundCalculationNote(quote.calculationNote());
                    }
                    if (PaymentStatus.PAID.equals(registration.getPaymentStatus())) {
                        registration.setPaymentStatus(PaymentStatus.REFUND_PENDING);
                        registration.setRefundRequestedAt(cancelledAt);
                    } else if (PaymentStatus.PENDING.equals(registration.getPaymentStatus())
                            || PaymentStatus.AWAITING_ELIGIBILITY.equals(registration.getPaymentStatus())) {
                        registration.setPaymentStatus(PaymentStatus.FAILED);
                    }
                    registration.setUpdatedAt(cancelledAt);
                    registration.setUpdatedBy(currentUser == null ? null : currentUser.getUserId());
                });
        if (!guestRegistrations.isEmpty()) guestRegistrationRepository.saveAll(guestRegistrations);
        if (!registrations.isEmpty()) {
            List<Integer> userIds = registrations.stream().map(EventRegistration::getUserID)
                    .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            List<UserAccount> users = userRepository.findAllByUserIDIn(userIds);
            String subject = "Sự kiện đã bị hủy: " + event.getEventName();
            String content = "Sự kiện \"" + event.getEventName() + "\" đã bị hủy.\n"
                    + "Lý do: " + request.getReason() + "\n\n"
                    + "Toàn bộ vé và mã QR đã bị thu hồi. Nếu vé đã thanh toán, hệ thống đã tạo yêu cầu hoàn tiền để ban tổ chức xử lý.";
            for (UserAccount user : users) {
                String recipientEmail = user.getEmail();
                sendAfterCommit(() -> {
                    log.info("Sending event cancellation email: eventId={}, recipient={}", eventId, maskEmail(recipientEmail));
                    emailService.sendSimpleEmail(recipientEmail, subject, content);
                });
            }
            registrations.stream()
                    .filter(registration -> registration.getUserID() == null)
                    .filter(registration -> StringUtils.hasText(registration.getGuestEmail()))
                    .collect(Collectors.toMap(
                            registration -> registration.getGuestEmail().trim().toLowerCase(),
                            EventRegistration::getGuestEmail,
                            (first, ignored) -> first))
                    .values().forEach(recipientEmail -> sendAfterCommit(() -> {
                        log.info("Sending group guest-holder cancellation email: eventId={}, recipient={}",
                                eventId, maskEmail(recipientEmail));
                        emailService.sendSimpleEmail(recipientEmail, subject, content);
                    }));
        }
        for (com.fptu.fcms.entity.GuestEventRegistration guest : guestRegistrations) {
            String recipientEmail = guest.getGuestEmail();
            String guestSubject = "Sự kiện đã bị hủy: " + event.getEventName();
            String guestContent = "Sự kiện \"" + event.getEventName() + "\" đã bị hủy.\nLý do: " + request.getReason()
                    + "\nToàn bộ vé và mã QR đã bị thu hồi. Vé đã thanh toán sẽ được đưa vào danh sách chờ hoàn tiền.";
            sendAfterCommit(() -> {
                log.info("Sending guest event cancellation email: eventId={}, recipient={}", eventId, maskEmail(recipientEmail));
                emailService.sendSimpleEmail(recipientEmail, guestSubject, guestContent);
            });
        }
        log.info(
                "Event cancellation committed: eventId={}, oldStatus={}, memberRegistrations={}, guestRegistrations={}, reason={}",
                eventId, oldStatus, registrations.size(), guestRegistrations.size(), request.getReason()
        );
    }

    private void sendAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "(unknown)";
        int at = email.indexOf('@');
        return email.substring(0, Math.min(2, at)) + "***" + email.substring(at);
    }

    @Override
    @Transactional
    public EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND));

        EventStatus decision = normalizeDecision(request.getDecision());
        EventStatus oldStatus = event.getEventStatus();
        String feedback = request.getPdpFeedback();

        if (STATUS_APPROVED.equals(decision)) {
            stateMachineService.ensureCanApprove(event);
            assertApproverCannotBeCreator(event, currentUser);
            validateHighBudgetFeedback(event, feedback);
            validateEventBeforeSemesterSettlement(event);
            validateScheduleConflict(event);
        } else {
            stateMachineService.ensureCanReject(event);
        }

        LocalDateTime now = LocalDateTime.now();
        event.setEventStatus(decision);
        event.setPdpFeedback(feedback);
        event.setApprovedBy(currentUser.getUserId());
        event.setApprovedAt(now);
        event.setRejectionReason(STATUS_REJECTED.equals(decision) ? feedback : null);
        Event savedEvent = eventRepository.save(event);

        saveApprovalAuditLog(currentUser.getUserId(), savedEvent, oldStatus, decision, feedback, now);
        publishLifecycleEvent(savedEvent, oldStatus, decision, currentUser.getUserId(), feedback);

        String message = STATUS_APPROVED.equals(decision)
                ? "Event has been approved."
                : "Event has been rejected.";

        return new EventApprovalResponse(
                savedEvent.getEventID(),
                savedEvent.getEventName(),
                savedEvent.getEventStatus(),
                savedEvent.getPdpFeedback(),
                message
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getPendingEvents() {
        return eventRepository.findByEventStatusInAndIsDeletedFalse(List.of(STATUS_PENDING, STATUS_PENDING_APPROVAL));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getApprovedEvents() {
        List<Event> events = eventRepository.findByEventStatusInAndIsDeletedFalse(
                List.of(STATUS_APPROVED, STATUS_REGISTRATION_OPEN, STATUS_REGISTRATION_CLOSED, STATUS_ONGOING))
                .stream().filter(event -> !Boolean.TRUE.equals(event.getIsInternal())).collect(Collectors.toList());
        attachCurrentParticipants(events);
        return events;
    }

    /**
     * Dành cho trang danh sách sự kiện công khai (có tab "Đã kết thúc") — giống
     * getApprovedEvents() nhưng gồm cả COMPLETED. Không dùng cho landing page teaser
     * vì trang đó chỉ muốn hiện sự kiện sắp/đang diễn ra.
     */
    @Override
    @Transactional(readOnly = true)
    public List<Event> getPublicEventsIncludingCompleted() {
        List<Event> events = eventRepository.findByEventStatusInAndIsDeletedFalse(
                PUBLIC_EVENT_STATUSES)
                .stream().filter(event -> !Boolean.TRUE.equals(event.getIsInternal())).collect(Collectors.toList());
        attachCurrentParticipants(events);
        return events;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getInternalEventsForMember(UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new BusinessRuleException("AUTHENTICATION_REQUIRED", "Ban can dang nhap.", HttpStatus.UNAUTHORIZED);
        }
        List<Event> events = eventRepository.findByEventStatusInAndIsDeletedFalse(
                        PUBLIC_EVENT_STATUSES)
                .stream()
                .filter(event -> Boolean.TRUE.equals(event.getIsInternal()))
                .filter(event -> clubMembershipRepository.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        event.getClubID(), currentUser.getUserId(), event.getSemesterID()).isPresent())
                .collect(Collectors.toList());
        attachCurrentParticipants(events);
        return events;
    }

    /**
     * Gắn currentParticipants (member + guest theo CONFIRMED_STATUSES — cùng định nghĩa
     * với kiểm tra sức chứa lúc đăng ký) để FE hiển thị "x/y đã đăng ký".
     */
    private void attachCurrentParticipants(List<Event> events) {
        if (events == null || events.isEmpty()) {
            return;
        }
        List<Integer> eventIds = events.stream().map(Event::getEventID).toList();
        Map<Integer, Long> counts = new HashMap<>();
        for (Object[] row : registrationRepository.countGroupedByEventIDs((eventIds), RegistrationLifecycle.CONFIRMED_STATUSES)) {
            counts.merge((Integer) row[0], (Long) row[1], Long::sum);
        }
        for (Object[] row : guestRegistrationRepository.countGroupedByEventIDs((eventIds), RegistrationLifecycle.CONFIRMED_STATUSES)) {
            counts.merge((Integer) row[0], (Long) row[1], Long::sum);
        }
        events.forEach(e -> e.setCurrentParticipants(counts.getOrDefault(e.getEventID(), 0L)));
    }

    /**
     * Dành riêng cho trang ICPDP: mọi sự kiện đã qua phê duyệt, KỂ CẢ đã kết thúc
     * (COMPLETED/CLOSED, các trạng thái báo cáo...). Khác với getApprovedEvents() vốn
     * chỉ trả sự kiện đang sắp/đang diễn ra cho trang chủ public.
     */
    @Override
    @Transactional(readOnly = true)
    public List<Event> getIcpdpApprovedEvents() {
        List<Event> events = eventRepository.findByEventStatusInAndIsDeletedFalse(ICPDP_APPROVED_LIFECYCLE_STATUSES);
        attachCurrentParticipants(events);
        return events;
    }

    /**
     * Dành cho trang "Quản Lý Sự Kiện" tổng quan của ICPDP: toàn bộ vòng đời sự kiện
     * kể cả CANCELLED (khác getIcpdpApprovedEvents() vốn loại CANCELLED ra khỏi lịch sử
     * đã duyệt). Vẫn loại DRAFT/PENDING/PENDING_APPROVAL/REJECTED vì đó là các sự kiện
     * chưa từng được ICPDP phê duyệt.
     */
    @Override
    @Transactional(readOnly = true)
    public List<Event> getIcpdpAllEvents() {
        List<Event> events = eventRepository.findByEventStatusInAndIsDeletedFalse(ICPDP_ALL_LIFECYCLE_STATUSES);
        attachCurrentParticipants(events);
        return events;
    }





    @Override
    @Transactional(readOnly = true)
    public List<Event> getRejectedEvents() {
        return eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_REJECTED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getEventsByClubId(Integer clubId) {
        return eventRepository.findByClubIDAndIsDeletedFalse(clubId);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDetailResponse getPublicEventDetail(Integer eventId, UserPrincipal currentUser) {
        Event event = getActiveEventOrThrow(eventId);
        boolean privilegedViewer = currentUser != null && eventPermissionService.isIcpdp(currentUser);
        if (!PUBLIC_EVENT_STATUSES.contains(event.getEventStatus()) && !privilegedViewer) {
            throw new BusinessRuleException("EVENT_NOT_PUBLIC", "Su kien chua duoc cong khai.", HttpStatus.NOT_FOUND);
        }
        if (Boolean.TRUE.equals(event.getIsInternal())) {
            boolean isMember = currentUser != null
                    && clubMembershipRepository.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                    event.getClubID(), currentUser.getUserId(), event.getSemesterID()).isPresent();
            boolean isIcpdp = currentUser != null && eventPermissionService.isIcpdp(currentUser);
            if (!isMember && !isIcpdp) {
                throw new BusinessRuleException(
                        "INTERNAL_EVENT_ACCESS_DENIED",
                        "Su kien nay chi danh cho thanh vien CLB.",
                        HttpStatus.FORBIDDEN);
            }
        }
        return toEventDetailResponse(event, null, false);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDetailResponse getManagedEventDetail(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        return toEventDetailResponse(event, currentUser, true);
    }

    @Override
    @Transactional
    public void startEvent(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        stateMachineService.ensureCanStart(event);

        event.setEventStatus(STATUS_ONGOING);
        if (event.getCheckInOpenAt() == null) {
            event.setCheckInOpenAt(LocalDateTime.now());
        }
        eventRepository.save(event);

        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId).orElseGet(() -> {
            AttendanceSession newSession = new AttendanceSession();
            newSession.setEventID(eventId);
            newSession.setSessionName(event.getEventName() + " - Attendance");
            newSession.setCheckInTime(LocalDateTime.now());
            newSession.setStatus(AttendanceSessionStatus.OPEN);
            newSession.setOpenedBy(currentUser.getUserId());
            newSession.setIsDeleted(false);
            return attendanceSessionRepository.save(newSession);
        });
        if (session.getCheckInTime() == null) {
            session.setCheckInTime(LocalDateTime.now());
        }
        if (session.getStatus() == null || AttendanceSessionStatus.DRAFT.equals(session.getStatus())) {
            session.setStatus(AttendanceSessionStatus.OPEN);
            session.setOpenedBy(currentUser.getUserId());
        }
        attendanceSessionRepository.save(session);
    }

    @Override
    @Transactional
    public void startEventAutomatically(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND));
        stateMachineService.ensureCanStart(event);
        LocalDateTime now = LocalDateTime.now();
        event.setEventStatus(STATUS_ONGOING);
        if (event.getCheckInOpenAt() == null) event.setCheckInOpenAt(now);
        eventRepository.save(event);

        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId).orElseGet(() -> {
            AttendanceSession created = new AttendanceSession();
            created.setEventID(eventId);
            created.setSessionName(event.getEventName() + " - Attendance");
            created.setIsDeleted(false);
            return created;
        });
        if (session.getCheckInTime() == null) session.setCheckInTime(now);
        if (session.getStatus() == null || AttendanceSessionStatus.DRAFT.equals(session.getStatus())) {
            session.setStatus(AttendanceSessionStatus.OPEN);
        }
        attendanceSessionRepository.save(session);
        publishLifecycleEvent(event, STATUS_REGISTRATION_CLOSED, STATUS_ONGOING, null, "Started automatically");
    }

    @Override
    @Transactional
    public void finishEvent(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        stateMachineService.ensureCanFinish(event);

        attendanceSessionService.finalizeAttendanceForEvent(eventId, currentUser);

        event.setEventStatus(STATUS_COMPLETED);
        if (event.getCheckInCloseAt() == null) {
            event.setCheckInCloseAt(LocalDateTime.now());
        }
        eventRepository.save(event);
    }

    @Override
    @Transactional
    public void finishEventAutomatically(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND));
        stateMachineService.ensureCanFinish(event);
        attendanceSessionService.finalizeAttendanceForEventAutomatically(eventId);
        event.setEventStatus(STATUS_COMPLETED);
        if (event.getCheckInCloseAt() == null) event.setCheckInCloseAt(LocalDateTime.now());
        eventRepository.save(event);
        publishLifecycleEvent(event, STATUS_ONGOING, STATUS_COMPLETED, null, "Completed automatically");
    }

    @Override
    @Transactional
    public void closeEvent(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        stateMachineService.ensureCanClose(event);
        if (eventReportRepository.findByEventIDAndIsDeletedFalse(eventId)
                .filter(report -> EventReportStatus.APPROVED.equals(report.getStatus()))
                .isEmpty()) {
            throw new BusinessRuleException("EVENT_REPORT_NOT_APPROVED");
        }
        if (contributionBatchRepository.findByEventIDAndIsDeletedFalse(eventId)
                .filter(batch -> ContributionBatchStatus.FINALIZED.equals(batch.getStatus()))
                .isEmpty()) {
            throw new BusinessRuleException("CONTRIBUTION_BATCH_NOT_FINALIZED");
        }
        event.setEventStatus(STATUS_CLOSED);
        eventRepository.save(event);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getReportUploadedEvents() {
        return eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_REPORT_UPLOADED);
    }
    @Override
    @Transactional(readOnly = true)
    public List<Event> getReportReviewedEvents() {
        return eventRepository.findByEventStatusInAndIsDeletedFalse(List.of(
                EventStatus.REPORT_APPROVED,
                EventStatus.REPORT_REJECTED,
                EventStatus.CONTRIBUTION_DRAFT,
                EventStatus.CONTRIBUTION_PENDING_APPROVAL,
                EventStatus.CONTRIBUTION_APPROVED,
                EventStatus.CONTRIBUTION_SCORING,
                EventStatus.CONTRIBUTION_FINALIZED,
                STATUS_CLOSED
        ));
    }



    @Override
    @Transactional(readOnly = true)
    public List<EventRegistrationPolicyResponse> getRegistrationPolicies(Integer eventId, UserPrincipal currentUser) {
        return eventRegistrationPolicyService.getPolicies(eventId, currentUser);
    }

    @Override
    @Transactional
    public void openRegistration(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        EventStatus oldStatus = event.getEventStatus();
        stateMachineService.ensureCanOpenRegistration(event);
        validateRegistrationOpenWindow(event);
        event.setEventStatus(STATUS_REGISTRATION_OPEN);
        if (event.getRegistrationOpenAt() == null) {
            event.setRegistrationOpenAt(LocalDateTime.now());
        }
        Event saved = eventRepository.save(event);
        issueOrganizerTickets(saved);
        auditLogService.record(
                currentUser == null ? null : currentUser.getUserId(),
                "Event",
                saved.getEventID(),
                "REGISTRATION_OPENED",
                oldStatus.name(),
                saved.getEventStatus().name(),
                "Opened registration window"
        );
        publishLifecycleEvent(saved, oldStatus, saved.getEventStatus(), null, "Opened registration window");
    }

    @Override
    @Transactional
    public void openRegistrationAutomatically(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND));
        EventStatus oldStatus = event.getEventStatus();
        stateMachineService.ensureCanOpenRegistration(event);
        validateRegistrationOpenWindow(event);
        event.setEventStatus(STATUS_REGISTRATION_OPEN);
        if (event.getRegistrationOpenAt() == null) event.setRegistrationOpenAt(LocalDateTime.now());
        Event saved = eventRepository.save(event);
        issueOrganizerTickets(saved);
        auditLogService.record(null, "Event", saved.getEventID(), "REGISTRATION_OPENED",
                oldStatus.name(), saved.getEventStatus().name(), "Opened registration window automatically");
        publishLifecycleEvent(saved, oldStatus, saved.getEventStatus(), null, "Opened registration window automatically");
    }

    private void issueOrganizerTickets(Event event) {
        if (event.getClubID() == null || event.getSemesterID() == null) return;
        List<com.fptu.fcms.entity.ClubMembership> boardMemberships = clubMembershipRepository
                .findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
                        event.getClubID(), event.getSemesterID(), List.of(1, 2));
        for (com.fptu.fcms.entity.ClubMembership membership : boardMemberships) {
            issueOrganizerTicket(event, membership.getUserID(), ParticipantType.CORE_TEAM);
        }
        for (EventAssignment assignment : eventAssignmentRepository.findByEventIDAndIsDeletedFalse(event.getEventID())) {
            issueOrganizerTicket(event, assignment.getUserID(), organizerParticipantType(assignment));
        }
    }

    private ParticipantType organizerParticipantType(EventAssignment assignment) {
        return assignment != null && Objects.equals(assignment.getEventRoleID(), 1)
                ? ParticipantType.CORE_TEAM
                : ParticipantType.SUPPORT_ORGANIZER;
    }

    private void issueOrganizerTicket(Event event, Integer userId, ParticipantType participantType) {
        LocalDateTime now = LocalDateTime.now();
        EventRegistration registration = registrationRepository
                .findByEventIDAndUserIDAndIsDeletedFalse(event.getEventID(), userId)
                .orElseGet(EventRegistration::new);
        boolean newlyExempt = !Boolean.TRUE.equals(registration.getCapacityExempt());
        boolean alreadyPaid = PaymentStatus.PAID.equals(registration.getPaymentStatus());
        registration.setEventID(event.getEventID());
        registration.setUserID(userId);
        registration.setParticipantType(participantType);
        registration.setParticipantTypeSnapshotAt(now);
        registration.setRegistrationChannel(RegistrationChannel.FPTU);
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        registration.setStatus(RegistrationStatus.CONFIRMED.name());
        if (registration.getRegisteredAt() == null) registration.setRegisteredAt(now);
        if (!alreadyPaid) {
            registration.setPaymentStatus(PaymentStatus.NOT_REQUIRED);
            registration.setAmountDue(BigDecimal.ZERO);
            registration.setAmountPaid(BigDecimal.ZERO);
            registration.setPaymentReference(null);
            registration.setPaymentExpiresAt(null);
        }
        registration.setPaymentCurrency(StringUtils.hasText(event.getTicketCurrency()) ? event.getTicketCurrency() : "VND");
        registration.setCapacityExempt(true);
        if (!StringUtils.hasText(registration.getTicketCode())) registration.setTicketCode(java.util.UUID.randomUUID().toString());
        if (registration.getTicketIssuedAt() == null) registration.setTicketIssuedAt(now);
        registration.setTicketRevokedAt(null);
        registration.setCancelledAt(null);
        registration.setCreatedBy(registration.getCreatedBy() == null ? userId : registration.getCreatedBy());
        registration.setUpdatedBy(userId);
        registration.setIsDeleted(false);
        EventRegistration saved = registrationRepository.save(registration);

        if (newlyExempt) {
            userRepository.findByUserIDAndIsDeletedFalse(userId).ifPresent(user -> sendAfterCommit(() -> {
                log.info("Sending organizer ticket email: eventId={}, userId={}, recipient={}",
                        event.getEventID(), userId, maskEmail(user.getEmail()));
                emailService.sendEventTicketConfirmationEmail(
                        user.getEmail(), user.getFullName(), event.getEventName(), event.getStartDate(), event.getEndDate(),
                        event.getLocation(), saved.getTicketCode(), BigDecimal.ZERO, saved.getPaymentCurrency());
            }));
        }
    }

    private void revokeOrganizerTicket(Event event, EventRegistration registration, UserPrincipal currentUser) {
        LocalDateTime now = LocalDateTime.now();
        if (PaymentStatus.PAID.equals(registration.getPaymentStatus())) {
            // A participant who paid before joining the organizing team keeps the original paid ticket.
            registration.setCapacityExempt(false);
            registration.setParticipantType(ParticipantType.PARTICIPANT);
            registration.setUpdatedBy(currentUser == null ? null : currentUser.getUserId());
            registrationRepository.save(registration);
            return;
        }
        String revokedCode = registration.getTicketCode();
        registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
        registration.setStatus(RegistrationStatus.CANCELLED.name());
        registration.setTicketRevokedAt(now);
        registration.setCancelledAt(now);
        registration.setUpdatedBy(currentUser == null ? null : currentUser.getUserId());
        registrationRepository.save(registration);
        userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).ifPresent(user -> sendAfterCommit(() -> {
            log.info("Sending organizer ticket revocation email: eventId={}, userId={}, recipient={}",
                    event.getEventID(), registration.getUserID(), maskEmail(user.getEmail()));
            emailService.sendEventTicketCancellationEmail(
                    user.getEmail(), user.getFullName(), event.getEventName(), event.getStartDate(), revokedCode);
        }));
    }

    @Override
    @Transactional
    public void updateEvent(Integer eventId, UpdateEventRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        EventStatus status = event.getEventStatus();
        boolean isProposalEditable = STATUS_DRAFT.equals(status) || STATUS_REJECTED.equals(status);
        // Sau khi ICPDP đã duyệt (Approved/RegistrationOpen/RegistrationClosed) nhưng
        // sự kiện chưa diễn ra: vẫn cho sửa, nhưng chỉ được đổi số người tham gia tối đa.
        boolean isPostApprovalEditable = STATUS_APPROVED.equals(status)
                || STATUS_REGISTRATION_OPEN.equals(status)
                || STATUS_REGISTRATION_CLOSED.equals(status);
        if (!isProposalEditable && !isPostApprovalEditable) {
            throw new IllegalArgumentException("Chỉ có thể chỉnh sửa sự kiện trước khi diễn ra.");
        }
        if (!isProposalEditable) {
            boolean editsOtherFields = request.getEventName() != null
                    || request.getDescription() != null
                    || request.getVenueName() != null
                    || request.getLocation() != null
                    || request.getLocationDetail() != null
                    || request.getLatitude() != null
                    || request.getLongitude() != null
                    || request.getStartDate() != null
                    || request.getEndDate() != null
                    || request.getAllowWalkIn() != null
                    || request.getRegistrationOpenAt() != null
                    || request.getRegistrationCloseAt() != null
                    || request.getCheckInOpenAt() != null
                    || request.getCheckInCloseAt() != null
                    || request.getBudget() != null
                    || request.getIsPaidEvent() != null
                    || request.getTicketPrice() != null
                    || request.getTicketCurrency() != null
                    || request.getIsInternal() != null
                    || request.getBannerUrl() != null
                    || (request.getRegistrationPolicies() != null && !request.getRegistrationPolicies().isEmpty());
            if (editsOtherFields) {
                throw new IllegalArgumentException("Sau khi được ICPDP duyệt, chỉ có thể chỉnh sửa số người tham gia tối đa.");
            }
        }
        String oldBannerPublicId = event.getBannerPublicId();
        boolean bannerTouched = request.getBannerUrl() != null;
        validateDescriptionLength(request.getDescription());
        if (request.getStartDate() != null || request.getEndDate() != null) {
            validateEventDuration(
                    request.getStartDate() != null ? request.getStartDate() : event.getStartDate(),
                    request.getEndDate() != null ? request.getEndDate() : event.getEndDate());
        }
        if (request.getEventName() != null)     event.setEventName(request.getEventName());
        if (request.getDescription() != null)   event.setDescription(request.getDescription());
        if (request.getVenueName() != null)     event.setVenueName(request.getVenueName());
        if (request.getLocation() != null)      event.setLocation(request.getLocation());
        if (request.getLocationDetail() != null) event.setLocationDetail(request.getLocationDetail());
        if (request.getLatitude() != null)      event.setLatitude(request.getLatitude());
        if (request.getLongitude() != null)     event.setLongitude(request.getLongitude());
        if (request.getStartDate() != null)     event.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)       event.setEndDate(request.getEndDate());
        if (request.getMaxParticipants() != null) {
            event.setMaxParticipants(request.getMaxParticipants());
            event.setTotalCapacity(request.getMaxParticipants());
        }
        if (request.getTotalCapacity() != null) {
            event.setTotalCapacity(request.getTotalCapacity());
            event.setMaxParticipants(request.getTotalCapacity());
        }
        if (request.getAllowWalkIn() != null)   event.setAllowWalkIn(request.getAllowWalkIn());
        if (request.getRegistrationOpenAt() != null) event.setRegistrationOpenAt(request.getRegistrationOpenAt());
        if (request.getRegistrationCloseAt() != null) event.setRegistrationCloseAt(request.getRegistrationCloseAt());
        if (request.getCheckInOpenAt() != null) event.setCheckInOpenAt(request.getCheckInOpenAt());
        if (request.getCheckInCloseAt() != null) event.setCheckInCloseAt(request.getCheckInCloseAt());
        if (request.getBudget() != null)        event.setBudget(request.getBudget());
        if (request.getIsPaidEvent() != null)   event.setIsPaidEvent(request.getIsPaidEvent());
        if (request.getTicketPrice() != null || Boolean.FALSE.equals(request.getIsPaidEvent())) event.setTicketPrice(request.getTicketPrice());
        if (StringUtils.hasText(request.getTicketCurrency())) event.setTicketCurrency(request.getTicketCurrency().trim().toUpperCase());
        if (isProposalEditable && request.getIsInternal() != null) event.setIsInternal(request.getIsInternal());
        if (request.getBannerUrl() != null) {
            event.setBannerUrl(request.getBannerUrl().isBlank() ? null : request.getBannerUrl());
            event.setBannerPublicId(normalizePublicId(request.getBannerPublicId()));
        }
        if (isProposalEditable) {
            validateEditableEventConfiguration(event);
        }
        validateCapacityNotBelowConfirmed(event);
        Event saved = eventRepository.saveAndFlush(event);
        if (bannerTouched && !Objects.equals(oldBannerPublicId, saved.getBannerPublicId())) {
            imageCleanupService.deleteAfterCommit(oldBannerPublicId);
        }
        if (request.getRegistrationPolicies() != null && !request.getRegistrationPolicies().isEmpty()) {
            eventRegistrationPolicyService.syncPolicies(eventId, request.getRegistrationPolicies(), LocalDateTime.now());
        }
    }

    @Override
    @Transactional
    public void deleteDraftEvent(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = getActiveEventOrThrow(eventId);
        assertCanModifyDraft(event, currentUser);
        if (!STATUS_DRAFT.equals(event.getEventStatus()) && !STATUS_REJECTED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Only Draft or Rejected events can be deleted.");
        }

        String oldBannerPublicId = event.getBannerPublicId();
        event.setIsDeleted(true);
        eventRepository.saveAndFlush(event);
        imageCleanupService.deleteAfterCommit(oldBannerPublicId);
    }

    @Override
    @Transactional
    public void closeRegistration(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        closeRegistrationInternal(eventId, currentUser.getUserId());
    }

    @Override
    @Transactional
    public void closeRegistrationAutomatically(Integer eventId) {
        closeRegistrationInternal(eventId, null);
    }

    private void closeRegistrationInternal(Integer eventId, Integer actorUserId) {
        Event event = getActiveEventOrThrow(eventId);
        EventStatus oldStatus = event.getEventStatus();
        stateMachineService.ensureCanCloseRegistration(event);
        event.setEventStatus(STATUS_REGISTRATION_CLOSED);
        if (event.getRegistrationCloseAt() == null) {
            event.setRegistrationCloseAt(LocalDateTime.now());
        }
        Event saved = eventRepository.save(event);
        auditLogService.record(
                actorUserId,
                "Event",
                saved.getEventID(),
                "REGISTRATION_CLOSED",
                oldStatus.name(),
                saved.getEventStatus().name(),
                "Closed registration window"
        );
        publishLifecycleEvent(saved, oldStatus, saved.getEventStatus(), null, "Closed registration window");
    }

    private boolean isRegularMemberForRanking(Event event, Integer userId) {
        if (event == null || event.getClubID() == null || event.getSemesterID() == null || userId == null) {
            return false;
        }
        return clubRoleRepository.findByRoleNameAndIsDeletedFalse("Member")
                .map(ClubRole::getClubRoleID)
                .flatMap(memberRoleId -> clubMembershipRepository.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(
                        event.getClubID(),
                        userId,
                        event.getSemesterID()
                ).filter(membership -> Objects.equals(membership.getClubRoleID(), memberRoleId)))
                .isPresent();
    }

    private Event getActiveEventOrThrow(Integer eventId) {
        return eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private void validateCreateRequest(CreateEventProposalRequest request) {
        if (request.getEventName() == null || request.getEventName().trim().length() < 5 || request.getEventName().trim().length() > 150) {
            throw new IllegalArgumentException("eventName must be between 5 and 150 characters.");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("startDate and endDate are required.");
        }
        if (!request.getStartDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("startDate must be in the future.");
        }
        validateEventDuration(request.getStartDate(), request.getEndDate());
        validateDescriptionLength(request.getDescription());
        String plainDescription = request.getDescription() == null
                ? "" : Jsoup.parse(request.getDescription()).text().trim();
        if (plainDescription.length() < 30) {
            throw new IllegalArgumentException("description must contain at least 30 characters.");
        }
        if (request.getBudget() == null || request.getBudget().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("budget must be greater than or equal to 0.");
        }
        Integer capacity = request.getMaxParticipants() != null
                ? request.getMaxParticipants() : request.getTotalCapacity();
        if (capacity == null || capacity <= 0) {
            throw new IllegalArgumentException("maxParticipants must be greater than 0.");
        }
        if (Boolean.TRUE.equals(request.getIsPaidEvent())) {
            if (request.getTicketPrice() == null || request.getTicketPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("ticketPrice must be greater than 0 for a paid event.");
            }
            if (!StringUtils.hasText(request.getTicketCurrency())) {
                throw new IllegalArgumentException("ticketCurrency is required for a paid event.");
            }
        } else if (request.getTicketPrice() != null && request.getTicketPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("ticketPrice cannot be negative.");
        }
        validateEventWindows(request.getRegistrationOpenAt(), request.getRegistrationCloseAt(),
                request.getCheckInOpenAt(), request.getCheckInCloseAt(), request.getStartDate(), request.getEndDate());
    }

    private void validateEditableEventConfiguration(Event event) {
        String name = event.getEventName() == null ? "" : event.getEventName().trim();
        if (name.length() < 5 || name.length() > 150) {
            throw new IllegalArgumentException("eventName must be between 5 and 150 characters.");
        }
        validateDescriptionLength(event.getDescription());
        String plainDescription = event.getDescription() == null
                ? "" : Jsoup.parse(event.getDescription()).text().trim();
        if (plainDescription.length() < 30) {
            throw new IllegalArgumentException("description must contain at least 30 characters.");
        }
        if (event.getBudget() == null || event.getBudget().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("budget must be greater than or equal to 0.");
        }
        if (event.getMaxParticipants() == null || event.getMaxParticipants() <= 0) {
            throw new IllegalArgumentException("maxParticipants must be greater than 0.");
        }
        if (Boolean.TRUE.equals(event.getIsPaidEvent())) {
            if (event.getTicketPrice() == null || event.getTicketPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("ticketPrice must be greater than 0 for a paid event.");
            }
            if (!StringUtils.hasText(event.getTicketCurrency())) {
                throw new IllegalArgumentException("ticketCurrency is required for a paid event.");
            }
        }
        validateEventDuration(event.getStartDate(), event.getEndDate());
        validateEventWindows(event.getRegistrationOpenAt(), event.getRegistrationCloseAt(),
                event.getCheckInOpenAt(), event.getCheckInCloseAt(), event.getStartDate(), event.getEndDate());
    }

    private void validateEventWindows(LocalDateTime registrationOpenAt, LocalDateTime registrationCloseAt,
                                      LocalDateTime checkInOpenAt, LocalDateTime checkInCloseAt,
                                      LocalDateTime startDate, LocalDateTime endDate) {
        if (registrationOpenAt != null && registrationCloseAt != null
                && !registrationOpenAt.isBefore(registrationCloseAt)) {
            throw new IllegalArgumentException("registrationOpenAt must be before registrationCloseAt.");
        }
        if (registrationOpenAt != null && startDate != null && !registrationOpenAt.isBefore(startDate)) {
            throw new IllegalArgumentException("registrationOpenAt must be before startDate.");
        }
        if (registrationCloseAt != null && startDate != null && registrationCloseAt.isAfter(startDate)) {
            throw new IllegalArgumentException("registrationCloseAt must be on or before startDate.");
        }
        if (checkInOpenAt != null && checkInCloseAt != null && !checkInOpenAt.isBefore(checkInCloseAt)) {
            throw new IllegalArgumentException("checkInOpenAt must be before checkInCloseAt.");
        }
        if (checkInOpenAt != null && endDate != null && checkInOpenAt.isAfter(endDate)) {
            throw new IllegalArgumentException("checkInOpenAt must be on or before endDate.");
        }
        if (checkInCloseAt != null && endDate != null && checkInCloseAt.isAfter(endDate)) {
            throw new IllegalArgumentException("checkInCloseAt must be on or before endDate.");
        }
    }

    private void validateCapacityNotBelowConfirmed(Event event) {
        if (event.getMaxParticipants() == null || event.getMaxParticipants() <= 0) {
            throw new IllegalArgumentException("maxParticipants must be greater than 0.");
        }
        long confirmed = registrationRepository
                .countByEventIDAndRegistrationStatusInAndCapacityExemptFalseAndIsDeletedFalse(
                        event.getEventID(), RegistrationLifecycle.CONFIRMED_STATUSES)
                + guestRegistrationRepository.countByEventIDAndRegistrationStatusInAndIsDeletedFalse(
                        event.getEventID(), RegistrationLifecycle.CONFIRMED_STATUSES);
        if (event.getMaxParticipants() < confirmed) {
            throw new IllegalArgumentException(
                    "maxParticipants cannot be lower than the current confirmed participant count (" + confirmed + ").");
        }
    }

    private void validateEventDuration(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null
                && ChronoUnit.MINUTES.between(startDate, endDate) < 30) {
            throw new IllegalArgumentException("Giờ kết thúc phải cách giờ bắt đầu ít nhất 30 phút.");
        }
    }

    private void validateDescriptionLength(String description) {
        if (description == null || description.isBlank()) {
            return;
        }
        int characterCount = Jsoup.parse(description).text().length();
        if (characterCount > 1000) {
            throw new IllegalArgumentException("Mô tả sự kiện không được vượt quá 1.000 ký tự.");
        }
    }

    private void validateUserIsClubLeader(Integer clubId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new BusinessRuleException("User must be authenticated.", HttpStatus.UNAUTHORIZED);
        }

        Integer userId = currentUser.getUserId();

        Semester activeSemester = semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new BusinessRuleException("No active semester found.", HttpStatus.BAD_REQUEST));

        boolean isAuthorized = false;

        java.util.Optional<ClubRole> leaderRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse("Leader");
        if (leaderRole.isPresent()) {
            isAuthorized = clubMembershipRepository.existsActiveLeaderInClub(
                    clubId, userId, activeSemester.getSemesterID(), leaderRole.get().getClubRoleID());
        }

        if (!isAuthorized) {
            java.util.Optional<ClubRole> viceRole = clubRoleRepository.findByRoleNameAndIsDeletedFalse("ViceLeader");
            if (viceRole.isPresent()) {
                isAuthorized = clubMembershipRepository.existsActiveLeaderInClub(
                        clubId, userId, activeSemester.getSemesterID(), viceRole.get().getClubRoleID());
            }
        }

        if (!isAuthorized) {
            throw new BusinessRuleException("You do not have permission to create an event for this club.", HttpStatus.FORBIDDEN);
        }
    }

    private void validateEventBeforeSubmission(Event event) {
        if (event.getStartDate() == null || event.getEndDate() == null) {
            throw new IllegalArgumentException("Event dates are required before submit.");
        }
        validateEventDuration(event.getStartDate(), event.getEndDate());
        if (!event.getStartDate().isAfter(LocalDateTime.now().plusDays(7))) {
            throw new IllegalArgumentException("startDate must be at least 7 days from now before submit.");
        }
        if (event.getTotalCapacity() != null && event.getTotalCapacity() < 0) {
            throw new IllegalArgumentException("totalCapacity cannot be negative.");
        }
    }

    private void validateSubmissionQuota(SubmissionQuota quota) {
        if (quota.blockedUntil() != null) {
            java.time.format.DateTimeFormatter formatter =
                    java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
            throw new BusinessRuleException(
                    "EVENT_SUBMISSION_COOLDOWN",
                    "Bạn đã gửi đề xuất tối đa " + quota.maxAttempts()
                            + " lần trong " + quota.cooldownHours() + " giờ. Vui lòng thử lại sau "
                            + quota.blockedUntil().format(formatter) + ".",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    private SubmissionQuota submissionQuota(
            Integer actorId,
            LocalDateTime now,
            int maxAttempts,
            int cooldownHours) {
        LocalDateTime windowStart = now.minusHours(cooldownHours);
        int usedAttempts = Math.toIntExact(auditLogRepository
                .countByActorIDAndActionTypeAndExecutedAtGreaterThanEqual(
                        actorId, EVENT_SUBMISSION_ACTION, windowStart));
        LocalDateTime blockedUntil = null;
        if (usedAttempts >= maxAttempts) {
            blockedUntil = auditLogRepository
                    .findFirstByActorIDAndActionTypeAndExecutedAtGreaterThanEqualOrderByExecutedAtAsc(
                            actorId, EVENT_SUBMISSION_ACTION, windowStart)
                    .map(AuditLog::getExecutedAt)
                    .map(firstAttempt -> firstAttempt.plusHours(cooldownHours))
                    .orElse(now.plusHours(cooldownHours));
        }
        return new SubmissionQuota(usedAttempts, maxAttempts, cooldownHours, blockedUntil);
    }

    private record SubmissionQuota(
            int usedAttempts,
            int maxAttempts,
            int cooldownHours,
            LocalDateTime blockedUntil) {
    }

    private int submissionMaxAttempts() {
        return positiveIntegerConfig(SUBMISSION_MAX_ATTEMPTS_CONFIG, DEFAULT_MAX_SUBMISSION_ATTEMPTS);
    }

    private int submissionCooldownHours() {
        return positiveIntegerConfig(SUBMISSION_COOLDOWN_HOURS_CONFIG, DEFAULT_SUBMISSION_COOLDOWN_HOURS);
    }

    private int positiveIntegerConfig(String key, int fallback) {
        try {
            int value = Integer.parseInt(systemConfigService.getConfigValue(key).trim());
            return value > 0 ? value : fallback;
        } catch (RuntimeException exception) {
            log.warn("Invalid or missing system config {}. Using fallback {}.", key, fallback);
            return fallback;
        }
    }

    private void assertCanModifyDraft(Event event, UserPrincipal currentUser) {
        if (event.getCreatedBy() != null && currentUser != null && !event.getCreatedBy().equals(currentUser.getUserId())) {
            throw new BusinessRuleException("Only the creator can modify this draft.", HttpStatus.FORBIDDEN);
        }
    }

    private void assertApproverCannotBeCreator(Event event, UserPrincipal currentUser) {
        if (event.getCreatedBy() != null && currentUser != null && event.getCreatedBy().equals(currentUser.getUserId())) {
            throw new BusinessRuleException("The creator cannot approve their own event.", HttpStatus.FORBIDDEN);
        }
    }

    private Integer resolveEventRoleId(Integer eventRoleId) {
        if (eventRoleId == null) {
            throw new IllegalArgumentException("Event role is required.");
        }
        return eventRoleRepository.findByEventRoleIDAndIsDeletedFalse(eventRoleId)
                .map(EventRole::getEventRoleID)
                .orElseThrow(() -> new IllegalArgumentException("Event role not found or deleted."));
    }

    private Integer resolveEventRoleIdByName(String roleName) {
        if (!StringUtils.hasText(roleName)) {
            throw new IllegalArgumentException("Event role is required.");
        }
        return eventRoleRepository.findByRoleNameAndIsDeletedFalse(roleName)
                .map(EventRole::getEventRoleID)
                .orElseThrow(() -> new IllegalArgumentException("Event role not found or deleted."));
    }

    private EventStatus normalizeDecision(String decision) {
        if (!StringUtils.hasText(decision)) {
            throw new BusinessRuleException("decision must be Approved or Rejected.", HttpStatus.BAD_REQUEST);
        }
        EventStatus normalized = EventStatus.fromValue(decision);
        if (!STATUS_APPROVED.equals(normalized) && !STATUS_REJECTED.equals(normalized)) {
            throw new BusinessRuleException("decision must be Approved or Rejected.", HttpStatus.BAD_REQUEST);
        }
        return normalized;
    }

    private void validateHighBudgetFeedback(Event event, String feedback) {
        BigDecimal budget = event.getBudget() == null ? BigDecimal.ZERO : event.getBudget();
        if (budget.compareTo(HIGH_BUDGET_THRESHOLD) > 0 && !StringUtils.hasText(feedback)) {
            throw new BusinessRuleException("Feedback is required for events above the budget threshold.");
        }
    }

    private void validateScheduleConflict(Event event) {
        eventRepository.findFirstByLocationAndEventIDNotAndEventStatusInAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
                event.getLocation(),
                event.getEventID(),
                SCHEDULE_BLOCKING_STATUSES,
                event.getEndDate(),
                event.getStartDate()
        ).ifPresent(conflict -> {
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
            throw new BusinessRuleException(
                    "Trùng lịch với sự kiện đã duyệt \"" + conflict.getEventName() + "\" tại cùng địa điểm ["
                            + event.getLocation() + "] ("
                            + (conflict.getStartDate() != null ? conflict.getStartDate().format(fmt) : "?")
                            + " → "
                            + (conflict.getEndDate() != null ? conflict.getEndDate().format(fmt) : "?")
                            + "). Vui lòng yêu cầu CLB đổi thời gian hoặc địa điểm trước khi duyệt.",
                    HttpStatus.CONFLICT);
        });
    }

    private void validateRegistrationOpenWindow(Event event) {
        LocalDateTime now = LocalDateTime.now();
        if (event.getRegistrationOpenAt() != null && now.isBefore(event.getRegistrationOpenAt())) {
            throw new BusinessRuleException("Registration cannot open before registrationOpenAt.", HttpStatus.CONFLICT);
        }
        if (event.getRegistrationCloseAt() != null && now.isAfter(event.getRegistrationCloseAt())) {
            throw new BusinessRuleException("Registration cannot open after registrationCloseAt.", HttpStatus.CONFLICT);
        }
    }

    private void validateEventBeforeSemesterSettlement(Event event) {
        Semester semester = semesterRepository.findById(event.getSemesterID())
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy học kỳ của sự kiện.", HttpStatus.NOT_FOUND));

        LocalDate settlementDate = semester.getEndDate().minusDays(1);
        LocalDate eventEndDate = event.getEndDate().toLocalDate();
        if (eventEndDate.isAfter(settlementDate)) {
            java.time.format.DateTimeFormatter dateFmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
            throw new BusinessRuleException(
                    "Sự kiện phải kết thúc trước ngày chốt sổ học kỳ (" + settlementDate.format(dateFmt)
                            + "). Sự kiện này kết thúc ngày " + eventEndDate.format(dateFmt)
                            + " nên chưa thể duyệt. Vui lòng yêu cầu CLB dời sang trước ngày chốt sổ, hoặc gán sự kiện vào học kỳ phù hợp.",
                    HttpStatus.CONFLICT);
        }
    }

    private void saveApprovalAuditLog(
            Integer actorId,
            Event event,
            EventStatus oldStatus,
            EventStatus newStatus,
            String feedback,
            LocalDateTime executedAt
    ) {
        auditLogService.record(
                actorId,
                "Event",
                event.getEventID(),
                STATUS_APPROVED.equals(newStatus) ? "EVENT_APPROVED" : "EVENT_REJECTED",
                oldStatus.name(),
                newStatus.name(),
                StringUtils.hasText(feedback) ? feedback : "Event approval decision"
        );
    }

    private void publishLifecycleEvent(Event event, EventStatus oldStatus, EventStatus newStatus, Integer actorId, String reason) {
        applicationEventPublisher.publishEvent(new EventLifecycleChangedEvent(
                event.getEventID(),
                event.getClubID(),
                event.getCreatedBy(),
                oldStatus,
                newStatus,
                actorId,
                reason
        ));
    }

    private EventDetailResponse toEventDetailResponse(Event event, UserPrincipal currentUser, boolean includePolicies) {
        boolean isManager = includePolicies
                && currentUser != null
                && (eventPermissionService.isIcpdp(currentUser) || eventPermissionService.isLeader(currentUser));
        List<EventRegistrationPolicyResponse> policies = isManager
                ? eventRegistrationPolicyService.getPolicies(event.getEventID(), currentUser)
                : null;

        // maxParticipants/currentParticipants không phải dữ liệu nhạy cảm — cần công khai
        // để FE (kể cả trang public) hiển thị "x/y đã đăng ký".
        attachCurrentParticipants(List.of(event));

        int configuredMaxAttempts = isManager ? submissionMaxAttempts() : 0;
        int configuredCooldownHours = isManager ? submissionCooldownHours() : 0;
        SubmissionQuota managerQuota = isManager
                ? submissionQuota(
                        currentUser.getUserId(),
                        LocalDateTime.now(),
                        configuredMaxAttempts,
                        configuredCooldownHours)
                : null;
        int usedSubmissionAttempts = managerQuota == null ? 0 : managerQuota.usedAttempts();

        return new EventDetailResponse(
                event.getEventID(),
                event.getClubID(),
                event.getSemesterID(),
                event.getEventCode(),
                event.getEventName(),
                event.getDescription(),
                event.getVenueName(),
                event.getLocation(),
                event.getLocationDetail(),
                event.getLatitude(),
                event.getLongitude(),
                event.getStartDate(),
                event.getEndDate(),
                event.getEventStatus(),
                event.getBannerUrl(),
                event.getBannerPublicId(),
                event.getAllowWalkIn(),
                isManager ? event.getRegistrationOpenAt() : null,
                isManager ? event.getRegistrationCloseAt() : null,
                isManager ? event.getCheckInOpenAt() : null,
                isManager ? event.getCheckInCloseAt() : null,
                event.getTotalCapacity(),
                event.getMaxParticipants(),
                event.getCurrentParticipants(),
                isManager ? event.getBudget() : null,
                event.getIsPaidEvent(),
                event.getTicketPrice(),
                event.getTicketCurrency(),
                isManager ? event.getApprovedBy() : null,
                isManager ? event.getApprovedAt() : null,
                isManager ? event.getPdpFeedback() : null,
                isManager ? event.getRejectionReason() : null,
                isManager ? event.getWithdrawalReason() : null,
                isManager ? event.getWithdrawnBy() : null,
                isManager ? event.getWithdrawnAt() : null,
                event.getIsInternal(),
                isManager ? event.getIsScoreLocked() : null,
                isManager ? usedSubmissionAttempts : null,
                isManager ? Math.max(0, configuredMaxAttempts - usedSubmissionAttempts) : null,
                isManager ? configuredMaxAttempts : null,
                isManager ? configuredCooldownHours : null,
                isManager ? event.getLastSubmittedAt() : null,
                isManager ? managerQuota.blockedUntil() : null,
                isManager ? event.getCreatedAt() : null,
                isManager ? event.getCreatedBy() : null,
                policies
        );
    }

    private String normalizePublicId(String publicId) {
        return StringUtils.hasText(publicId) ? publicId.trim() : null;
    }

}
