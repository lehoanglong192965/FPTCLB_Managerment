package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.AppealCreateRequest;
import com.fptu.fcms.dto.request.AppealResolveRequest;
import com.fptu.fcms.dto.request.ReportRejectRequest;
import com.fptu.fcms.dto.response.AppealResponse;
import com.fptu.fcms.dto.response.ContributionBatchResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ContributionBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1", "/api"})
@RequiredArgsConstructor
public class ContributionBatchController {

    private final ContributionBatchService contributionBatchService;

    @PatchMapping({"/events/{eventId}/approve-report", "/events/{eventId}/report/approve"})
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<ContributionBatchResponse> approveReport(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(contributionBatchService.approveReportAndCreateBatch(eventId, userId(principal)));
    }

    @PatchMapping("/events/{eventId}/report/reject")
    @PreAuthorize("hasRole('ICPDP')")
    public ResponseEntity<Void> rejectReport(
            @PathVariable Integer eventId,
            @Valid @RequestBody ReportRejectRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        contributionBatchService.rejectReport(eventId, request.getReason(), userId(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/events/{eventId}/contribution-batch")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<ContributionBatchResponse> getBatch(@PathVariable Integer eventId) {
        return ResponseEntity.ok(contributionBatchService.getBatchByEvent(eventId));
    }

    @PostMapping("/events/{eventId}/contribution-batch/open-appeal")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<ContributionBatchResponse> openAppeal(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(contributionBatchService.openAppealWindow(eventId, userId(principal)));
    }

    @PostMapping("/events/{eventId}/contribution-batch/finalize")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<ContributionBatchResponse> finalizeBatch(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(contributionBatchService.finalizeBatch(eventId, userId(principal)));
    }

    @GetMapping("/contribution-batches/{batchId}/appeals")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<List<AppealResponse>> getAppeals(@PathVariable Integer batchId) {
        return ResponseEntity.ok(contributionBatchService.getAppeals(batchId));
    }

    @PostMapping("/contribution-batches/{batchId}/appeals")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppealResponse> createAppeal(
            @PathVariable Integer batchId,
            @Valid @RequestBody AppealCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(contributionBatchService.createAppeal(batchId, request, userId(principal)));
    }

    @PatchMapping("/contribution-appeals/{appealId}/resolve")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<AppealResponse> resolveAppeal(
            @PathVariable Integer appealId,
            @Valid @RequestBody AppealResolveRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(contributionBatchService.resolveAppeal(appealId, request, userId(principal)));
    }

    private Integer userId(UserPrincipal principal) {
        return principal == null ? null : principal.getUserId();
    }
}
