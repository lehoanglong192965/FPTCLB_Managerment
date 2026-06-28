package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.request.EventAssignmentRequest;
import com.fptu.fcms.dto.response.ContributionDTO;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.EventRole;
import com.fptu.fcms.entity.MemberPerformance;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRoleRepository;
import com.fptu.fcms.repository.MemberPerformanceRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.event.EventLifecycleChangedEvent;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.EventService;
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
    private static final String REGISTRATION_STATUS_REGISTERED = "REGISTERED";
    private static final String ATTENDANCE_STATUS_PRESENT = "Present";
    private static final String ATTENDANCE_STATUS_ABSENT = "Absent";
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
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final MemberPerformanceRepository memberPerformanceRepository;

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
        event.setMaxParticipants(request.getMaxParticipants());
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
    @Transactional
    public String checkIn(Integer eventId, String studentId) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_ONGOING.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Sự kiện chưa bắt đầu, không thể điểm danh.");
        }

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
        if (!STATUS_APPROVED.equals(event.getEventStatus())
                && !STATUS_PENDING_APPROVAL.equals(event.getEventStatus())
                && !STATUS_REGISTRATION_OPEN.equals(event.getEventStatus())
                && !STATUS_REGISTRATION_CLOSED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be Approved, RegistrationOpen, or RegistrationClosed to start.");
        }

        event.setEventStatus(STATUS_ONGOING);
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
        if (!STATUS_ONGOING.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be Ongoing to finish.");
        }
        event.setEventStatus(STATUS_COMPLETED);
        eventRepository.save(event);
        markMissingAttendanceAsAbsent(event);
    }

    @Override
    @Transactional
    public void closeEvent(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_COMPLETED.equals(event.getEventStatus()) && !STATUS_REPORT_UPLOADED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be Completed or ReportUploaded to close.");
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
                                .anyMatch(ar -> ar.getUserID().equals(userId) && "Present".equals(ar.getAttendanceStatus()));
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
            record.setAttendanceStatus("PARTICIPANT".equals(type) ? ATTENDANCE_STATUS_PRESENT : (CONTRIBUTION_TYPE_ABSENT.equals(type) ? ATTENDANCE_STATUS_ABSENT : ATTENDANCE_STATUS_PRESENT));
            attendanceRecordRepository.save(record);
        }
    }

    @Override
    @Transactional
    public void openRegistration(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_APPROVED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be Approved to open registration.");
        }
        event.setEventStatus("RegistrationOpen");
        eventRepository.save(event);
    }

    @Override
    @Transactional
    public void updateEvent(Integer eventId, com.fptu.fcms.dto.request.UpdateEventRequest request) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_DRAFT.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Chỉ có thể chỉnh sửa sự kiện ở trạng thái Nháp.");
        }
        if (request.getEventName() != null)     event.setEventName(request.getEventName());
        if (request.getDescription() != null)   event.setDescription(request.getDescription());
        if (request.getLocation() != null)      event.setLocation(request.getLocation());
        if (request.getStartDate() != null)     event.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)       event.setEndDate(request.getEndDate());
        if (request.getMaxParticipants() != null) event.setMaxParticipants(request.getMaxParticipants());
        if (request.getBudget() != null)        event.setBudget(request.getBudget());
        if (request.getBannerUrl() != null)     event.setBannerUrl(request.getBannerUrl());
        eventRepository.save(event);
    }

    @Override
    @Transactional
    public void closeRegistration(Integer eventId) {
        Event event = getActiveEventOrThrow(eventId);
        if (!STATUS_REGISTRATION_OPEN.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be RegistrationOpen to close registration.");
        }
        event.setEventStatus(STATUS_REGISTRATION_CLOSED);
        eventRepository.save(event);
    }

    @Override
    @Transactional
    public void approveEvent(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));

        if (!STATUS_PENDING.equals(event.getEventStatus()) && !STATUS_PENDING_APPROVAL.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be Pending or PendingApproval before approval.");
        }

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

        if (!STATUS_PENDING.equals(event.getEventStatus()) && !STATUS_PENDING_APPROVAL.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be Pending or PendingApproval before rejection.");
        }

        event.setEventStatus(STATUS_REJECTED);
        event.setPdpFeedback(reason);
        event.setRejectionReason(reason);
        Event savedEvent = eventRepository.save(event);
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
                        absenceRecord.setAttendanceStatus(ATTENDANCE_STATUS_ABSENT);
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
        AuditLog auditLog = new AuditLog();
        auditLog.setActorID(actorId);
        auditLog.setActionType(STATUS_APPROVED.equals(newStatus) ? "EVENT_APPROVED" : "EVENT_REJECTED");
        auditLog.setTableName("Event");
        auditLog.setRecordID(event.getEventID());
        auditLog.setOldValue(oldStatus);
        auditLog.setNewValue(newStatus);
        auditLog.setOverrideReason(StringUtils.hasText(feedback) ? feedback : "Event approval decision");
        auditLog.setExecutedAt(executedAt);
        auditLogRepository.save(auditLog);
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

    private int calculateScore(String type) {
        return switch (type) {
            case "CORE_TEAM" -> 50;
            case "SUPPORT_ORGANIZER" -> 30;
            case "PARTICIPANT" -> 20;
            default -> 0;
        };
    }
}
