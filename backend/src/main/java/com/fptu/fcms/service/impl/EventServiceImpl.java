package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.repository.EventAssignmentRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventAssignmentRepository eventAssignmentRepository;

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
        event.setEventStatus("Pending");
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
}
