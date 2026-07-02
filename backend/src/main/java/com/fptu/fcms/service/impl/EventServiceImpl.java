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
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRegistrationPolicyRepository;
import com.fptu.fcms.repository.EventRoleRepository;
import com.fptu.fcms.repository.MemberPerformanceRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.event.EventLifecycleChangedEvent;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.ContributionBatchService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.EventRegistrationPolicyService;
import com.fptu.fcms.service.EventService;
import com.fptu.fcms.service.event.EventPermissionService;
import com.fptu.fcms.service.event.EventStateMachineService;
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
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private static final String STATUS_DRAFT = "Draft";
    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_PENDING_APPROVAL = "PendingApproval";
    private static final String STATUS_APPROVED = "Approved";
    private static final String STATUS_REJECTED = "Rejected";
    private static final String STATUS_CANCELLED = "Cancelled";
    private static final String STATUS_REGISTRATION_CLOSED = "RegistrationClosed";
    private static final String STATUS_ONGOING = "Ongoing";
    private static final String STATUS_COMPLETED = "Completed";
    private static final String STATUS_CLOSED = "Closed";
    private static final List<String> DEFAULT_PARTICIPANT_TYPES = List.of(
            "CORE_TEAM",
            "SUPPORT_ORGANIZER",
            "PARTICIPANT"
    );
    private static final String REGISTRATION_STATUS_REGISTERED = "REGISTERED";
    private static final String ATTENDANCE_STATUS_PRESENT = "Present";
    private static final String ATTENDANCE_STATUS_ABSENT = "Absent";
    private static final String CONTRIBUTION_TYPE_ABSENT = "ABSENT";
    private static final String LEADER_EVALUATION_GOOD = "GOOD";
    private static final String LEADER_EVALUATION_NOT_GOOD = "NOT_GOOD";
    private static final int NOT_GOOD_PENALTY_POINTS = 10;
    private static final int REGISTERED_MEMBER_BASE_POINTS = 100;
    private static final int CLUB_ROLE_MEMBER_ID = 3;
    private static final BigDecimal HIGH_BUDGET_THRESHOLD = new BigDecimal("5000000");

    private final EventRepository eventRepository;
    private final SemesterRepository semesterRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final EventRoleRepository eventRoleRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventRegistrationPolicyRepository registrationPolicyRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final AuditLogService auditLogService;
    private final EventAssignmentAccessService eventAssignmentAccessService;
    private final EventRegistrationPolicyService eventRegistrationPolicyService;
    private final EventStateMachineService stateMachineService;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final MemberPerformanceRepository memberPerformanceRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final ContributionBatchService contributionBatchService;

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
        System.out.println("[DEBUG] bannerUrl received: " + (request.getBannerUrl() != null ? "length=" + request.getBannerUrl().length() : "NULL"));
        validateCreateRequest(request);

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
        event.setLocation(request.getLocation());
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
        String oldStatus = event.getEventStatus();

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

        String decision = normalizeDecision(request.getDecision());
        String oldStatus = event.getEventStatus();
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
        return eventRepository.findByEventStatusInAndIsDeletedFalse(
                List.of(STATUS_APPROVED, STATUS_REGISTRATION_OPEN, STATUS_REGISTRATION_CLOSED, STATUS_ONGOING));
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEventById(Integer eventId) {
        return getActiveEventOrThrow(eventId);
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
        record.setCheckInMethod(CheckInMethod.STAFF_LOOKUP.name());
        record.setCheckedInBy(userId);
        record.setCheckedInAt(LocalDateTime.now());
        record.setAttendanceStatus("Present");
        record.setMarkedAt(LocalDateTime.now());
        record.setIsVerifiedByAI(false);
        record.setIsDeleted(false);
        attendanceRecordRepository.save(record);
        return user.getFullName() != null ? user.getFullName() : studentId;
    }

    private static final String STATUS_REGISTRATION_OPEN = "RegistrationOpen";
    private static final String STATUS_REPORT_UPLOADED = "ReportUploaded";

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
        event.setEventStatus(STATUS_CLOSED);
        eventRepository.save(event);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getReportUploadedEvents() {
        return eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_REPORT_UPLOADED);
    }

    @Override
    @Transactional
    public void rejectReport(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_REPORT_UPLOADED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be in ReportUploaded status to reject report.");
        }
        event.setEventStatus(STATUS_COMPLETED);
        eventRepository.save(event);
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

        List<AttendanceRecord> records = attendanceRecordRepository.findBySessionID(session.getSessionID()).stream()
                .filter(r -> "PRESENT".equalsIgnoreCase(r.getAttendanceStatus()) || "Present".equals(r.getAttendanceStatus()))
                .collect(Collectors.toList());
        List<Integer> userIds = records.stream()
                .map(AttendanceRecord::getUserID)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        List<UserAccount> users = userRepository.findAllByUserIDIn(userIds);
        Map<Integer, UserAccount> userMap = users.stream()
                .collect(Collectors.toMap(UserAccount::getUserID, u -> u));
        Map<Integer, EventRegistration> registrationMap = registrationRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .collect(Collectors.toMap(EventRegistration::getRegistrationID, r -> r, (a, b) -> a));

        return records.stream().map(r -> {
            UserAccount u = userMap.get(r.getUserID());
            EventRegistration registration = registrationMap.get(r.getRegistrationID());
            boolean guest = u == null && registration != null && registration.getUserID() == null;
            Map<String, Object> row = new HashMap<>();
            row.put("recordId", r.getRecordID());
            row.put("registrationId", r.getRegistrationID());
            row.put("userId", r.getUserID());
            row.put("fullName", u != null && u.getFullName() != null
                    ? u.getFullName()
                    : registration != null && registration.getGuestFullName() != null ? registration.getGuestFullName() : "");
            row.put("studentId", u != null && u.getStudentId() != null ? u.getStudentId() : "");
            row.put("registrationCode", registration != null ? registration.getRegistrationCode() : "");
            row.put("participantType", guest ? "GUEST" : "FPTU");
            row.put("markedAt", r.getMarkedAt() != null ? r.getMarkedAt().toString() : "");
            return row;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ContributionDTO> getEventContributions(Integer eventId) {
        return contributionBatchService.getContributionScores(eventId);
    }

    @Override
    @Transactional
    public void saveEventContributions(Integer eventId, List<ContributionDTO> contributions) {
        contributionBatchService.saveContributionScores(eventId, contributions, null);
    }

    @Override
    @Transactional
    public void openRegistration(Integer eventId, UserPrincipal currentUser) {
        Event event = getActiveEventOrThrow(eventId);
        String oldStatus = event.getEventStatus();
        stateMachineService.ensureCanOpenRegistration(event);
        validateRegistrationOpenWindow(event);
        event.setEventStatus("RegistrationOpen");
        if (event.getRegistrationOpenAt() == null) {
            event.setRegistrationOpenAt(LocalDateTime.now());
        }
        Event saved = eventRepository.save(event);
        auditLogService.record(
                currentUser == null ? null : currentUser.getUserId(),
                "Event",
                saved.getEventID(),
                "REGISTRATION_OPENED",
                oldStatus,
                saved.getEventStatus(),
                "Opened registration window"
        );
        publishLifecycleEvent(saved, oldStatus, saved.getEventStatus(), null, "Opened registration window");
    }

    @Override
    @Transactional
    public void updateEvent(Integer eventId, UpdateEventRequest request) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_DRAFT.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Chỉ có thể chỉnh sửa sự kiện ở trạng thái Nháp.");
        }
        if (request.getEventName() != null)     event.setEventName(request.getEventName());
        if (request.getDescription() != null)   event.setDescription(request.getDescription());
        if (request.getLocation() != null)      event.setLocation(request.getLocation());
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
        if (request.getBannerUrl() != null)     event.setBannerUrl(request.getBannerUrl());
        eventRepository.save(event);
        if (request.getRegistrationPolicies() != null && !request.getRegistrationPolicies().isEmpty()) {
            eventRegistrationPolicyService.syncPolicies(eventId, request.getRegistrationPolicies(), LocalDateTime.now());
        }
    }

    @Override
    @Transactional
    public void closeRegistration(Integer eventId, UserPrincipal currentUser) {
        Event event = getActiveEventOrThrow(eventId);
        String oldStatus = event.getEventStatus();
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
                oldStatus,
                saved.getEventStatus(),
                "Closed registration window"
        );
        publishLifecycleEvent(saved, oldStatus, saved.getEventStatus(), null, "Closed registration window");
    }

    @Override
    @Transactional
    public void approveEvent(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));

        stateMachineService.ensureCanApprove(event);

        validateEventBeforeSemesterSettlement(event);
        validateScheduleConflict(event);
        event.setEventStatus(STATUS_APPROVED);
        event.setApprovedAt(LocalDateTime.now());
        event.setRejectionReason(null);
        eventRepository.save(event);
    }

    @Override
    @Transactional
    public void rejectEvent(Integer eventId, String reason) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));
        String oldStatus = event.getEventStatus();

        stateMachineService.ensureCanReject(event);

        event.setEventStatus(STATUS_REJECTED);
        event.setPdpFeedback(reason);
        event.setRejectionReason(reason);
        Event savedEvent = eventRepository.save(event);
        auditLogService.record(null, "Event", savedEvent.getEventID(), "EVENT_REJECTED", oldStatus, STATUS_REJECTED, reason);
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
            if (userId == null || !REGISTRATION_STATUS_REGISTERED.equals(registration.getStatus())) {
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
                        absenceRecord.setAttendanceStatus(ATTENDANCE_STATUS_ABSENT);
                        absenceRecord.setCheckInMethod(CheckInMethod.AUTO.name());
                        absenceRecord.setCheckedInAt(LocalDateTime.now());
                        absenceRecord.setMarkedAt(LocalDateTime.now());
                        absenceRecord.setIsVerifiedByAI(false);
                        absenceRecord.setIsDeleted(false);
                        return attendanceRecordRepository.save(absenceRecord);
                    });
        }
    }

    private Integer resolveContributionBasePoints(Integer eventId, Integer userId) {
        if (userId == null) {
            return 0;
        }
        return registrationRepository.existsByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                ? REGISTERED_MEMBER_BASE_POINTS
                : 0;
    }

    private Set<Integer> getScoringMemberUserIds(Event event) {
        if (event == null || event.getClubID() == null || event.getSemesterID() == null) {
            return Set.of();
        }
        return clubMembershipRepository
                .findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
                        event.getClubID(),
                        event.getSemesterID(),
                        List.of(CLUB_ROLE_MEMBER_ID)
                )
                .stream()
                .map(com.fptu.fcms.entity.ClubMembership::getUserID)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private String normalizeContributionType(String contributionType) {
        if (!StringUtils.hasText(contributionType)) {
            return "";
        }
        String normalized = contributionType.trim().toUpperCase();
        if (!"CORE_TEAM".equals(normalized)
                && !"SUPPORT_ORGANIZER".equals(normalized)
                && !"PARTICIPANT".equals(normalized)
                && !CONTRIBUTION_TYPE_ABSENT.equals(normalized)) {
            throw new IllegalArgumentException("contributionType must be CORE_TEAM, SUPPORT_ORGANIZER, PARTICIPANT, ABSENT, or blank.");
        }
        return normalized;
    }

    private String normalizeLeaderEvaluation(String leaderEvaluation) {
        if (!StringUtils.hasText(leaderEvaluation)) {
            return null;
        }
        String normalized = leaderEvaluation.trim().toUpperCase();
        if (!LEADER_EVALUATION_GOOD.equals(normalized) && !LEADER_EVALUATION_NOT_GOOD.equals(normalized)) {
            throw new IllegalArgumentException("leaderEvaluation must be GOOD, NOT_GOOD, or blank.");
        }
        return normalized;
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

    private String normalizeDecision(String decision) {
        if (!StringUtils.hasText(decision)) {
            throw new BusinessRuleException("decision must be Approved or Rejected.", HttpStatus.BAD_REQUEST);
        }
        String normalized = decision.trim();
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
        boolean hasConflict = eventRepository.existsByLocationAndEventIDNotAndEventStatusAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
                event.getLocation(),
                event.getEventID(),
                STATUS_APPROVED,
                event.getEndDate(),
                event.getStartDate()
        );
        if (hasConflict) {
            throw new BusinessRuleException("Event conflicts with another approved event.", HttpStatus.CONFLICT);
        }
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
                .orElseThrow(() -> new BusinessRuleException("Semester not found.", HttpStatus.NOT_FOUND));

        LocalDate settlementDate = semester.getEndDate().minusDays(1);
        LocalDate eventEndDate = event.getEndDate().toLocalDate();
        if (eventEndDate.isAfter(settlementDate)) {
            throw new BusinessRuleException("Event must end before semester settlement date " + settlementDate + ".", HttpStatus.CONFLICT);
        }
    }

    private void saveApprovalAuditLog(
            Integer actorId,
            Event event,
            String oldStatus,
            String newStatus,
            String feedback,
            LocalDateTime executedAt
    ) {
        auditLogService.record(
                actorId,
                "Event",
                event.getEventID(),
                STATUS_APPROVED.equals(newStatus) ? "EVENT_APPROVED" : "EVENT_REJECTED",
                oldStatus,
                newStatus,
                StringUtils.hasText(feedback) ? feedback : "Event approval decision"
        );
    }

    private void publishLifecycleEvent(Event event, String oldStatus, String newStatus, Integer actorId, String reason) {
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
        EventPermissionService permissionService = null;
        boolean isManager = includePolicies && currentUser != null && (permissionService.isIcpdp(currentUser) || permissionService.isLeader(currentUser));
        List<EventRegistrationPolicyResponse> policies = isManager
                ? eventRegistrationPolicyService.getPolicies(event.getEventID(), currentUser)
                : null;

        return new EventDetailResponse(
                event.getEventID(),
                event.getClubID(),
                event.getSemesterID(),
                event.getEventCode(),
                event.getEventName(),
                event.getDescription(),
                event.getLocation(),
                event.getStartDate(),
                event.getEndDate(),
                event.getEventStatus(),
                event.getBannerUrl(),
                event.getAllowWalkIn(),
                isManager ? event.getRegistrationOpenAt() : null,
                isManager ? event.getRegistrationCloseAt() : null,
                isManager ? event.getCheckInOpenAt() : null,
                isManager ? event.getCheckInCloseAt() : null,
                isManager ? event.getTotalCapacity() : null,
                isManager ? event.getMaxParticipants() : null,
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

    private int calculateScore(String type) {
        return switch (type) {
            case "CORE_TEAM" -> 50;
            case "SUPPORT_ORGANIZER" -> 30;
            case "PARTICIPANT" -> 20;
            default -> 0;
        };
    }
}
