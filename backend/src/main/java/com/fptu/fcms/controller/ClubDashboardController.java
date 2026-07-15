package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ClubEvaluationRequest;
import com.fptu.fcms.dto.response.ClubDashboardResponse;
import com.fptu.fcms.dto.response.ClubEvaluationResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clubs/{clubId}")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Club Dashboard", description = "Dashboard KPI and ICPDP evaluation APIs")
public class ClubDashboardController {

    private final ClubDashboardService clubDashboardService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP', 'Leader', 'ViceLeader')")
    @Operation(summary = "Get club dashboard by semester")
    public ResponseEntity<ClubDashboardResponse> getDashboard(
            @PathVariable Integer clubId,
            @RequestParam(required = false) Integer semesterId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(clubDashboardService.getDashboard(clubId, semesterId, currentUser));
    }

    @GetMapping("/dashboard/warnings")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP', 'Leader', 'ViceLeader')")
    @Operation(summary = "Get dashboard warnings")
    public ResponseEntity<List<ClubDashboardResponse.DashboardWarning>> getWarnings(
            @PathVariable Integer clubId,
            @RequestParam(required = false) Integer semesterId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(clubDashboardService.getWarnings(clubId, semesterId, currentUser));
    }

    @GetMapping("/evaluations")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP', 'Leader', 'ViceLeader')")
    @Operation(summary = "Get club evaluation history")
    public ResponseEntity<List<ClubEvaluationResponse>> getEvaluations(
            @PathVariable Integer clubId,
            @RequestParam(required = false) Integer semesterId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(clubDashboardService.getEvaluations(clubId, semesterId, currentUser));
    }

    @PostMapping("/evaluations")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    @Operation(summary = "Create ICPDP club evaluation")
    public ResponseEntity<ClubEvaluationResponse> createEvaluation(
            @PathVariable Integer clubId,
            @Valid @RequestBody ClubEvaluationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clubDashboardService.createEvaluation(clubId, request, currentUser));
    }

    @PutMapping("/evaluations/{evaluationId}")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    @Operation(summary = "Update ICPDP club evaluation")
    public ResponseEntity<ClubEvaluationResponse> updateEvaluation(
            @PathVariable Integer clubId,
            @PathVariable Integer evaluationId,
            @Valid @RequestBody ClubEvaluationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(clubDashboardService.updateEvaluation(clubId, evaluationId, request, currentUser));
    }
}
