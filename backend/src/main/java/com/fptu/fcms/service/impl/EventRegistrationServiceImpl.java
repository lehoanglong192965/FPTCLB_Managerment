package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;
import com.fptu.fcms.dto.request.EventWalkInRegistrationRequest;
import com.fptu.fcms.dto.request.RegistrationRejectRequest;
import com.fptu.fcms.dto.response.RegistrationListItemResponse;
import com.fptu.fcms.dto.response.RegistrationPageResponse;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.Notification;
import com.fptu.fcms.entity.NotificationRecipient;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AuditLogRepository;
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
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventRegistrationServiceImpl implements EventRegistrationService {

    private static final String AUDIT_TABLE = "EventRegistration";
    private static final String ACCOUNT_STATUS_ACTIVE = "Active";
    private static final String DISCIPLINE_STATUS_ACTIVE = "Active";
    private static final Set<String> LEADER_AUTHORITIES = Set.of("ROLE_Leader", "ROLE_ViceLeader");
    private static final Set<String> PRIVILEGED_AUTHORITIES = Set.of("ROLE_Leader", "ROLE_ViceLeader", "ROLE_ICPDP", "ROLE_Admin");
    private static final String DEFAULT_SORT_BY = "registeredAt";

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
    private final RegistrationAllocationService allocationService;
    private final EventPermissionService permissionService;
    private final EventAssignmentAccessService eventAssignmentAccessService;
    private final EventStateMachineService stateMachineService;
    private final AuditLogService auditLogService;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void registerEvent(Integer eventID, Integer userID) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventID)
                .orElseThrow(() -> new IllegalArgumentException("Su kien khong ton tai."));
        ensureRegistrationWindowOpen(event);

        UserAccount user = loadActiveUser(userID);
        ensureUserAllowedForEvent(event, user);

        ParticipantType participantType = classifyParticipantType(eventID, userID);
        ensureParticipantTypeEnabled(eventID, participantType);
        ensureNoDuplicateActiveRegistration(eventID, userID, null);
        boolean requiresApproval = isApprovalRequired(eventID, participantType);

        RegistrationAllocationResult allocation = allocationService.allocateInitial(
                eventID,
                event.getMaxParticipants(),
                requiresApproval
        );

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
        if (allocation.consumesSeat()) {
            registration.setTicketCode(UUID.randomUUID().toString());
            registration.setTicketIssuedAt(LocalDateTime.now());
        }
        registration.setIsDeleted(false);
        registrationRepo.save(registration);
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
        cancelRegistrationInternal(registration, userID, true);
    }

    @Override
    public boolean isUserRegistered(Integer eventId, Integer userId) {
        return registrationRepo.existsByEventIDAndUserIDAndIsDeletedFalseAndRegistrationStatusIn(
                eventId,
                userId,
                RegistrationLifecycle.ACTIVE_STATUSES
        );
    }

    @Override
    public List<Event> getEventsByUserRegistered(Integer userId) {
        return registrationRepo.findByUserIDAndIsDeletedFalse(userId).stream()
                .filter(reg -> RegistrationLifecycle.ACTIVE_STATUSES.contains(reg.getRegistrationStatus()))
                .map(EventRegistration::getEventID)
                .distinct()
                .map(eventId -> eventRepository.findById(eventId).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
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
        ensureCanManageRegistrations(currentUser);
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
        ensureCanManageRegistrations(currentUser);
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
        if (allocation.consumesSeat() && registration.getTicketCode() == null) {
            registration.setTicketCode(UUID.randomUUID().toString());
            registration.setTicketIssuedAt(LocalDateTime.now());
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

    @Override
    @Transactional
    @CacheEvict(value = "memberRanking", allEntries = true)
    public void rejectRegistration(Integer eventId, Integer registrationId, RegistrationRejectRequest request, UserPrincipal currentUser) {
        ensureCanManageRegistrations(currentUser);
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
    public void cancelRegistration(Integer registrationId, UserPrincipal currentUser) {
        EventRegistration registration = registrationRepo.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found."));
        if (registration.getUserID() != null && currentUser != null && !Objects.equals(registration.getUserID(), currentUser.getUserId()) && !hasPrivilegedAuthority(currentUser)) {
            throw new IllegalArgumentException("You are not allowed to cancel this registration.");
        }
        cancelRegistrationInternal(registration, currentUser == null ? null : currentUser.getUserId(), false);
    }

    /**
     * Leader/ViceLeader huỷ đăng ký của KHÁCH theo id (khách tự huỷ thì dùng
     * guestReference qua GuestRegistrationService). Nếu khách đang giữ chỗ,
     * giải phóng chỗ và đôn waitlist lên như huỷ member.
     */
    @Override
    @Transactional
    public void cancelGuestRegistration(Integer eventId, Integer guestRegistrationId, UserPrincipal currentUser) {
        ensureCanManageRegistrations(currentUser);
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

    private void cancelRegistrationInternal(EventRegistration registration, Integer actorUserId, boolean triggeredByLegacyEndpoint) {
        RegistrationStatus currentStatus = currentRegistrationStatus(registration);
        if (RegistrationLifecycle.STATUS_CANCELLED.equals(currentStatus)) {
            return;
        }

        Event event = loadEventForUpdate(registration.getEventID());
        RegistrationStatus oldStatus = currentStatus;
        registration.setStatus(String.valueOf(RegistrationLifecycle.STATUS_CANCELLED));
        registration.setRegistrationStatus(RegistrationLifecycle.STATUS_CANCELLED);
        registration.setUpdatedAt(LocalDateTime.now());
        registration.setUpdatedBy(actorUserId);
        registration.setTicketRevokedAt(LocalDateTime.now());
        registration.setIsDeleted(false);
        registrationRepo.save(registration);

        boolean freedSeat = RegistrationLifecycle.CONFIRMED_STATUSES.contains(oldStatus);
        int promoted = freedSeat ? allocationService.promoteWaitlisted(event.getEventID(), event.getMaxParticipants()) : 0;
        saveAudit(actorUserId, registration, "REGISTRATION_CANCELLED", oldStatus == null ? null : oldStatus.name(), RegistrationLifecycle.STATUS_CANCELLED.name(),
                triggeredByLegacyEndpoint ? "Cancelled from legacy unregister endpoint" : "Cancelled by user");
        if (promoted > 0) {
            // no-op: promotion is handled atomically by allocation service
        }
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
        return switch (assignment.getEventRoleID()) {
            case 1 -> RegistrationLifecycle.PARTICIPANT_TYPE_CORE_TEAM;
            case 2 -> RegistrationLifecycle.PARTICIPANT_TYPE_SUPPORT_ORGANIZER;
            default -> RegistrationLifecycle.PARTICIPANT_TYPE_PARTICIPANT;
        };
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

        boolean canViewGuestContact = canViewGuestContact(currentUser);
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
                canViewGuestContact ? registration.getGuestPhone() : null
        );
    }

    private RegistrationListItemResponse toGuestView(GuestEventRegistration registration, UserPrincipal currentUser) {
        boolean canViewGuestContact = canViewGuestContact(currentUser);
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
                canViewGuestContact ? registration.getGuestPhone() : null
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

    private boolean canViewGuestContact(UserPrincipal currentUser) {
        return permissionService.isLeader(currentUser);
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