package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.Semester;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_APPROVED = "Approved";
    private static final String STATUS_REJECTED = "Rejected";
    private static final BigDecimal HIGH_BUDGET_THRESHOLD = new BigDecimal("5000000");

    private final EventRepository eventRepository;
    private final SemesterRepository semesterRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final EventRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public void createEventProposal(CreateEventProposalRequest request) {
        LocalDateTime now = LocalDateTime.now();
        long daysUntilEvent = ChronoUnit.DAYS.between(now, request.getStartDate());

        boolean isResubmit = request.getIsResubmitted() != null && request.getIsResubmitted();

        // [BR-G02] Validate mốc thời gian tối thiểu
        if (isResubmit) {
            if (daysUntilEvent < 7) {
                throw new IllegalArgumentException("Đề xuất lại (Resubmit) phải được gửi trước ít nhất 7 ngày.");
            }
        } else {
            if (daysUntilEvent < 14) {
                throw new IllegalArgumentException("Đề xuất sự kiện mới phải được gửi trước ít nhất 14 ngày.");
            }
        }

        Event event = new Event();
        event.setClubID(request.getClubID());
        event.setSemesterID(request.getSemesterID());
        event.setEventCode(request.getEventCode());
        event.setEventName(request.getEventName());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setBudget(request.getBudget());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setEventStatus(STATUS_PENDING);
        event.setIsResubmitted(isResubmit);
        event.setIsInternal(request.getIsInternal() != null && request.getIsInternal());
        event.setIsScoreLocked(false);
        event.setCreatedAt(now);
        event.setIsDeleted(false);

        Event savedEvent = eventRepository.save(event);

        // [BR-E03] Gán danh sách Ban tổ chức
        if (request.getAssignments() != null && !request.getAssignments().isEmpty()) {
            List<EventAssignment> assignments = request.getAssignments().stream().map(dto -> {
                EventAssignment assignment = new EventAssignment();
                assignment.setEventID(savedEvent.getEventID());
                assignment.setUserID(dto.getUserID());
                assignment.setEventRoleID(dto.getEventRoleID());
                assignment.setAssignedAt(now);
                assignment.setIsDeleted(false);
                return assignment;
            }).collect(Collectors.toList());

            eventAssignmentRepository.saveAll(assignments);
        }
    }

    @Override
    @Transactional
    public void cancelEvent(Integer clubID, Integer eventId, CancelEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .filter(e -> e.getClubID().equals(clubID))
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại hoặc không thuộc CLB của bạn."));

        if (!STATUS_APPROVED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Chỉ có thể hủy sự kiện đã được phê duyệt (Approved).");
        }

        event.setEventStatus("Cancelled");
        eventRepository.save(event);

        // Gửi thông báo cho người tham dự (BR-E06)
        List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        if (!registrations.isEmpty()) {
            List<Integer> userIds = registrations.stream()
                    .map(EventRegistration::getUserID)
                    .collect(Collectors.toList());

            List<UserAccount> users = userRepository.findAllByUserIDIn(userIds);

            String subject = "Thông báo hủy sự kiện: " + event.getEventName();
            String content = "Sự kiện " + event.getEventName() + " đã bị hủy với lý do:\n" + request.getReason();

            for (UserAccount user : users) {
                emailService.sendSimpleEmail(user.getEmail(), subject, content);
            }
        }
    }

    /**
     * BR-E07: PDP/Admin phê duyệt hoặc từ chối đề xuất sự kiện.
     * Khi duyệt sẽ kiểm tra ngân sách lớn, trùng lịch/địa điểm và ghi audit log.
     */
    @Override
    @Transactional
    public EventApprovalResponse approveEvent(Integer eventId, EventApprovalRequest request, UserPrincipal currentUser) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new BusinessRuleException("Sự kiện không tồn tại.", HttpStatus.NOT_FOUND));

        String decision = normalizeDecision(request.getDecision());
        String oldStatus = event.getEventStatus();
        String feedback = request.getPdpFeedback();

        if (STATUS_APPROVED.equals(decision)) {
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

        String message = STATUS_APPROVED.equals(decision)
                ? "Sự kiện đã được phê duyệt."
                : "Sự kiện đã bị từ chối.";

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
        return eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getApprovedEvents() {
        return eventRepository.findByEventStatusAndIsDeletedFalse(STATUS_APPROVED);
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEventById(Integer eventId) {
        return eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));
    }

    @Override
    @Transactional
    public void approveEvent(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));

        if (!STATUS_PENDING.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Chỉ có thể phê duyệt sự kiện đang ở trạng thái chờ duyệt (Pending).");
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
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));

        if (!STATUS_PENDING.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Chỉ có thể từ chối sự kiện đang ở trạng thái chờ duyệt (Pending).");
        }

        event.setEventStatus(STATUS_REJECTED);
        event.setPdpFeedback(reason);
        event.setRejectionReason(reason);
        eventRepository.save(event);
    }

    private String normalizeDecision(String decision) {
        if (!StringUtils.hasText(decision)) {
            throw new BusinessRuleException("decision chỉ được là Approved hoặc Rejected.", HttpStatus.BAD_REQUEST);
        }

        String normalized = decision.trim();
        if (!STATUS_APPROVED.equals(normalized) && !STATUS_REJECTED.equals(normalized)) {
            throw new BusinessRuleException("decision chỉ được là Approved hoặc Rejected.", HttpStatus.BAD_REQUEST);
        }
        return normalized;
    }

    /**
     * Sự kiện ngân sách trên 5.000.000 VNĐ bắt buộc PDP nhập ghi chú phê duyệt.
     */
    private void validateHighBudgetFeedback(Event event, String feedback) {
        BigDecimal budget = event.getBudget() == null ? BigDecimal.ZERO : event.getBudget();
        if (budget.compareTo(HIGH_BUDGET_THRESHOLD) > 0 && !StringUtils.hasText(feedback)) {
            throw new BusinessRuleException(
                    "Vui lòng nhập ghi chú phê duyệt cho sự kiện có ngân sách trên 5.000.000 VNĐ."
            );
        }
    }

    /**
     * Check overlap theo công thức: current.start < other.end AND current.end > other.start.
     */
    private void validateScheduleConflict(Event event) {
        boolean hasConflict = eventRepository
                .existsByLocationAndEventIDNotAndEventStatusAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
                        event.getLocation(),
                        event.getEventID(),
                        STATUS_APPROVED,
                        event.getEndDate(),
                        event.getStartDate()
                );

        if (hasConflict) {
            throw new BusinessRuleException("Sự kiện bị trùng lịch hoặc địa điểm.", HttpStatus.CONFLICT);
        }
    }

    /**
     * AuditLog dùng lại bảng hiện có để lưu vết quyết định EVENT_APPROVED/EVENT_REJECTED.
     */

    /**
     * Event được duyệt phải kết thúc không muộn hơn ngày kết toán học kỳ (endDate - 1 ngày)
     * để hệ thống có đủ thời gian chốt ranking và trao thưởng.
     */
    private void validateEventBeforeSemesterSettlement(Event event) {
        Semester semester = semesterRepository.findById(event.getSemesterID())
                .orElseThrow(() -> new BusinessRuleException("Học kỳ của sự kiện không tồn tại.", HttpStatus.NOT_FOUND));

        LocalDate settlementDate = semester.getEndDate().minusDays(1);
        LocalDate eventEndDate = event.getEndDate().toLocalDate();
        if (eventEndDate.isAfter(settlementDate)) {
            throw new BusinessRuleException(
                    "Không thể duyệt sự kiện kết thúc sau ngày kết toán học kỳ " + settlementDate + ".",
                    HttpStatus.CONFLICT
            );
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
}
