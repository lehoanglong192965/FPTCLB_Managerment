package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventApprovalServiceImpl implements EventApprovalService {

    private static final String DECISION_APPROVED = "Approved";
    private static final String DECISION_REJECTED = "Rejected";
    private static final BigDecimal LARGE_BUDGET_THRESHOLD = BigDecimal.valueOf(5_000_000);
    private static final String EVENT_TABLE = "Event";

    private final EventRepository eventRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public EventApprovalResponse approveEvent(
            Integer eventId,
            EventApprovalRequest request,
            Integer actorID
    ) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new BusinessRuleException(
                        "Không tìm thấy sự kiện.",
                        HttpStatus.NOT_FOUND
                ));

        validateDecision(request.getDecision());
        validateLargeBudgetFeedback(event, request.getPdpFeedback());

        if (DECISION_APPROVED.equals(request.getDecision())) {
            validateScheduleConflict(event);
        }

        String oldStatus = event.getEventStatus();
        event.setEventStatus(request.getDecision());
        event.setPdpFeedback(request.getPdpFeedback());
        event.setApprovedBy(actorID);
        event.setApprovedAt(LocalDateTime.now());

        Event saved = eventRepository.save(event);
        writeAuditLog(
                actorID,
                DECISION_APPROVED.equals(request.getDecision()) ? "EVENT_APPROVED" : "EVENT_REJECTED",
                saved.getEventID(),
                "eventStatus=" + oldStatus,
                "eventStatus=" + saved.getEventStatus() + ", pdpFeedback=" + saved.getPdpFeedback(),
                StringUtils.hasText(saved.getPdpFeedback()) ? saved.getPdpFeedback() : "Event approval decision"
        );

        return new EventApprovalResponse(
                saved.getEventID(),
                saved.getEventName(),
                saved.getEventStatus(),
                saved.getPdpFeedback(),
                DECISION_APPROVED.equals(saved.getEventStatus())
                        ? "Sự kiện đã được phê duyệt."
                        : "Sự kiện đã bị từ chối."
        );
    }

    private void validateDecision(String decision) {
        if (!DECISION_APPROVED.equals(decision) && !DECISION_REJECTED.equals(decision)) {
            throw new BusinessRuleException(
                    "decision chỉ được là Approved hoặc Rejected.",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private void validateLargeBudgetFeedback(Event event, String pdpFeedback) {
        BigDecimal budget = event.getBudget() != null ? event.getBudget() : BigDecimal.ZERO;
        if (budget.compareTo(LARGE_BUDGET_THRESHOLD) > 0 && !StringUtils.hasText(pdpFeedback)) {
            throw new BusinessRuleException(
                    "Vui lòng nhập ghi chú phê duyệt cho sự kiện có ngân sách trên 5.000.000 VNĐ."
            );
        }
    }

    private void validateScheduleConflict(Event event) {
        boolean hasConflict = eventRepository.existsApprovedScheduleConflict(
                event.getEventID(),
                event.getLocation(),
                event.getStartDate(),
                event.getEndDate()
        );

        if (hasConflict) {
            throw new BusinessRuleException(
                    "Sự kiện bị trùng lịch hoặc địa điểm.",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void writeAuditLog(
            Integer actorID,
            String actionType,
            Integer recordID,
            String oldValue,
            String newValue,
            String reason
    ) {
        AuditLog log = new AuditLog();
        log.setActorID(actorID);
        log.setActionType(actionType);
        log.setTableName(EVENT_TABLE);
        log.setRecordID(recordID);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setOverrideReason(reason);
        log.setExecutedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }
}
