package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.request.EventAssignmentRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventRegistrationService;
import com.fptu.fcms.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventRegistrationService eventRegistrationService;

    @GetMapping("/approved")
    public ResponseEntity<List<Event>> getApprovedEvents() {
        return ResponseEntity.ok(eventService.getApprovedEvents());
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<Event> getEventById(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getEventById(eventId));
    }

    @GetMapping("/{eventId}/my-status")
    @PreAuthorize("hasAnyRole('Member', 'Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, Boolean>> getMyStatus(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean registered = eventRegistrationService.isUserRegistered(eventId, currentUser.getUserId());
        boolean assigned = eventService.isUserAssigned(eventId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of("registered", registered, "assigned", assigned));
    }

    @GetMapping("/my-assignments")
    @PreAuthorize("hasAnyRole('Member', 'Leader', 'ViceLeader')")
    public ResponseEntity<List<Event>> getMyAssignments(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.getEventsByUserAssigned(currentUser.getUserId()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> createEventProposal(
            @RequestBody @Valid CreateEventProposalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.createEventProposal(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Event proposal created successfully."));
    }

    @PutMapping("/{eventId}/submit")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> submitEventProposal(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.submitEventProposal(eventId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Event proposal submitted successfully."));
    }

    @PutMapping("/{eventId}/approve")
    @PreAuthorize("hasRole('ICPDP')")
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
        return ResponseEntity.ok(Map.of("message", "Event cancelled successfully."));
    }

    @PostMapping("/{eventId}/assignments")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<Map<String, String>> addAssignment(
            @PathVariable Integer eventId,
            @RequestBody EventAssignmentRequest request) {
        eventService.addAssignment(eventId, request);
        return ResponseEntity.ok(Map.of("message", "Assignment created successfully."));
    }

    @GetMapping("/{eventId}/assignments")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<List<EventAssignment>> getAssignments(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getAssignments(eventId));
    }

    @DeleteMapping("/{eventId}/assignments/{userId}")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<Map<String, String>> removeAssignment(
            @PathVariable Integer eventId,
            @PathVariable Integer userId) {
        eventService.removeAssignment(eventId, userId);
        return ResponseEntity.ok(Map.of("message", "Assignment removed successfully."));
    }
}
