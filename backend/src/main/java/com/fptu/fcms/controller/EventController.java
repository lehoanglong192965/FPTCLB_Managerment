package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.request.EventAssignmentRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.fptu.fcms.dto.response.ContributionDTO;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping("/approved")
    public ResponseEntity<List<Event>> getApprovedEvents() {
        return ResponseEntity.ok(eventService.getApprovedEvents());
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<Event> getEventById(@PathVariable Integer eventId) {
        System.out.println("DEBUG: Fetching event with ID: " + eventId);
        Event event = eventService.getEventById(eventId);
        return ResponseEntity.ok(event);
    }

    @PostMapping("/registerEvent")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> createEventProposal(
            @RequestBody CreateEventProposalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.createEventProposal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đề xuất sự kiện đã được gửi thành công."));
    }

    @PutMapping("/{eventId}/approval")
    @PreAuthorize("hasAnyRole('ICPDP')")
    public ResponseEntity<EventApprovalResponse> approveEvent(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventApprovalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.approveEvent(eventId, request, currentUser));
    }

    @PatchMapping("/{clubId}/{eventId}/cancel")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> cancelEvent(
            @PathVariable Integer clubId,
            @PathVariable Integer eventId,
            @Valid @RequestBody CancelEventRequest request) {
        
        eventService.cancelEvent(clubId, eventId, request);
        return ResponseEntity.ok(Map.of("message", "Sự kiện đã được hủy và thông báo đã được gửi tới người tham dự."));
    }

    @PostMapping("/{eventId}/check-in")
    public ResponseEntity<Map<String, String>> checkIn(@PathVariable Integer eventId, @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.checkIn(eventId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of("message", "Điểm danh thành công."));
    }

    @PatchMapping("/{eventId}/finish")
    public ResponseEntity<Map<String, String>> finishEvent(@PathVariable Integer eventId) {
        eventService.finishEvent(eventId);
        return ResponseEntity.ok(Map.of("message", "Sự kiện đã kết thúc."));
    }

    @PatchMapping("/{eventId}/submit")
    public ResponseEntity<Map<String, String>> submitEventProposal(@PathVariable Integer eventId) {
        eventService.submitEventProposal(eventId);
        return ResponseEntity.ok(Map.of("message", "Đề xuất sự kiện đã được gửi."));
    }

    @PostMapping("/{eventId}/assignments")
    public ResponseEntity<Map<String, String>> addAssignment(
            @PathVariable Integer eventId,
            @RequestBody EventAssignmentRequest request) {
        eventService.addAssignment(eventId, request);
        return ResponseEntity.ok(Map.of("message", "Đã phân công thành viên."));
    }

    @GetMapping("/{eventId}/assignments")
    public ResponseEntity<List<EventAssignment>> getAssignments(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getAssignments(eventId));
    }

    @DeleteMapping("/{eventId}/assignments/{userId}")
    public ResponseEntity<Map<String, String>> removeAssignment(
            @PathVariable Integer eventId,
            @PathVariable Integer userId) {
        eventService.removeAssignment(eventId, userId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa phân công thành viên."));
    }

    @PatchMapping("/{eventId}/close")
    public ResponseEntity<Map<String, String>> closeEvent(@PathVariable Integer eventId) {
        eventService.closeEvent(eventId);
        return ResponseEntity.ok(Map.of("message", "Sự kiện đã đóng."));
    }

    @GetMapping("/{eventId}/contributions")
    public ResponseEntity<List<ContributionDTO>> getContributions(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getEventContributions(eventId));
    }

    @PostMapping("/{eventId}/contributions")
    public ResponseEntity<Map<String, String>> saveContributions(
            @PathVariable Integer eventId,
            @RequestBody List<ContributionDTO> contributions) {
        eventService.saveEventContributions(eventId, contributions);
        return ResponseEntity.ok(Map.of("message", "Đã lưu danh sách đóng góp."));
    }
}
