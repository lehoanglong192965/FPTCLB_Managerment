package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.*;
import com.fptu.fcms.dto.response.ContributionDTO;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.dto.response.EventDetailResponse;
import com.fptu.fcms.dto.response.EventRegistrationPolicyResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.EventRegistrationPolicy;
import com.fptu.fcms.entity.EventRole;
import com.fptu.fcms.entity.MemberPerformance;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.RegistrationStatus;
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
import com.fptu.fcms.service.event.EventPermissionService;
import com.fptu.fcms.service.event.EventStateMachineService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
public class EventServiceImpl implements EventService {

    private static final EventStatus STATUS_DRAFT = EventStatus.DRAFT;
    private static final EventStatus STATUS_PENDING = EventStatus.PENDING;
    private static final EventStatus STATUS_PENDING_APPROVAL = EventStatus.PENDING_APPROVAL;
    private static final EventStatus STATUS_APPROVED = EventStatus.APPROVED;
    private static final EventStatus STATUS_REJECTED = EventStatus.REJECTED;
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
    private static final List<String> DEFAULT_PARTICIPANT_TYPES = List.of(
            "CORE_TEAM",
            "SUPPORT_ORGANIZER",
            "PARTICIPANT"
    );
    private static final String CONTRIBUTION_TYPE_ABSENT = "ABSENT";
    private static final String LEADER_EVALUATION_GOOD = "GOOD";
    private static final String LEADER_EVALUATION_NOT_GOOD = "NOT_GOOD";
    private static final int NOT_GOOD_PENALTY_POINTS = 10;
    private static final BigDecimal HIGH_BUDGET_THRESHOLD = new BigDecimal("5000000");

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
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final MemberPerformanceRepository memberPerformanceRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final EventReportRepository eventReportRepository;
    private final ContributionBatchRepository contributionBatchRepository;
    private final ImageCleanupService imageCleanupService;

    @Override
    public boolean isUserAssigned(Integer eventId, Integer userId) {
        return eventAssignmentRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId).isPresent();
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
    public void submitEventProposal(Integer eventId, UserPrincipal currentUser) {
        Event event = getActiveEventOrThrow(eventId);
        assertCanModifyDraft(event, currentUser);

        if (!STATUS_DRAFT.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Only Draft events can be submitted.");
        }

        validateEventBeforeSubmission(event);
        eventRegistrationPolicyService.validateBeforeSubmit(eventId);
        event.setEventStatus(STATUS_PENDING_APPROVAL);
        eventRepository.save(event);
    }

    @Override
    @Transactional
    public void addAssignment(Integer eventId, EventAssignmentRequest request) {
        getActiveEventOrThrow(eventId);
        EventAssignment assignment = new EventAssignment();
        assignment.setEventID(eventId);
        assignment.setUserID(request.getUserID());
        assignment.setEventRoleID(resolveEventRoleId(request.getEventRoleID()));
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setIsDeleted(false);
        eventAssignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public void removeAssignment(Integer eventId, Integer userId) {
        eventAssignmentRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .filter(a -> a.getUserID().equals(userId))
                .forEach(a -> {
                    a.setIsDeleted(true);
                    eventAssignmentRepository.save(a);
                });
    }

    @Override
    @Transactional
    public void assignCheckInStaff(Integer eventId, Integer userId) {
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
    public void revokeCheckInStaff(Integer eventId, Integer userId) {
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
    public List<EventAssignment> getAssignments(Integer eventId) {
        return eventAssignmentRepository.findByEventIDAndIsDeletedFalse(eventId);
    }

    @Override
    @Transactional
    public void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .filter(e -> e.getClubID().equals(clubID))
                .orElseThrow(() -> new IllegalArgumentException("Event not found or not owned by club."));
        EventStatus oldStatus = event.getEventStatus();

        if (!STATUS_APPROVED.equals(event.getEventStatus()) && !STATUS_ONGOING.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Only Approved or Ongoing events can be cancelled.");
        }

        event.setEventStatus(STATUS_CANCELLED);
        Event savedEvent = eventRepository.save(event);
        publishLifecycleEvent(savedEvent, oldStatus, STATUS_CANCELLED, null, request.getReason());

        List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        if (!registrations.isEmpty()) {
            List<Integer> userIds = registrations.stream().map(EventRegistration::getUserID).collect(Collectors.toList());
            List<UserAccount> users = userRepository.findAllByUserIDIn(userIds);
            String subject = "Event cancelled: " + event.getEventName();
            String content = "Event " + event.getEventName() + " was cancelled. Reason:\n" + request.getReason();
            for (UserAccount user : users) {
                emailService.sendSimpleEmail(user.getEmail(), subject, content);
            }
        }
    }

    @Override
    @Transactional
    public EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND));

