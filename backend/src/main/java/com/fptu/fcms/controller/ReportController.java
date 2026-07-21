package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ReportUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {

    private final ReportUploadService reportUploadService;

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> createReport(
            @Valid @ModelAttribute CreateEventReportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportUploadService.uploadEventReport(request, currentUser));
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('ICPDP', 'Leader', 'ViceLeader')")
    public ResponseEntity<EventReport> getReportByEventId(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reportUploadService.getReportByEventId(eventId, currentUser));
    }
}
