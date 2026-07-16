package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.dto.request.ContributionEmergencyOverrideRequest;
import com.fptu.fcms.dto.request.CreateEventProposalRequest;
import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.request.EventAssignmentRequest;
import com.fptu.fcms.dto.request.ReportRejectRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.dto.response.EventDetailResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventAssignment;
import io.swagger.v3.oas.annotations.Operation;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ContributionBatchService;
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
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventRegistrationService eventRegistrationService;
    private final ContributionBatchService contributionBatchService;

    @GetMapping("/approved")
    public ResponseEntity<List<Event>> getApprovedEvents() {
        return ResponseEntity.ok(eventService.getApprovedEvents());
    }

    @GetMapping("/report-uploaded")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<List<Event>> getReportUploadedEvents() {
        return ResponseEntity.ok(eventService.getReportUploadedEvents());
    }

    /**
     * Lịch sử báo cáo đã duyệt/từ chối (REPORT_APPROVED, REPORT_REJECTED
     * và các trạng thái sau khi duyệt báo cáo).
     */
    @GetMapping("/report-reviewed")
    @PreAuthorize("hasRole('ICPDP')")
    @Operation(summary = "Lay lich su bao cao da duyet/tu choi")
    public ResponseEntity<List<Event>> getReportReviewedEvents() {
        return ResponseEntity.ok(eventService.getReportReviewedEvents());
    }

    @PatchMapping("/{eventId}/reject-report")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<Map<String, String>> rejectReport(
            @PathVariable Integer eventId,
            @Valid @RequestBody ReportRejectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        contributionBatchService.rejectReport(eventId, request.getReason(), currentUser == null ? null : currentUser.getUserId());
        return ResponseEntity.ok(Map.of("message", "Report rejected."));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventDetailResponse> getEventById(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getPublicEventDetail(eventId));
    }

    @GetMapping("/{eventId}/manage")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    @Operation(summary = "Lay chi tiet event cho quan tri")
    public ResponseEntity<EventDetailResponse> getManagedEventById(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.getManagedEventDetail(eventId, currentUser));
    }

    @GetMapping("/{eventId}/my-status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> getMyStatus(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean registered = eventRegistrationService.isUserRegistered(eventId, currentUser.getUserId());
        boolean assigned = eventService.isUserAssigned(eventId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of("registered", registered, "assigned", assigned));
    }

    @GetMapping("/{eventId}/registration-policy")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lay registration policy cua event")
    public ResponseEntity<List<com.fptu.fcms.dto.response.EventRegistrationPolicyResponse>> getRegistrationPolicy(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventService.getRegistrationPolicies(eventId, currentUser));
    }

    @GetMapping("/my-assignments")
    @PreAuthorize("isAuthenticated()")
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

    @PutMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> updateEvent(
            @PathVariable Integer eventId,
            @RequestBody @Valid com.fptu.fcms.dto.request.UpdateEventRequest request) {
        eventService.updateEvent(eventId, request);
        return ResponseEntity.ok(Map.of("message", "Event updated successfully."));
    }

    /**
     * Xóa mềm một sự kiện đang ở trạng thái Draft hoặc Rejected.
     * Chỉ người tạo bản nháp mới được xóa (kiểm tra trong service).
     */
    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    @Operation(summary = "Xoa ban nhap event (Draft/Rejected)")
    public ResponseEntity<Map<String, String>> deleteDraftEvent(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.deleteDraftEvent(eventId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully."));
    }

    @PatchMapping("/{eventId}/submit")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> submitEventProposal(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.submitEventProposal(eventId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Event proposal submitted successfully."));
    }

    @RequestMapping(value = {"/{eventId}/registration/open", "/{eventId}/open-registration"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP')")
    @Operation(summary = "Mo dang ky event")
    public ResponseEntity<Map<String, String>> openRegistration(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.openRegistration(eventId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Registration opened successfully."));
    }

    @RequestMapping(value = {"/{eventId}/registration/close", "/{eventId}/close-registration"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP')")
    @Operation(summary = "Dong dang ky event")
    public ResponseEntity<Map<String, String>> closeRegistration(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventService.closeRegistration(eventId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Registration closed successfully."));
    }

    @PatchMapping("/{eventId}/start")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> startEvent(
            @PathVariable Integer eventId) {
        eventService.startEvent(eventId);
        return ResponseEntity.ok(Map.of("message", "Event started successfully."));
    }

    @PatchMapping({"/{eventId}/finish", "/{eventId}/end"})
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> finishEvent(
            @PathVariable Integer eventId) {
        eventService.finishEvent(eventId);
        return ResponseEntity.ok(Map.of("message", "Event finished successfully."));
    }

    @PatchMapping("/{eventId}/close")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<Map<String, String>> closeEvent(
            @PathVariable Integer eventId) {
        eventService.closeEvent(eventId);
        return ResponseEntity.ok(Map.of("message", "Event closed successfully."));
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

    @PostMapping("/{eventId}/check-in/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> checkIn(
            @PathVariable Integer eventId,
            @PathVariable String studentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String fullName = eventService.checkIn(eventId, studentId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Check-in successful.", "fullName", fullName, "studentId", studentId));
    }

    @GetMapping("/{eventId}/check-in")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<List<Map<String, Object>>> getCheckedInAttendees(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getCheckedInAttendees(eventId));
    }

    @GetMapping("/{eventId}/contributions")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<List<com.fptu.fcms.dto.response.ContributionDTO>> getContributions(
            @PathVariable Integer eventId) {
        return ResponseEntity.ok(contributionBatchService.getContributionScores(eventId));
    }

    @PostMapping("/{eventId}/contributions")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> saveContributions(
            @PathVariable Integer eventId,
            @RequestBody List<com.fptu.fcms.dto.response.ContributionDTO> contributions,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        contributionBatchService.saveContributionScores(eventId, contributions, currentUser == null ? null : currentUser.getUserId());
        return ResponseEntity.ok(Map.of("message", "Contributions saved successfully."));
    }

    @PatchMapping("/{eventId}/contributions")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> patchContributions(
            @PathVariable Integer eventId,
            @RequestBody List<com.fptu.fcms.dto.response.ContributionDTO> contributions,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        contributionBatchService.saveContributionScores(eventId, contributions, currentUser == null ? null : currentUser.getUserId());
        return ResponseEntity.ok(Map.of("message", "Contributions saved successfully."));
    }

    @PatchMapping("/{eventId}/contributions/emergency-override")
    @PreAuthorize("hasAnyRole('ICPDP', 'Admin')")
    public ResponseEntity<com.fptu.fcms.dto.response.ContributionDTO> emergencyOverrideContribution(
            @PathVariable Integer eventId,
            @Valid @RequestBody ContributionEmergencyOverrideRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(contributionBatchService.emergencyOverrideContribution(
                eventId,
                request,
                currentUser == null ? null : currentUser.getUserId()
        ));
    }

    @PostMapping("/{eventId}/assignments")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<Map<String, String>> addAssignment(
            @PathVariable Integer eventId,
            @RequestBody EventAssignmentRequest request) {
        eventService.addAssignment(eventId, request);
        return ResponseEntity.ok(Map.of("message", "Assignment created successfully."));
    }

    @PostMapping("/{eventId}/check-in-staff/{userId}")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<Map<String, String>> assignCheckInStaff(
            @PathVariable Integer eventId,
            @PathVariable Integer userId) {
        eventService.assignCheckInStaff(eventId, userId);
        return ResponseEntity.ok(Map.of("message", "Check-in staff assigned successfully."));
    }

    @GetMapping("/{eventId}/assignments")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<List<EventAssignment>> getAssignments(@PathVariable Integer eventId) {
        return ResponseEntity.ok(eventService.getAssignments(eventId));
    }

    @DeleteMapping("/{eventId}/check-in-staff/{userId}")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<Map<String, String>> revokeCheckInStaff(
            @PathVariable Integer eventId,
            @PathVariable Integer userId) {
        eventService.revokeCheckInStaff(eventId, userId);
        return ResponseEntity.ok(Map.of("message", "Check-in staff revoked successfully."));
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
