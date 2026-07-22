package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;
import com.fptu.fcms.dto.request.EventWalkInRegistrationRequest;
import com.fptu.fcms.dto.request.RegistrationRejectRequest;
import com.fptu.fcms.dto.request.ConfirmEventPaymentRequest;
import com.fptu.fcms.dto.request.GroupTicketPurchaseRequest;
import com.fptu.fcms.dto.response.EventRegistrationResultResponse;
import com.fptu.fcms.dto.request.RegistrationCancelRequest;
import com.fptu.fcms.dto.response.RegistrationListItemResponse;
import com.fptu.fcms.dto.response.RegistrationPageResponse;
import com.fptu.fcms.dto.response.MyRegistrationResponse;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.Notification;
import com.fptu.fcms.entity.NotificationRecipient;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.ClubBlacklistRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.DisciplineLogRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRegistrationPolicyRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.NotificationRecipientRepository;
import com.fptu.fcms.repository.NotificationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventRegistrationService;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.event.EventPermissionService;
import com.fptu.fcms.service.event.EventStateMachineService;
import com.fptu.fcms.service.event.RegistrationAllocationResult;
import com.fptu.fcms.service.event.RegistrationAllocationService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventRegistrationServiceImpl implements EventRegistrationService {

    private static final String AUDIT_TABLE = "EventRegistration";
    private static final String ACCOUNT_STATUS_ACTIVE = "Active";
    private static final String DISCIPLINE_STATUS_ACTIVE = "Active";
    private static final String DEFAULT_SORT_BY = "registeredAt";
    private static final java.util.Set<String> HOST_BOARD_ROLES = java.util.Set.of("Leader", "ViceLeader");
    private static final int MAX_REGISTRATION_ATTEMPTS = 2;
    private static final long REREGISTRATION_COOLDOWN_MINUTES = 30;
    private static final long REREGISTRATION_DEADLINE_HOURS = 24;

    private final EventRegistrationRepository registrationRepo;
    private final GuestEventRegistrationRepository guestRegistrationRepository;
    private final EventRepository eventRepository;
    private final ClubMembershipRepository membershipRepo;
    private final ClubBlacklistRepository blacklistRepository;
    private final DisciplineLogRepository disciplineLogRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final EventRegistrationPolicyRepository registrationPolicyRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final RegistrationAllocationService allocationService;
    private final EventPermissionService permissionService;
    private final EventAssignmentAccessService eventAssignmentAccessService;
    private final EventStateMachineService stateMachineService;
    private final AuditLogService auditLogService;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final EmailService emailService;
    private final AttendanceSessionRepository attendanceSessionRepository;

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public EventRegistrationResultResponse registerEvent(Integer eventID, Integer userID) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventID)
                .orElseThrow(() -> new IllegalArgumentException("Su kien khong ton tai."));
        ensureRegistrationWindowOpen(event);

        UserAccount user = loadActiveUser(userID);
        ensureUserAllowedForEvent(event, user);

        ParticipantType participantType = classifyParticipantType(eventID, userID);
        boolean paymentExempt = isOrganizer(event, userID);
        if (!paymentExempt) {
            ensureParticipantTypeEnabled(eventID, participantType);
        }
        ensureNoDuplicateActiveRegistration(eventID, userID, null);
        validateReRegistration(event, userID);
        boolean requiresApproval = isApprovalRequired(eventID, participantType);

        RegistrationAllocationResult allocation = paymentExempt
                ? new RegistrationAllocationResult(RegistrationStatus.CONFIRMED, false)
                : allocationService.allocateInitial(eventID, event.getMaxParticipants(), requiresApproval);

        EventRegistration registration = new EventRegistration();
        registration.setEventID(eventID);
        registration.setUserID(userID);
        registration.setGuestFullName(null);
        registration.setGuestEmail(null);
        registration.setGuestPhone(null);
        registration.setParticipantType(participantType);
        registration.setParticipantTypeSnapshotAt(LocalDateTime.now());
        registration.setRegistrationChannel(RegistrationChannel.FPTU);
        registration.setRegisteredAt(LocalDateTime.now());
        registration.setStatus(String.valueOf(allocation.status()));
        registration.setRegistrationStatus(allocation.status());
        registration.setCreatedAt(registration.getRegisteredAt());
        registration.setCreatedBy(userID);
        registration.setUpdatedAt(registration.getRegisteredAt());
        registration.setUpdatedBy(userID);
        registration.setPurchaserUserID(userID);
        registration.setTicketOrderCode("SINGLE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(Locale.ROOT));
        boolean paidEvent = Boolean.TRUE.equals(event.getIsPaidEvent());
        registration.setCapacityExempt(paymentExempt);
        boolean requiresPayment = paidEvent && !paymentExempt;
        if (requiresPayment) {
            registration.setPaymentStatus(allocation.consumesSeat() ? PaymentStatus.PENDING : PaymentStatus.AWAITING_ELIGIBILITY);
            registration.setAmountDue(event.getTicketPrice());
            registration.setAmountPaid(java.math.BigDecimal.ZERO);
            registration.setPaymentCurrency(event.getTicketCurrency());
            registration.setPaymentReference("EVT-" + eventID + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(Locale.ROOT));
            registration.setPaymentExpiresAt(allocation.consumesSeat() ? LocalDateTime.now().plusMinutes(30) : null);
        } else {
            registration.setPaymentStatus(PaymentStatus.NOT_REQUIRED);
            if (paidEvent) {
                registration.setAmountDue(java.math.BigDecimal.ZERO);
                registration.setAmountPaid(java.math.BigDecimal.ZERO);
                registration.setPaymentCurrency(event.getTicketCurrency());
            }
        }
        if ((allocation.consumesSeat() || paymentExempt) && !requiresPayment) {
            registration.setTicketCode(UUID.randomUUID().toString());
            registration.setTicketIssuedAt(LocalDateTime.now());
        }
        registration.setIsDeleted(false);
        EventRegistration saved = registrationRepo.save(registration);
        return new EventRegistrationResultResponse(
                saved.getRegistrationID(), saved.getRegistrationStatus(), saved.getPaymentStatus(),
                saved.getAmountDue(), saved.getPaymentCurrency(), saved.getPaymentReference(),
                StringUtils.hasText(saved.getTicketCode()),
                requiresPayment
                        ? (allocation.consumesSeat()
                            ? "Registration reserved. Complete payment to receive the ticket."
                            : "Registration recorded. Payment opens after approval or seat allocation.")
                        : (paymentExempt
                            ? "Registration completed. Event organizer ticket is free."
                            : "Registration completed."),
                saved.getTicketOrderCode(),
                1
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public EventRegistrationResultResponse registerGroupTickets(
            Integer eventID,
            Integer purchaserUserID,
            GroupTicketPurchaseRequest request
    ) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventID)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));
        ensureRegistrationWindowOpen(event);
        if (!Boolean.TRUE.equals(event.getIsPaidEvent())) {
            throw new IllegalArgumentException("Sự kiện miễn phí chỉ cho phép một vé trên mỗi tài khoản.");
        }
        UserAccount purchaser = loadActiveUser(purchaserUserID);
        ensureUserAllowedForEvent(event, purchaser);

        List<GroupTicketPurchaseRequest.Participant> requested = request.getParticipants();
        if (requested == null || requested.isEmpty() || requested.size() > 4) {
            throw new IllegalArgumentException("Mỗi tài khoản được đặt từ 1 đến tối đa 4 vé.");
        }

        List<EventRegistration> currentEventRegistrations = registrationRepo.findByEventIDAndIsDeletedFalse(eventID);
        long alreadyPurchased = currentEventRegistrations.stream()
                .filter(registration -> Objects.equals(registration.getPurchaserUserID(), purchaserUserID)
                        || (registration.getPurchaserUserID() == null && Objects.equals(registration.getUserID(), purchaserUserID)))
                .filter(registration -> RegistrationLifecycle.ACTIVE_STATUSES.contains(currentRegistrationStatus(registration)))
                .count();
        if (alreadyPurchased + requested.size() > 4) {
            throw new IllegalArgumentException("Tài khoản chỉ được sở hữu tối đa 4 vé cho một sự kiện bán vé.");
        }

        java.util.Set<String> inputEmails = new java.util.HashSet<>();
        java.util.Set<String> inputPhones = new java.util.HashSet<>();
        java.util.Set<Integer> inputUserIds = new java.util.HashSet<>();
        List<ResolvedTicketHolder> holders = new java.util.ArrayList<>();
        for (GroupTicketPurchaseRequest.Participant participant : requested) {
            String email = normalizeTicketEmail(participant.getEmail());
            String phone = normalizeTicketPhone(participant.getPhone());
            String fullName = participant.getFullName() == null ? "" : participant.getFullName().trim();
            if (fullName.isBlank() || email.isBlank() || phone.length() < 8) {
                throw new IllegalArgumentException("Mỗi người tham gia phải có họ tên, email và số điện thoại hợp lệ.");
            }
            if (!inputEmails.add(email) || !inputPhones.add(phone)) {
                throw new IllegalArgumentException("Email hoặc số điện thoại bị trùng trong danh sách đặt vé.");
            }

            UserAccount attendee = resolveTicketHolderAccount(participant, email);
            if (attendee != null) {
                ensureUserAllowedForEvent(event, attendee);
                if (!inputUserIds.add(attendee.getUserID())) {
                    throw new IllegalArgumentException("Một tài khoản FPTU không thể nhận nhiều vé trong cùng đơn.");
                }
            }
            ensureTicketHolderNotRegistered(eventID, attendee, email, phone, currentEventRegistrations);
            holders.add(new ResolvedTicketHolder(attendee, fullName, email, phone));
        }

        long confirmed = registrationRepo
                .countByEventIDAndRegistrationStatusInAndCapacityExemptFalseAndIsDeletedFalse(
                        eventID, RegistrationLifecycle.CONFIRMED_STATUSES)
                + guestRegistrationRepository.countByEventIDAndRegistrationStatusInAndIsDeletedFalse(
                        eventID, RegistrationLifecycle.CONFIRMED_STATUSES);
        long seatsNeeded = holders.stream()
                .filter(holder -> holder.account() == null || !isOrganizer(event, holder.account().getUserID()))
                .count();
        if (event.getMaxParticipants() == null || confirmed + seatsNeeded > event.getMaxParticipants()) {
            throw new IllegalArgumentException("Không còn đủ chỗ cho số lượng vé đã chọn.");
        }

        LocalDateTime now = LocalDateTime.now();
        String orderCode = "ORD-" + eventID + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(Locale.ROOT);
        String paymentReference = "PAY-" + eventID + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(Locale.ROOT);
        List<EventRegistration> registrations = new java.util.ArrayList<>();
        BigDecimal totalDue = BigDecimal.ZERO;

        for (ResolvedTicketHolder holder : holders) {
            UserAccount attendee = holder.account();
            boolean exempt = attendee != null && isOrganizer(event, attendee.getUserID());
            EventRegistration registration = new EventRegistration();
            registration.setEventID(eventID);
            registration.setUserID(attendee == null ? null : attendee.getUserID());
            registration.setPurchaserUserID(purchaserUserID);
            registration.setTicketOrderCode(orderCode);
            registration.setGuestFullName(holder.fullName());
            registration.setGuestEmail(holder.email());
            registration.setGuestPhone(holder.phone());
            registration.setParticipantType(attendee == null ? ParticipantType.GUEST : classifyParticipantType(eventID, attendee.getUserID()));
            registration.setParticipantTypeSnapshotAt(now);
            registration.setRegistrationChannel(attendee == null ? RegistrationChannel.ONLINE : RegistrationChannel.FPTU);
            registration.setRegisteredAt(now);
            registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
            registration.setStatus(RegistrationStatus.CONFIRMED.name());
            registration.setCapacityExempt(exempt);
            registration.setPaymentCurrency(StringUtils.hasText(event.getTicketCurrency()) ? event.getTicketCurrency() : "VND");
            registration.setPaymentReference(paymentReference);
            registration.setAmountPaid(BigDecimal.ZERO);
            registration.setCreatedAt(now);
            registration.setCreatedBy(purchaserUserID);
            registration.setUpdatedAt(now);
            registration.setUpdatedBy(purchaserUserID);
            registration.setIsDeleted(false);
            if (exempt) {
                registration.setPaymentStatus(PaymentStatus.NOT_REQUIRED);
                registration.setAmountDue(BigDecimal.ZERO);
                registration.setTicketCode(UUID.randomUUID().toString());
                registration.setTicketIssuedAt(now);
            } else {
                registration.setPaymentStatus(PaymentStatus.PENDING);
                registration.setAmountDue(event.getTicketPrice());
                registration.setPaymentExpiresAt(now.plusMinutes(30));
                totalDue = totalDue.add(event.getTicketPrice());
            }
            registrations.add(registration);
        }

        List<EventRegistration> saved = registrationRepo.saveAll(registrations);
        saved.stream().filter(registration -> PaymentStatus.NOT_REQUIRED.equals(registration.getPaymentStatus()))
                .forEach(registration -> sendTicketEmailAfterCommit(registration, event));
        EventRegistration first = saved.get(0);
        return new EventRegistrationResultResponse(
                first.getRegistrationID(), RegistrationStatus.CONFIRMED,
                totalDue.signum() > 0 ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED,
                totalDue, first.getPaymentCurrency(), paymentReference,
                totalDue.signum() == 0,
                totalDue.signum() > 0
                        ? "Đã giữ chỗ cho " + saved.size() + " vé trong 30 phút. Hãy thanh toán một lần cho toàn bộ đơn."
                        : "Đã phát hành " + saved.size() + " vé miễn phí.",
                orderCode,
                saved.size()
        );
    }

    private UserAccount resolveTicketHolderAccount(GroupTicketPurchaseRequest.Participant participant, String email) {
        UserAccount byStudentId = StringUtils.hasText(participant.getStudentId())
                ? userRepository.findByStudentIdAndIsDeletedFalse(participant.getStudentId().trim()).orElse(null)
                : null;
        UserAccount byEmail = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(email).orElse(null);
        if (byStudentId != null && byEmail != null && !Objects.equals(byStudentId.getUserID(), byEmail.getUserID())) {
            throw new IllegalArgumentException("MSSV và email không thuộc cùng một tài khoản FPTU.");
        }
        UserAccount resolved = byStudentId != null ? byStudentId : byEmail;
        boolean fptIdentity = StringUtils.hasText(participant.getStudentId())
                || email.endsWith("@fpt.edu.vn") || email.endsWith("@fe.edu.vn");
        if (fptIdentity && resolved == null) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản FPTU tương ứng với MSSV/email đã nhập.");
        }
        return resolved;
    }

    private void ensureTicketHolderNotRegistered(
            Integer eventID, UserAccount attendee, String email, String phone,
            List<EventRegistration> currentRegistrations
    ) {
        boolean duplicate = currentRegistrations.stream()
                .filter(registration -> RegistrationLifecycle.ACTIVE_STATUSES.contains(currentRegistrationStatus(registration)))
                .anyMatch(registration -> (attendee != null && Objects.equals(registration.getUserID(), attendee.getUserID()))
                        || email.equalsIgnoreCase(normalizeTicketEmail(registration.getGuestEmail()))
                        || phone.equals(normalizeTicketPhone(registration.getGuestPhone())));
        if (!duplicate) {
            duplicate = guestRegistrationRepository.findByEventIDAndIsDeletedFalse(eventID).stream()
                    .filter(registration -> RegistrationLifecycle.ACTIVE_STATUSES.contains(registration.getRegistrationStatus()))
                    .anyMatch(registration -> email.equalsIgnoreCase(normalizeTicketEmail(registration.getGuestEmail()))
                            || phone.equals(normalizeTicketPhone(registration.getGuestPhone())));
        }
        if (duplicate) throw new IllegalArgumentException("Một người trong danh sách đã có vé cho sự kiện này.");
    }

    private String normalizeTicketEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeTicketPhone(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private record ResolvedTicketHolder(UserAccount account, String fullName, String email, String phone) {}

    private boolean isHostClubLeaderOrVice(Event event, Integer userId) {
        return event != null
                && event.getClubID() != null
                && event.getSemesterID() != null
                && userId != null
                && membershipRepo.existsActiveMembershipByClubUserSemesterAndRoleNames(
                        event.getClubID(), userId, event.getSemesterID(), HOST_BOARD_ROLES);
    }

    private boolean isOrganizer(Event event, Integer userId) {
        return isHostClubLeaderOrVice(event, userId)
                || (event != null && userId != null && eventAssignmentRepository
                .findByEventIDAndUserIDAndIsDeletedFalse(event.getEventID(), userId).isPresent());
    }

    @Override
    @Transactional
    public MyRegistrationResponse confirmPayment(Integer registrationId, Integer userId, ConfirmEventPaymentRequest request) {
        EventRegistration registration = registrationRepo
                .findByRegistrationIDAndIsDeletedFalse(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration does not exist."));
        boolean ownsPayment = Objects.equals(registration.getUserID(), userId)
                || Objects.equals(registration.getPurchaserUserID(), userId);
        if (!ownsPayment) throw new IllegalArgumentException("Bạn không có quyền thanh toán đơn vé này.");
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(registration.getEventID())
                .orElseThrow(() -> new IllegalArgumentException("Event does not exist."));
        if (!Boolean.TRUE.equals(event.getIsPaidEvent())) {
            throw new IllegalArgumentException("This event does not require payment.");
        }
        List<EventRegistration> orderRegistrations = StringUtils.hasText(registration.getTicketOrderCode())
                ? registrationRepo.findByTicketOrderCodeAndPurchaserUserIDAndIsDeletedFalse(
                        registration.getTicketOrderCode(), userId).stream()
                        .filter(item -> RegistrationLifecycle.ACTIVE_STATUSES.contains(currentRegistrationStatus(item)))
                        .toList()
                : List.of(registration);
        if (orderRegistrations.isEmpty()) orderRegistrations = List.of(registration);
        if (orderRegistrations.stream().allMatch(item -> PaymentStatus.PAID.equals(item.getPaymentStatus())
                || PaymentStatus.NOT_REQUIRED.equals(item.getPaymentStatus()))) {
            return toMyRegistrationResponse(registration, event);
        }
        if (orderRegistrations.stream().anyMatch(item -> !PaymentStatus.PENDING.equals(item.getPaymentStatus())
                && !PaymentStatus.NOT_REQUIRED.equals(item.getPaymentStatus()))) {
            throw new IllegalArgumentException("Payment is not pending.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (orderRegistrations.stream().anyMatch(item -> PaymentStatus.PENDING.equals(item.getPaymentStatus())
                && item.getPaymentExpiresAt() != null && item.getPaymentExpiresAt().isBefore(now))) {
            orderRegistrations.stream()
                    .filter(item -> PaymentStatus.PENDING.equals(item.getPaymentStatus()))
                    .forEach(item -> item.setPaymentStatus(PaymentStatus.EXPIRED));
            registrationRepo.saveAll(orderRegistrations);
            throw new IllegalArgumentException("Payment reservation has expired.");
        }
        for (EventRegistration item : orderRegistrations) {
            if (!PaymentStatus.PENDING.equals(item.getPaymentStatus())) continue;
            item.setPaymentStatus(PaymentStatus.PAID);
            item.setAmountPaid(item.getAmountDue());
            item.setPaymentMethod(request.getPaymentMethod());
            item.setPaidAt(now);
            if (RegistrationLifecycle.CONFIRMED_STATUSES.contains(item.getRegistrationStatus())) {
                if (!StringUtils.hasText(item.getTicketCode())) item.setTicketCode(UUID.randomUUID().toString());
                if (item.getTicketIssuedAt() == null) item.setTicketIssuedAt(now);
            }
        }
        List<EventRegistration> savedOrder = registrationRepo.saveAll(orderRegistrations);
        savedOrder.forEach(item -> sendTicketEmailAfterCommit(item, event));
        UserAccount purchaser = loadActiveUser(userId);
        String orderCode = registration.getTicketOrderCode();
        BigDecimal orderTotal = savedOrder.stream()
                .map(EventRegistration::getAmountPaid)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        sendAfterCommit(() -> emailService.sendSimpleEmail(
                purchaser.getEmail(),
                "Thanh toán đơn vé thành công - " + event.getEventName(),
                "Đơn vé " + orderCode + " đã thanh toán thành công.\n"
                        + "Số vé: " + savedOrder.size() + "\n"
                        + "Tổng tiền: " + orderTotal.toPlainString() + " "
                        + (StringUtils.hasText(event.getTicketCurrency()) ? event.getTicketCurrency() : "VND")
                        + "\nBạn có thể quản lý từng vé trong mục Vé Của Tôi."));
        EventRegistration saved = savedOrder.stream()
                .filter(item -> Objects.equals(item.getRegistrationID(), registrationId))
                .findFirst().orElse(savedOrder.get(0));
        return toMyRegistrationResponse(saved, event);
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void registerGuestEvent(Integer eventID, EventGuestRegistrationRequest request) {
        throw new UnsupportedOperationException("Guest registration uses GuestRegistrationService and GuestEventRegistration.");
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void registerWalkInEvent(Integer eventID, EventWalkInRegistrationRequest request, UserPrincipal currentUser) {
        throw new UnsupportedOperationException("Walk-in guest registration uses WalkInService and GuestEventRegistration.");
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void unregisterEvent(Integer eventID, Integer userID) {
        EventRegistration registration = registrationRepo
                .findTopByEventIDAndUserIDAndIsDeletedFalseAndRegistrationStatusInOrderByRegisteredAtDesc(
                        eventID,
                        userID,
                        RegistrationLifecycle.ACTIVE_STATUSES
                )
                .orElseThrow(() -> new IllegalArgumentException("Ban chua dang ky su kien nay."));
        cancelRegistrationInternal(registration, userID, null, true, false);
    }

    @Override
    public boolean isUserRegistered(Integer eventId, Integer userId) {
        return registrationRepo.findByEventIDAndIsDeletedFalse(eventId).stream()
                .anyMatch(registration -> (Objects.equals(registration.getUserID(), userId)
                        || Objects.equals(registration.getPurchaserUserID(), userId))
                        && RegistrationLifecycle.ACTIVE_STATUSES.contains(currentRegistrationStatus(registration)));
    }

    @Override
    public List<Event> getEventsByUserRegistered(Integer userId) {
        return registrationsOwnedOrHeldBy(userId).stream()
                .filter(reg -> RegistrationLifecycle.ACTIVE_STATUSES.contains(reg.getRegistrationStatus()))
                .map(EventRegistration::getEventID)
                .distinct()
                .map(eventId -> eventRepository.findById(eventId).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyRegistrationResponse> getMyRegistrationDetails(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Authenticated user is required.");
        }
        return registrationsOwnedOrHeldBy(userId).stream()
                .filter(registration -> RegistrationLifecycle.ACTIVE_STATUSES.contains(currentRegistrationStatus(registration)))
                .map(registration -> eventRepository.findByEventIDAndIsDeletedFalse(registration.getEventID())
                        .map(event -> toMyRegistrationResponse(registration, event))
                        .orElse(null))
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparing(MyRegistrationResponse::getStartDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(MyRegistrationResponse::getRegistrationId))
                .toList();
    }

    private MyRegistrationResponse toMyRegistrationResponse(EventRegistration registration, Event event) {
        RegistrationStatus status = currentRegistrationStatus(registration);
        boolean ticketEligible = RegistrationLifecycle.CONFIRMED_STATUSES.contains(status)
                && StringUtils.hasText(registration.getTicketCode())
                && registration.getTicketRevokedAt() == null;
        return new MyRegistrationResponse(
                registration.getRegistrationID(),
                event.getEventID(),
                event.getClubID(),
                event.getEventName(),
                event.getStartDate(),
                event.getEndDate(),
                event.getLocation(),
                event.getBannerUrl(),
                event.getEventStatus(),
                status,
                registration.getParticipantType(),
                ticketEligible ? registration.getTicketCode() : null,
                ticketEligible ? registration.getTicketIssuedAt() : null,
                ticketEligible,
                registration.getRegisteredAt(),
                registration.getPaymentStatus(),
                registration.getAmountDue(),
                registration.getAmountPaid(),
                registration.getPaymentCurrency(),
                registration.getPaymentReference(),
                registration.getPaymentMethod(),
                registration.getPaidAt(),
                registration.getPaymentExpiresAt(),
                registration.getPurchaserUserID(),
                registration.getTicketOrderCode(),
                ticketHolderName(registration),
                ticketHolderEmail(registration),
                registration.getGuestPhone()
        );
    }

    @Override
    public long countActiveTicketsPurchased(Integer eventId, Integer userId) {
        return registrationRepo.findByEventIDAndIsDeletedFalse(eventId).stream()
                .filter(registration -> Objects.equals(registration.getPurchaserUserID(), userId)
                        || (registration.getPurchaserUserID() == null && Objects.equals(registration.getUserID(), userId)))
                .filter(registration -> RegistrationLifecycle.ACTIVE_STATUSES.contains(currentRegistrationStatus(registration)))
                .count();
    }

    private List<EventRegistration> registrationsOwnedOrHeldBy(Integer userId) {
        Map<Integer, EventRegistration> unique = new java.util.LinkedHashMap<>();
        registrationRepo.findByUserIDAndIsDeletedFalse(userId)
                .forEach(registration -> unique.put(registration.getRegistrationID(), registration));
        registrationRepo.findByPurchaserUserIDAndIsDeletedFalse(userId)
                .forEach(registration -> unique.put(registration.getRegistrationID(), registration));
        return new java.util.ArrayList<>(unique.values());
    }

    private String ticketHolderName(EventRegistration registration) {
        if (StringUtils.hasText(registration.getGuestFullName())) return registration.getGuestFullName();
        if (registration.getUserID() == null) return null;
        return userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID())
                .map(UserAccount::getFullName).orElse(null);
    }

    private String ticketHolderEmail(EventRegistration registration) {
        if (StringUtils.hasText(registration.getGuestEmail())) return registration.getGuestEmail();
        if (registration.getUserID() == null) return null;
        return userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID())
                .map(UserAccount::getEmail).orElse(null);
    }

    private void sendTicketEmailAfterCommit(EventRegistration registration, Event event) {
        String email = ticketHolderEmail(registration);
        String fullName = ticketHolderName(registration);
        if (!StringUtils.hasText(email) || !StringUtils.hasText(registration.getTicketCode())) return;
        sendAfterCommit(() -> emailService.sendEventTicketConfirmationEmail(
                email, fullName, event.getEventName(), event.getStartDate(), event.getEndDate(),
                event.getLocation(), registration.getTicketCode(), registration.getAmountPaid(),
                registration.getPaymentCurrency()));
    }

    @Override
    @Transactional(readOnly = true)
    public RegistrationPageResponse getRegistrations(
            Integer eventId,
            String participantType,
            String status,
            String keyword,
            int page,
            int size,
            String sortBy,
            String sortDir,
            UserPrincipal currentUser
    ) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        List<RegistrationListItemResponse> fptuViews = registrationRepo.findByEventIDAndIsDeletedFalse(eventId).stream()
                .map(reg -> toView(reg, currentUser))
                .toList();
        List<RegistrationListItemResponse> guestViews = guestRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .map(reg -> toGuestView(reg, currentUser))
                .toList();

        List<RegistrationListItemResponse> filtered = java.util.stream.Stream.concat(fptuViews.stream(), guestViews.stream())
                .filter(view -> matchesParticipantType(view, participantType))
                .filter(view -> matchesStatus(view, status))
                .filter(view -> matchesKeyword(view, keyword))
                .sorted(buildComparator(normalizeSortBy(sortBy), normalizeSortDir(sortDir)))
                .toList();

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 200);
        int fromIndex = Math.min(normalizedPage * normalizedSize, filtered.size());
        int toIndex = Math.min(fromIndex + normalizedSize, filtered.size());
        List<RegistrationListItemResponse> content = fromIndex >= toIndex ? List.of() : filtered.subList(fromIndex, toIndex);

        PageRequest pageRequest = PageRequest.of(normalizedPage, normalizedSize, Sort.unsorted());
        return new RegistrationPageResponse(
                content,
                pageRequest.getPageNumber(),
                pageRequest.getPageSize(),
                filtered.size(),
                (int) Math.ceil(filtered.size() / (double) normalizedSize)
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void approveRegistration(Integer eventId, Integer registrationId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = loadEventForUpdate(eventId);
        EventRegistration registration = loadRegistrationForEvent(eventId, registrationId);
        RegistrationStatus currentStatus = currentRegistrationStatus(registration);
        if (!RegistrationLifecycle.STATUS_PENDING_APPROVAL.equals(currentStatus)) {
            throw new BusinessRuleException(ApiErrorCode.EVENT_STATE_INVALID.name(), "Registration must be Pending Approval before approval.", org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY);
        }

        RegistrationAllocationResult allocation = allocationService.allocateOnApproval(eventId, event.getMaxParticipants());
        RegistrationStatus oldStatus = currentStatus;
        registration.setStatus(String.valueOf(allocation.status()));
        registration.setRegistrationStatus(allocation.status());
        registration.setUpdatedAt(LocalDateTime.now());
        registration.setUpdatedBy(currentUser.getUserId());
        if (allocation.consumesSeat() && PaymentStatus.AWAITING_ELIGIBILITY.equals(registration.getPaymentStatus())) {
            registration.setPaymentStatus(PaymentStatus.PENDING);
            registration.setPaymentExpiresAt(LocalDateTime.now().plusMinutes(30));
        }
        if (allocation.consumesSeat() && paymentAllowsTicket(registration)) {
            if (!StringUtils.hasText(registration.getTicketCode())) {
                registration.setTicketCode(UUID.randomUUID().toString());
            }
            if (registration.getTicketIssuedAt() == null) {
                registration.setTicketIssuedAt(LocalDateTime.now());
            }
        }
        registration.setIsDeleted(false);
        registrationRepo.save(registration);
        saveAudit(currentUser.getUserId(), registration, "REGISTRATION_APPROVED", oldStatus == null ? null : oldStatus.name(), allocation.status().name(), "Approved by leader");
        notifyRegistrant(
                registration,
                currentUser.getUserId(),
                "REGISTRATION_APPROVED",
                "Đăng ký sự kiện được duyệt",
                "Đăng ký tham gia sự kiện \"" + event.getEventName() + "\" của bạn đã được duyệt."
        );
    }

    private boolean paymentAllowsTicket(EventRegistration registration) {
        return registration.getPaymentStatus() == null
                || PaymentStatus.NOT_REQUIRED.equals(registration.getPaymentStatus())
                || PaymentStatus.PAID.equals(registration.getPaymentStatus());
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void rejectRegistration(Integer eventId, Integer registrationId, RegistrationRejectRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        if (request == null || !StringUtils.hasText(request.getReason())) {
            throw new IllegalArgumentException("Reason is required.");
        }

        EventRegistration registration = loadRegistrationForEvent(eventId, registrationId);
        RegistrationStatus currentStatus = currentRegistrationStatus(registration);
        if (!RegistrationLifecycle.STATUS_PENDING_APPROVAL.equals(currentStatus)) {
            throw new BusinessRuleException(ApiErrorCode.EVENT_STATE_INVALID.name(), "Registration must be Pending Approval before rejection.", org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY);
        }

        RegistrationStatus oldStatus = currentStatus;
        registration.setStatus(String.valueOf(RegistrationLifecycle.STATUS_REJECTED));
        registration.setRegistrationStatus(RegistrationLifecycle.STATUS_REJECTED);
        registration.setUpdatedAt(LocalDateTime.now());
        registration.setUpdatedBy(currentUser.getUserId());
        registration.setTicketRevokedAt(LocalDateTime.now());
        registration.setIsDeleted(false);
        registrationRepo.save(registration);
        saveAudit(currentUser.getUserId(), registration, "REGISTRATION_REJECTED", oldStatus == null ? null : oldStatus.name(), RegistrationLifecycle.STATUS_REJECTED.name(), request.getReason());

        Event event = eventRepository.findById(eventId).orElse(null);
        notifyRegistrant(
                registration,
                currentUser.getUserId(),
                "REGISTRATION_REJECTED",
                "Đăng ký sự kiện bị từ chối",
                "Đăng ký tham gia sự kiện \"" + (event != null ? event.getEventName() : "sự kiện") + "\" của bạn đã bị từ chối. Lý do: " + request.getReason()
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void cancelRegistration(Integer registrationId, RegistrationCancelRequest request, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new BusinessRuleException(ApiErrorCode.UNAUTHORIZED.name(), "You are not authenticated.", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        EventRegistration registration = registrationRepo.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found."));
        boolean ownsRegistration = Objects.equals(registration.getUserID(), currentUser.getUserId())
                || Objects.equals(registration.getPurchaserUserID(), currentUser.getUserId());
        boolean privilegedActor = false;
        try {
            eventAssignmentAccessService.ensureCanManageEvent(registration.getEventID(), currentUser);
            privilegedActor = true;
        } catch (BusinessRuleException exception) {
            if (!ownsRegistration || !ApiErrorCode.FORBIDDEN.name().equals(exception.getErrorCode())) {
                throw exception;
            }
        }
        cancelRegistrationInternal(registration, currentUser.getUserId(),
                request == null ? null : request.getReason(), false, privilegedActor);
    }

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void cancelTicketOrder(String ticketOrderCode, RegistrationCancelRequest request, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getUserId() == null || !StringUtils.hasText(ticketOrderCode)) {
            throw new BusinessRuleException(ApiErrorCode.UNAUTHORIZED.name(), "You are not authenticated.", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        List<EventRegistration> registrations = registrationRepo
                .findByTicketOrderCodeAndPurchaserUserIDAndIsDeletedFalse(ticketOrderCode, currentUser.getUserId());
        if (registrations.isEmpty()) throw new IllegalArgumentException("Không tìm thấy đơn vé.");
        for (EventRegistration registration : registrations) {
            cancelRegistrationInternal(registration, currentUser.getUserId(),
                    request == null ? null : request.getReason(), false, false);
        }
    }

    /**
     * Leader/ViceLeader huỷ đăng ký của KHÁCH theo id (khách tự huỷ thì dùng
     * guestReference qua GuestRegistrationService). Nếu khách đang giữ chỗ,
     * giải phóng chỗ và đôn waitlist lên như huỷ member.
     */
    @Override
    @Transactional
    public void cancelGuestRegistration(Integer eventId, Integer guestRegistrationId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = loadEventForUpdate(eventId);
        GuestEventRegistration registration = guestRegistrationRepository
                .findByGuestRegistrationIDAndIsDeletedFalse(guestRegistrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found."));
        if (!Objects.equals(registration.getEventID(), eventId)) {
            throw new IllegalArgumentException("Registration does not belong to the event.");
        }

        RegistrationStatus oldStatus = registration.getRegistrationStatus();
        if (RegistrationStatus.CANCELLED.equals(oldStatus)) {
            return;
        }
        registration.setStatus(RegistrationStatus.CANCELLED.name());
        registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(LocalDateTime.now());
        registration.setUpdatedAt(LocalDateTime.now());
        guestRegistrationRepository.save(registration);

        if (oldStatus != null && RegistrationLifecycle.CONFIRMED_STATUSES.contains(oldStatus)) {
            allocationService.promoteWaitlisted(eventId, event.getMaxParticipants());
        }
    }

    private void cancelRegistrationInternal(
            EventRegistration registration,
            Integer actorUserId,
            String reason,
            boolean triggeredByLegacyEndpoint,
            boolean privilegedActor
    ) {
        RegistrationStatus currentStatus = currentRegistrationStatus(registration);
        if (RegistrationLifecycle.STATUS_CANCELLED.equals(currentStatus)) {
            return;
        }

        Event event = loadEventForUpdate(registration.getEventID());
        boolean cancellationWindowClosed = isSelfCancellationWindowClosed(event);
        if (!privilegedActor && cancellationWindowClosed) {
            throw new BusinessRuleException(
                    ApiErrorCode.REGISTRATION_CANCEL_WINDOW_CLOSED.name(),
                    "The event has already started. You cannot cancel your registration.",
                    org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        boolean hasPresentAttendance = attendanceRecordRepository.existsByRegistrationIDAndAttendanceStatusAndIsDeletedFalse(
                registration.getRegistrationID(),
                AttendanceStatus.PRESENT
        );
        if (hasPresentAttendance && !privilegedActor) {
            throw new BusinessRuleException(
                    ApiErrorCode.EVENT_STATE_INVALID.name(),
                    "A checked-in registration cannot be cancelled.",
                    org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        if (!privilegedActor && event.getStartDate() != null
                && !LocalDateTime.now().isBefore(event.getStartDate().minusHours(24))
                && !StringUtils.hasText(reason)) {
            throw new BusinessRuleException("CANCELLATION_REASON_REQUIRED",
                    "Hủy trong vòng 24 giờ trước sự kiện phải nhập lý do.",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        RegistrationStatus oldStatus = currentStatus;
        String revokedTicketCode = registration.getTicketCode();
        registration.setStatus(String.valueOf(RegistrationLifecycle.STATUS_CANCELLED));
        registration.setRegistrationStatus(RegistrationLifecycle.STATUS_CANCELLED);
        registration.setUpdatedAt(LocalDateTime.now());
        registration.setUpdatedBy(actorUserId);
        registration.setTicketRevokedAt(LocalDateTime.now());
        registration.setCancelledAt(LocalDateTime.now());
        registration.setCancellationReason(normalizeReason(reason));
        registration.setCancellationSource(privilegedActor ? "ORGANIZER" : "PARTICIPANT");
        registration.setIsDeleted(false);
        registrationRepo.save(registration);

        boolean freedSeat = RegistrationLifecycle.CONFIRMED_STATUSES.contains(oldStatus);
        int promoted = freedSeat ? allocationService.promoteWaitlisted(event.getEventID(), event.getMaxParticipants()) : 0;
        saveAudit(actorUserId, registration, "REGISTRATION_CANCELLED", oldStatus == null ? null : oldStatus.name(), RegistrationLifecycle.STATUS_CANCELLED.name(),
                normalizeReason(reason) != null
                        ? normalizeReason(reason)
                        : privilegedActor
                        ? (hasPresentAttendance ? "Cancelled by manager after check-in" : cancellationWindowClosed ? "Cancelled by manager after event start" : "Cancelled by manager")
                        : (triggeredByLegacyEndpoint ? "Cancelled from legacy unregister endpoint" : "Cancelled by user"));
        notifyRegistrant(registration, actorUserId, "REGISTRATION_CANCELLED",
                "Đã hủy đăng ký sự kiện",
                "Bạn đã hủy đăng ký tham gia sự kiện \"" + event.getEventName() + "\" thành công.");
        if (promoted > 0) {
            // no-op: promotion is handled atomically by allocation service
        }
        String holderEmail = ticketHolderEmail(registration);
        String holderName = ticketHolderName(registration);
        if (StringUtils.hasText(holderEmail)) {
            sendAfterCommit(() -> emailService.sendEventTicketCancellationEmail(
                    holderEmail, holderName, event.getEventName(), event.getStartDate(), revokedTicketCode));
        }
    }

    private void sendAfterCommit(Runnable emailAction) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            emailAction.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailAction.run();
            }
        });
    }

    private boolean isSelfCancellationWindowClosed(Event event) {
        if (event.getStartDate() != null
                && !LocalDateTime.now().isBefore(event.getStartDate())) {
            return true;
        }
        if (event.getEventStatus() == null) {
            return false;
        }
        String status = event.getEventStatus().name();
        return "ONGOING".equals(status)
                || "COMPLETED".equals(status)
                || "CLOSED".equals(status)
                || status.startsWith("REPORT_")
                || status.startsWith("CONTRIBUTION_");
    }

    @Override
    public Integer getActiveRegistrationId(Integer eventId, Integer userId) {
        return registrationRepo
                .findTopByEventIDAndUserIDAndIsDeletedFalseAndRegistrationStatusInOrderByRegisteredAtDesc(
                        eventId, userId, RegistrationLifecycle.ACTIVE_STATUSES)
                .map(EventRegistration::getRegistrationID)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRegistrationStatus(Integer eventId, Integer userId) {
        Map<String, Object> result = new java.util.HashMap<>();
        Integer activeId = getActiveRegistrationId(eventId, userId);
        long attempts = registrationRepo.countByEventIDAndUserIDAndIsDeletedFalse(eventId, userId);
        result.put("registered", activeId != null);
        result.put("registrationId", activeId);
        result.put("registrationAttempts", attempts);
        result.put("canReregister", activeId == null && attempts < MAX_REGISTRATION_ATTEMPTS);

        registrationRepo.findTopByEventIDAndUserIDAndRegistrationStatusAndIsDeletedFalseOrderByCancelledAtDesc(
                eventId, userId, RegistrationStatus.CANCELLED).ifPresent(cancelled -> {
            LocalDateTime cancelledAt = cancelled.getCancelledAt() != null ? cancelled.getCancelledAt() : cancelled.getUpdatedAt();
            if (cancelledAt != null) {
                result.put("lastCancelledAt", cancelledAt);
                result.put("canReregisterAt", cancelledAt.plusMinutes(REREGISTRATION_COOLDOWN_MINUTES));
            }
        });
        if (attempts >= MAX_REGISTRATION_ATTEMPTS) {
            result.put("reregistrationBlockReason", "REREGISTRATION_LIMIT_REACHED");
        }
        eventRepository.findByEventIDAndIsDeletedFalse(eventId).ifPresent(event -> {
            if (attempts > 0 && event.getStartDate() != null
                    && !LocalDateTime.now().isBefore(event.getStartDate().minusHours(REREGISTRATION_DEADLINE_HOURS))) {
                result.put("canReregister", false);
                result.put("reregistrationBlockReason", "REREGISTRATION_DEADLINE_PASSED");
            }
        });
        Object canAt = result.get("canReregisterAt");
        if (canAt instanceof LocalDateTime time && LocalDateTime.now().isBefore(time)) {
            result.put("canReregister", false);
            result.put("reregistrationBlockReason", "REREGISTRATION_COOLDOWN");
        }
        return result;
    }

    private void validateReRegistration(Event event, Integer userId) {
        long attempts = registrationRepo.countByEventIDAndUserIDAndIsDeletedFalse(event.getEventID(), userId);
        if (attempts == 0) return;
        if (attempts >= MAX_REGISTRATION_ATTEMPTS) {
            throw new BusinessRuleException("REREGISTRATION_LIMIT_REACHED",
                    "Bạn đã sử dụng hết lượt đăng ký lại cho sự kiện này.", org.springframework.http.HttpStatus.CONFLICT);
        }
        if (event.getStartDate() != null
                && !LocalDateTime.now().isBefore(event.getStartDate().minusHours(REREGISTRATION_DEADLINE_HOURS))) {
            throw new BusinessRuleException("REREGISTRATION_DEADLINE_PASSED",
                    "Không thể đăng ký lại trong vòng 24 giờ trước sự kiện.", org.springframework.http.HttpStatus.CONFLICT);
        }
        registrationRepo.findTopByEventIDAndUserIDAndRegistrationStatusAndIsDeletedFalseOrderByCancelledAtDesc(
                event.getEventID(), userId, RegistrationStatus.CANCELLED).ifPresent(cancelled -> {
            LocalDateTime cancelledAt = cancelled.getCancelledAt() != null ? cancelled.getCancelledAt() : cancelled.getUpdatedAt();
            LocalDateTime canRegisterAt = cancelledAt == null ? null : cancelledAt.plusMinutes(REREGISTRATION_COOLDOWN_MINUTES);
            if (canRegisterAt != null && LocalDateTime.now().isBefore(canRegisterAt)) {
                throw new BusinessRuleException("REREGISTRATION_COOLDOWN",
                        "Bạn chỉ có thể đăng ký lại sau " + canRegisterAt + ".", org.springframework.http.HttpStatus.TOO_MANY_REQUESTS);
            }
        });
    }

    private void validateParticipantCancellation(Event event, Integer registrationId, String reason) {
        LocalDateTime now = LocalDateTime.now();
        if (event.getStartDate() == null || !now.isBefore(event.getStartDate())) {
            throw new BusinessRuleException("CANCEL_DEADLINE_PASSED", "Sự kiện đã bắt đầu, không thể hủy đăng ký.", org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY);
        }
        attendanceSessionRepository.findByEventID(event.getEventID()).ifPresent(session -> {
            if (attendanceRecordRepository.existsBySessionIDAndRegistrationIDAndIsDeletedFalse(session.getSessionID(), registrationId)) {
                throw new BusinessRuleException("ALREADY_CHECKED_IN", "Người tham gia đã check-in, không thể hủy đăng ký.", org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY);
            }
        });
        if (!now.isBefore(event.getStartDate().minusHours(24)) && !StringUtils.hasText(reason)) {
            throw new BusinessRuleException("CANCELLATION_REASON_REQUIRED", "Hủy trong vòng 24 giờ trước sự kiện phải nhập lý do.", org.springframework.http.HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeReason(String reason) {
        return StringUtils.hasText(reason) ? reason.trim() : null;
    }

    private Event loadEventForUpdate(Integer eventId) {
        return eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Su kien khong ton tai."));
    }

    private EventRegistration loadRegistrationForEvent(Integer eventId, Integer registrationId) {
        EventRegistration registration = registrationRepo.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found."));
        if (!Objects.equals(registration.getEventID(), eventId)) {
            throw new IllegalArgumentException("Registration does not belong to the event.");
        }
        return registration;
    }

    private UserAccount loadActiveUser(Integer userID) {
        UserAccount user = userRepository.findByUserIDAndIsDeletedFalse(userID)
                .orElseThrow(() -> new IllegalArgumentException("Nguoi dung khong ton tai."));
        if (!ACCOUNT_STATUS_ACTIVE.equalsIgnoreCase(user.getAccountStatus())) {
            throw new IllegalArgumentException("Tai khoan hien khong hoat dong.");
        }
        return user;
    }

    private void ensureRegistrationWindowOpen(Event event) {
        stateMachineService.ensureRegistrationWindowOpen(event);
    }

    private void ensureWalkInWindowOpen(Event event) {
        stateMachineService.ensureWalkInWindowOpen(event);
    }

    private void ensureUserAllowedForEvent(Event event, UserAccount user) {
        if (Boolean.TRUE.equals(event.getIsInternal())) {
            boolean isActiveMember = membershipRepo.existsByClubIDAndUserIDAndIsDeletedFalse(event.getClubID(), user.getUserID());
            if (!isActiveMember) {
                throw new IllegalArgumentException("Ban phai la thanh vien cua CLB de tham gia su kien noi bo nay.");
            }
        }

        boolean isBlacklisted = blacklistRepository.existsByClubIDAndUserIDAndIsDeletedFalse(event.getClubID(), user.getUserID());
        if (isBlacklisted) {
            throw new IllegalArgumentException("Ban dang bi blacklist cua CLB nay.");
        }

        boolean hasActiveDiscipline = disciplineLogRepository.hasActiveDiscipline(
                user.getUserID(),
                event.getSemesterID(),
                DISCIPLINE_STATUS_ACTIVE
        );
        if (hasActiveDiscipline) {
            throw new IllegalArgumentException("Ban dang co ky luat active trong hoc ky nay.");
        }
    }

    private ParticipantType classifyParticipantType(Integer eventId, Integer userId) {
        EventAssignment assignment = eventAssignmentRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .filter(a -> Objects.equals(a.getUserID(), userId))
                .min(Comparator.comparingInt(a -> {
                    if (a.getEventRoleID() == null) {
                        return Integer.MAX_VALUE;
                    }
                    return switch (a.getEventRoleID()) {
                        case 1 -> 1;
                        case 2 -> 2;
                        default -> 3;
                    };
                }))
                .orElse(null);
        if (assignment == null || assignment.getEventRoleID() == null) {
            return RegistrationLifecycle.PARTICIPANT_TYPE_PARTICIPANT;
        }
        return assignment.getEventRoleID() == 1
                ? RegistrationLifecycle.PARTICIPANT_TYPE_CORE_TEAM
                : RegistrationLifecycle.PARTICIPANT_TYPE_SUPPORT_ORGANIZER;
    }

    private void ensureParticipantTypeEnabled(Integer eventId, ParticipantType participantType) {
        boolean enabled = registrationPolicyRepository.findByEventIDAndParticipantTypeAndIsDeletedFalse(eventId, participantType)
                .map(policy -> Boolean.TRUE.equals(policy.getIsEnabled()))
                .orElse(false);
        if (!enabled) {
            throw new IllegalArgumentException("Participant type is not enabled for this event.");
        }
    }

    private boolean isApprovalRequired(Integer eventId, ParticipantType participantType) {
        return registrationPolicyRepository.findByEventIDAndParticipantTypeAndIsDeletedFalse(eventId, participantType)
                .map(policy -> Boolean.TRUE.equals(policy.getRequiresManualApproval()) || Boolean.TRUE.equals(policy.getRequiresApproval()))
                .orElse(false);
    }

    private void ensureNoDuplicateActiveRegistration(Integer eventId, Integer userId, String guestEmail) {
        if (userId != null) {
            boolean exists = registrationRepo.existsByEventIDAndUserIDAndIsDeletedFalseAndRegistrationStatusIn(
                    eventId,
                    userId,
                    RegistrationLifecycle.ACTIVE_STATUSES
            );
            if (exists) {
                throw new IllegalArgumentException("Ban da dang ky su kien nay roi.");
            }
        }
        if (guestEmail != null) {
            boolean exists = registrationRepo.existsByEventIDAndGuestEmailAndIsDeletedFalseAndRegistrationStatusIn(
                    eventId,
                    guestEmail,
                    RegistrationLifecycle.ACTIVE_STATUSES
            );
            if (exists) {
                throw new IllegalArgumentException("Guest email already registered for this event.");
            }
        }
    }

    private void saveAudit(Integer actorId, EventRegistration registration, String actionType, String oldValue, String newValue, String reason) {
        auditLogService.record(actorId, AUDIT_TABLE, registration.getRegistrationID(), actionType, oldValue, newValue, reason);
    }

    private void notifyRegistrant(
            EventRegistration registration,
            Integer actorId,
            String notificationType,
            String title,
            String content
    ) {
        if (registration.getUserID() == null) {
            return;
        }
        UserAccount registrant = userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);
        if (registrant == null) {
            return;
        }
        UserAccount actor = userRepository.findByUserIDAndIsDeletedFalse(actorId).orElse(registrant);

        Notification notification = new Notification();
        notification.setClub(null);
        notification.setCreatedBy(actor);
        notification.setTitle(title);
        notification.setNotificationType(notificationType);
        notification.setContent(content);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsDeleted(false);
        Notification savedNotification = notificationRepository.save(notification);

        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setNotification(savedNotification);
        recipient.setUser(registrant);
        recipient.setIsRead(false);
        recipient.setCreatedAt(LocalDateTime.now());
        notificationRecipientRepository.save(recipient);
    }

    private RegistrationListItemResponse toView(EventRegistration registration, UserPrincipal currentUser) {
        UserAccount user = registration.getUserID() == null
                ? null
                : userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);

        boolean canViewGuestContact = canViewGuestContact(registration.getEventID(), currentUser);
        return new RegistrationListItemResponse(
                registration.getRegistrationID(),
                null,
                registration.getEventID(),
                registration.getUserID(),
                registration.getParticipantType(),
                currentRegistrationStatus(registration),
                registration.getRegisteredAt(),
                user == null ? null : user.getStudentId(),
                user == null ? null : user.getFullName(),
                user == null ? null : user.getEmail(),
                registration.getGuestFullName(),
                canViewGuestContact ? registration.getGuestEmail() : null,
                canViewGuestContact ? registration.getGuestPhone() : null,
                Boolean.TRUE.equals(registration.getCapacityExempt())
        );
    }

    private RegistrationListItemResponse toGuestView(GuestEventRegistration registration, UserPrincipal currentUser) {
        boolean canViewGuestContact = canViewGuestContact(registration.getEventID(), currentUser);
        return new RegistrationListItemResponse(
                null,
                registration.getGuestRegistrationID(),
                registration.getEventID(),
                null,
                ParticipantType.GUEST,
                currentGuestRegistrationStatus(registration),
                registration.getRegisteredAt(),
                null,
                null,
                null,
                registration.getGuestFullName(),
                canViewGuestContact ? registration.getGuestEmail() : null,
                canViewGuestContact ? registration.getGuestPhone() : null,
                false
        );
    }
    private boolean matchesParticipantType(RegistrationListItemResponse view, String participantType) {
        if (!StringUtils.hasText(participantType)) {
            return true;
        }
        return view.getParticipantType() != null && participantType.equalsIgnoreCase(view.getParticipantType().name());
    }

    private boolean matchesStatus(RegistrationListItemResponse view, String status) {
        if (!StringUtils.hasText(status)) {
            return true;
        }
        return view.getStatus() != null && status.equalsIgnoreCase(view.getStatus().name());
    }

    private RegistrationStatus currentGuestRegistrationStatus(GuestEventRegistration registration) {
        if (registration == null) {
            return null;
        }
        if (registration.getRegistrationStatus() != null) {
            return registration.getRegistrationStatus();
        }
        return RegistrationStatus.fromValue(registration.getStatus());
    }

    private RegistrationStatus currentRegistrationStatus(EventRegistration registration) {
        if (registration == null) {
            return null;
        }
        if (registration.getRegistrationStatus() != null) {
            return registration.getRegistrationStatus();
        }
        return RegistrationStatus.fromValue(registration.getStatus());
    }

    private boolean matchesKeyword(RegistrationListItemResponse view, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        String normalized = keyword.trim().toLowerCase(Locale.ROOT);
        return contains(view.getStudentId(), normalized)
                || contains(view.getFullName(), normalized)
                || contains(view.getEmail(), normalized)
                || contains(view.getGuestFullName(), normalized)
                || contains(view.getGuestEmail(), normalized);
    }

    private boolean contains(String value, String normalizedKeyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedKeyword);
    }

    private Comparator<RegistrationListItemResponse> buildComparator(String sortBy, boolean desc) {
        Comparator<RegistrationListItemResponse> comparator = switch (sortBy) {
            case "registrationID" -> Comparator.comparing(RegistrationListItemResponse::getRegistrationID, Comparator.nullsLast(Comparator.naturalOrder()));
            case "status" -> Comparator.comparing((RegistrationListItemResponse v) -> v.getStatus() == null ? null : v.getStatus().name(), Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "participantType" -> Comparator.comparing((RegistrationListItemResponse v) -> v.getParticipantType() == null ? null : v.getParticipantType().name(), Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "studentId" -> Comparator.comparing(RegistrationListItemResponse::getStudentId, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "fullName" -> Comparator.comparing(RegistrationListItemResponse::getFullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "email" -> Comparator.comparing(RegistrationListItemResponse::getEmail, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "guestFullName" -> Comparator.comparing(RegistrationListItemResponse::getGuestFullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "guestEmail" -> Comparator.comparing(RegistrationListItemResponse::getGuestEmail, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> Comparator.comparing(RegistrationListItemResponse::getRegisteredAt, Comparator.nullsLast(Comparator.naturalOrder()));
        };
        return desc ? comparator.reversed() : comparator;
    }

    private String normalizeSortBy(String sortBy) {
        return StringUtils.hasText(sortBy) ? sortBy.trim() : DEFAULT_SORT_BY;
    }

    private boolean normalizeSortDir(String sortDir) {
        return StringUtils.hasText(sortDir) && "desc".equalsIgnoreCase(sortDir.trim());
    }

    private boolean canViewGuestContact(Integer eventId, UserPrincipal currentUser) {
        return eventAssignmentAccessService.canViewGuestContact(eventId, currentUser);
    }

    private boolean hasPrivilegedAuthority(UserPrincipal currentUser) {
        return permissionService.canManageRegistrations(currentUser);
    }

    private void ensureCanManageRegistrations(UserPrincipal currentUser) {
        if (!permissionService.canManageRegistrations(currentUser)) {
            throw new IllegalArgumentException("You do not have permission to manage registrations.");
        }
    }
}