        EventStatus decision = normalizeDecision(request.getDecision());
        EventStatus oldStatus = event.getEventStatus();
        String feedback = request.getPdpFeedback();

        if (STATUS_APPROVED.equals(decision)) {
            assertApproverCannotBeCreator(event, currentUser);
            validateHighBudgetFeedback(event, feedback);
            validateEventBeforeSemesterSettlement(event);
            validateScheduleConflict(event);
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
                List.of(STATUS_APPROVED, STATUS_REGISTRATION_OPEN, STATUS_REGISTRATION_CLOSED, STATUS_ONGOING));
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
                List.of(STATUS_APPROVED, STATUS_REGISTRATION_OPEN, STATUS_REGISTRATION_CLOSED, STATUS_ONGOING, STATUS_COMPLETED));
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
    public Event getEventById(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        attachCurrentParticipants(List.of(event));
        return event;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getEventsByClubId(Integer clubId) {
        return eventRepository.findByClubIDAndIsDeletedFalse(clubId);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDetailResponse getPublicEventDetail(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        return toEventDetailResponse(event, null, false);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDetailResponse getManagedEventDetail(Integer eventId, UserPrincipal currentUser) {
        Event event = getActiveEventOrThrow(eventId);
        return toEventDetailResponse(event, currentUser, true);
    }

    @Override
    @Transactional
    public String checkIn(Integer eventId, String studentId, UserPrincipal currentUser) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_ONGOING.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Sự kiện chưa bắt đầu, không thể điểm danh.");
        }

        eventAssignmentAccessService.ensureCanManageCheckIn(eventId, currentUser);

        UserAccount user = userRepository.findByStudentId(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên với mã: " + studentId));

        Integer userId = user.getUserID();
        if (!registrationRepository.existsByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)) {
            throw new IllegalArgumentException("Sinh viên chưa đăng ký sự kiện này.");
        }

        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên điểm danh cho sự kiện này."));

        if (attendanceRecordRepository.findBySessionIDAndUserID(session.getSessionID(), userId).isPresent()) {
            throw new IllegalArgumentException("Sinh viên đã được điểm danh rồi.");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(session.getSessionID());
        record.setUserID(userId);
        record.setRegistrationID(registrationRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .map(EventRegistration::getRegistrationID)
                .orElse(null));
        record.setParticipantTypeSnapshotAt(registrationRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .map(EventRegistration::getParticipantTypeSnapshotAt)
                .orElse(null));

        record.setCheckedInBy(userId);
        record.setCheckedInAt(LocalDateTime.now());
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        record.setMarkedAt(LocalDateTime.now());
        record.setIsVerifiedByAI(false);
        record.setIsDeleted(false);
        attendanceRecordRepository.save(record);
        return user.getFullName() != null ? user.getFullName() : studentId;
    }

    @Override
    @Transactional
    public void startEvent(Integer eventId) {
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
            newSession.setIsDeleted(false);
            return attendanceSessionRepository.save(newSession);
        });
        if (session.getCheckInTime() == null) {
            session.setCheckInTime(LocalDateTime.now());
            attendanceSessionRepository.save(session);
        }
    }

    @Override
    @Transactional
    public void finishEvent(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        stateMachineService.ensureCanFinish(event);
        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not opened."));
        if (session.getCheckInTime() == null) {
            throw new IllegalArgumentException("Attendance session has not started yet.");
        }
        event.setEventStatus(STATUS_COMPLETED);
        if (event.getCheckInCloseAt() == null) {
            event.setCheckInCloseAt(LocalDateTime.now());
        }
        eventRepository.save(event);
        markMissingAttendanceAsAbsent(event);
    }

    @Override
    @Transactional
    public void closeEvent(Integer eventId) {
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
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCheckedInAttendees(Integer eventId) {
        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId).orElse(null);
        if (session == null) return List.of();

        List<AttendanceRecord> records = attendanceRecordRepository.findBySessionID(session.getSessionID());
        List<Integer> userIds = records.stream().map(AttendanceRecord::getUserID).collect(Collectors.toList());
        List<UserAccount> users = userRepository.findAllByUserIDIn(userIds);
        Map<Integer, UserAccount> userMap = users.stream()
                .collect(Collectors.toMap(UserAccount::getUserID, u -> u));

        return records.stream().map(r -> {
            UserAccount u = userMap.get(r.getUserID());
            Map<String, Object> row = new HashMap<>();
            row.put("userId", r.getUserID());
            row.put("fullName", u != null && u.getFullName() != null ? u.getFullName() : "");
            row.put("studentId", u != null && u.getStudentId() != null ? u.getStudentId() : "");
            row.put("markedAt", r.getMarkedAt() != null ? r.getMarkedAt().toString() : "");
            return row;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ContributionDTO> getEventContributions(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        List<EventAssignment> assignments = eventAssignmentRepository.findByEventIDAndIsDeletedFalse(eventId);
        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId).orElse(null);
        List<AttendanceRecord> attendanceRecords = session == null
                ? List.of()
                : attendanceRecordRepository.findBySessionID(session.getSessionID());

        return registrations.stream().map(reg -> {
            Integer userId = reg.getUserID();
            String userName = userRepository.findById(userId).map(UserAccount::getFullName).orElse("Unknown");

            String contributionType = assignments.stream()
                    .filter(a -> a.getUserID().equals(userId))
                    .findFirst()
                    .map(a -> a.getEventRoleID() != null && a.getEventRoleID() == 1 ? "CORE_TEAM" : "SUPPORT_ORGANIZER")
                    .orElseGet(() -> {
                        boolean present = attendanceRecords.stream()
                                .anyMatch(ar -> ar.getUserID().equals(userId) && AttendanceStatus.PRESENT.equals(ar.getAttendanceStatus()));
                        return present ? "PARTICIPANT" : "ABSENT";
                    });

            String leaderEvaluation = memberPerformanceRepository
                    .findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                    .map(MemberPerformance::getLeaderEvaluation)
                    .filter(StringUtils::hasText)
                    .orElse(LEADER_EVALUATION_GOOD);

            return new ContributionDTO(userId, userName, contributionType, leaderEvaluation);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveEventContributions(Integer eventId, List<ContributionDTO> contributions) {
        Event event = getActiveEventOrThrow(eventId);
        if (STATUS_CLOSED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event is closed and cannot be modified.");
        }

        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not found."));

        for (ContributionDTO dto : contributions) {
            Integer userId = dto.getUserID();
            String type = dto.getContributionType();
            EventRegistration registration = registrationRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId).orElse(null);

            MemberPerformance performance = memberPerformanceRepository
                    .findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                    .orElse(new MemberPerformance());
            performance.setClubID(event.getClubID());
            performance.setEventID(eventId);
            performance.setUserID(userId);
            String leaderEvaluation = normalizeLeaderEvaluation(dto.getLeaderEvaluation());
            performance.setBonusPoints(calculateScore(type));
            performance.setLeaderEvaluation(leaderEvaluation);
            performance.setPenaltyPoints(LEADER_EVALUATION_NOT_GOOD.equals(leaderEvaluation) ? NOT_GOOD_PENALTY_POINTS : 0);
            performance.setSourceContributionID(null);
            performance.setIndividualRankingEligible(isRegularMemberForRanking(event, userId));
            performance.setUpdatedAt(LocalDateTime.now());
            performance.setIsDeleted(false);
            memberPerformanceRepository.save(performance);

            EventAssignment assignment = eventAssignmentRepository
                    .findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                    .orElse(new EventAssignment());
            assignment.setEventID(eventId);
            assignment.setUserID(userId);
            assignment.setEventRoleID("CORE_TEAM".equals(type) ? 1 : ("SUPPORT_ORGANIZER".equals(type) ? 2 : null));
            assignment.setAssignedAt(LocalDateTime.now());
            assignment.setIsDeleted(!"CORE_TEAM".equals(type) && !"SUPPORT_ORGANIZER".equals(type));
            eventAssignmentRepository.save(assignment);

            AttendanceRecord record = attendanceRecordRepository
                    .findBySessionIDAndUserID(session.getSessionID(), userId)
                    .orElse(new AttendanceRecord());
            record.setSessionID(session.getSessionID());
            record.setUserID(userId);
            if (registration != null) {
                record.setRegistrationID(registration.getRegistrationID());
                record.setParticipantTypeSnapshotAt(registration.getParticipantTypeSnapshotAt());
            }
            record.setAttendanceStatus("PARTICIPANT".equals(type) ? AttendanceStatus.PRESENT : (CONTRIBUTION_TYPE_ABSENT.equals(type) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT));
            attendanceRecordRepository.save(record);
        }
    }

    @Override
    @Transactional
    public void openRegistration(Integer eventId, UserPrincipal currentUser) {
        Event event = getActiveEventOrThrow(eventId);
        EventStatus oldStatus = event.getEventStatus();
        stateMachineService.ensureCanOpenRegistration(event);
        validateRegistrationOpenWindow(event);
        event.setEventStatus(STATUS_REGISTRATION_OPEN);
        if (event.getRegistrationOpenAt() == null) {
            event.setRegistrationOpenAt(LocalDateTime.now());
        }
        Event saved = eventRepository.save(event);
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
    public void updateEvent(Integer eventId, UpdateEventRequest request) {
        Event event = getActiveEventOrThrow(eventId);
        EventStatus status = event.getEventStatus();
        boolean isDraft = STATUS_DRAFT.equals(status);
        // Sau khi ICPDP đã duyệt (Approved/RegistrationOpen/RegistrationClosed) nhưng
        // sự kiện chưa diễn ra: vẫn cho sửa, nhưng chỉ được đổi số người tham gia tối đa.
        boolean isPostApprovalEditable = STATUS_APPROVED.equals(status)
                || STATUS_REGISTRATION_OPEN.equals(status)
                || STATUS_REGISTRATION_CLOSED.equals(status);
        if (!isDraft && !isPostApprovalEditable) {
            throw new IllegalArgumentException("Chỉ có thể chỉnh sửa sự kiện trước khi diễn ra.");
        }
        if (!isDraft) {
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
                    || request.getBannerUrl() != null
                    || (request.getRegistrationPolicies() != null && !request.getRegistrationPolicies().isEmpty());
            if (editsOtherFields) {
                throw new IllegalArgumentException("Sau khi được ICPDP duyệt, chỉ có thể chỉnh sửa số người tham gia tối đa.");
            }
        }
        String oldBannerPublicId = event.getBannerPublicId();
        boolean bannerTouched = request.getBannerUrl() != null;
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
        if (request.getBannerUrl() != null) {
            event.setBannerUrl(request.getBannerUrl().isBlank() ? null : request.getBannerUrl());
            event.setBannerPublicId(normalizePublicId(request.getBannerPublicId()));
        }
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
        Event event = getActiveEventOrThrow(eventId);
        EventStatus oldStatus = event.getEventStatus();
        stateMachineService.ensureCanCloseRegistration(event);
        event.setEventStatus(STATUS_REGISTRATION_CLOSED);
        if (event.getRegistrationCloseAt() == null) {
            event.setRegistrationCloseAt(LocalDateTime.now());
        }
        Event saved = eventRepository.save(event);
        auditLogService.record(
                currentUser == null ? null : currentUser.getUserId(),
                "Event",
                saved.getEventID(),
                "REGISTRATION_CLOSED",
                oldStatus.name(),
                saved.getEventStatus().name(),
                "Closed registration window"
        );
        publishLifecycleEvent(saved, oldStatus, saved.getEventStatus(), null, "Closed registration window");
    }

    @Override
    @Transactional
    public void approveEvent(Integer eventId, UserPrincipal currentUser) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự kiện."));
        EventStatus oldStatus = event.getEventStatus();

        stateMachineService.ensureCanApprove(event);

        validateEventBeforeSemesterSettlement(event);
        validateScheduleConflict(event);
        event.setEventStatus(STATUS_APPROVED);
        event.setApprovedAt(LocalDateTime.now());
        event.setRejectionReason(null);
        Event savedEvent = eventRepository.save(event);
        auditLogService.record(currentUser.getUserId(), "Event", savedEvent.getEventID(), "EVENT_APPROVED", oldStatus.name(), STATUS_APPROVED.name(), null);
    }

    @Override
    @Transactional
    public void rejectEvent(Integer eventId, String reason, UserPrincipal currentUser) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự kiện."));
        EventStatus oldStatus = event.getEventStatus();

        stateMachineService.ensureCanReject(event);

        event.setEventStatus(STATUS_REJECTED);
        event.setPdpFeedback(reason);
        event.setRejectionReason(reason);
        Event savedEvent = eventRepository.save(event);
        auditLogService.record(currentUser.getUserId(), "Event", savedEvent.getEventID(), "EVENT_REJECTED", oldStatus.name(), STATUS_REJECTED.name(), reason);
        publishLifecycleEvent(savedEvent, oldStatus, STATUS_REJECTED, null, reason);
    }

    private void markMissingAttendanceAsAbsent(Event event) {
        AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID()).orElse(null);
        if (session == null) {
            return;
        }

        List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID());
        for (EventRegistration registration : registrations) {
            Integer userId = registration.getUserID();
            if (userId == null || registration.getRegistrationStatus() != RegistrationStatus.REGISTERED) {
                continue;
            }

            attendanceRecordRepository
                    .findBySessionIDAndUserID(session.getSessionID(), userId)
                    .orElseGet(() -> {
            AttendanceRecord absenceRecord = new AttendanceRecord();
                        absenceRecord.setSessionID(session.getSessionID());
                        absenceRecord.setUserID(userId);
                        absenceRecord.setRegistrationID(registration.getRegistrationID());
                        absenceRecord.setParticipantTypeSnapshotAt(registration.getParticipantTypeSnapshotAt());
                        absenceRecord.setAttendanceStatus(AttendanceStatus.ABSENT);
                        absenceRecord.setCheckInMethod(CheckInMethod.AUTO);
                        absenceRecord.setCheckedInAt(LocalDateTime.now());
                        absenceRecord.setMarkedAt(LocalDateTime.now());
                        absenceRecord.setIsVerifiedByAI(false);
                        absenceRecord.setIsDeleted(false);
                        return attendanceRecordRepository.save(absenceRecord);
                    });
        }
    }

    private String normalizeLeaderEvaluation(String leaderEvaluation) {
        if (!StringUtils.hasText(leaderEvaluation)) {
            return LEADER_EVALUATION_GOOD;
        }
        String normalized = leaderEvaluation.trim().toUpperCase();
        if (!LEADER_EVALUATION_GOOD.equals(normalized) && !LEADER_EVALUATION_NOT_GOOD.equals(normalized)) {
            throw new IllegalArgumentException("leaderEvaluation must be GOOD or NOT_GOOD.");
        }
        return normalized;
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
        if (!event.getEndDate().isAfter(event.getStartDate())) {
            throw new IllegalArgumentException("endDate must be after startDate.");
        }
        if (!event.getStartDate().isAfter(LocalDateTime.now().plusDays(7))) {
            throw new IllegalArgumentException("startDate must be at least 7 days from now before submit.");
        }
        if (event.getTotalCapacity() != null && event.getTotalCapacity() < 0) {
            throw new IllegalArgumentException("totalCapacity cannot be negative.");
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
        eventRepository.findFirstByLocationAndEventIDNotAndEventStatusAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
                event.getLocation(),
                event.getEventID(),
                STATUS_APPROVED,
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
                isManager ? event.getApprovedBy() : null,
                isManager ? event.getApprovedAt() : null,
                isManager ? event.getPdpFeedback() : null,
                isManager ? event.getRejectionReason() : null,
                isManager ? event.getIsInternal() : null,
                isManager ? event.getIsScoreLocked() : null,
                isManager ? event.getCreatedAt() : null,
                isManager ? event.getCreatedBy() : null,
                policies
        );
    }

    private String normalizePublicId(String publicId) {
        return StringUtils.hasText(publicId) ? publicId.trim() : null;
    }

    private int calculateScore(String type) {
        return switch (type) {
            case "CORE_TEAM" -> 50;
            case "SUPPORT_ORGANIZER" -> 30;
            case "PARTICIPANT" -> 20;
            default -> 0;
        };
    }
}
