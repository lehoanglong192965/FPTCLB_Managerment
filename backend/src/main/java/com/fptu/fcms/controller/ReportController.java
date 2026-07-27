package com.fptu.fcms.controller;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;
import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.dto.response.EventReportStatisticsResponse;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AutomaticEventReportService;
import com.fptu.fcms.service.ReportUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AutomaticEventReportService automaticEventReportService;
    private final ReportUploadService reportUploadService;

    // ── MANUAL UPLOAD & STATISTICS ENDPOINTS ────────────────────────────

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP')")
    public ResponseEntity<EventReport> getByEventId(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return reportUploadService.getReportByEventId(eventId, currentUser)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(null));
    }

    @GetMapping("/event/{eventId}/statistics")
    @PreAuthorize("hasAnyRole('ICPDP', 'Leader', 'ViceLeader')")
    public ResponseEntity<EventReportStatisticsResponse> getStatistics(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reportUploadService.getStatistics(eventId, currentUser));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> submitReport(
            @Valid @ModelAttribute CreateEventReportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportUploadService.uploadEventReport(request, currentUser));
    }

    // ── AUTOMATIC REPORTING ENDPOINTS ───────────────────────────────────

    @GetMapping("/event/{eventId}/auto-data")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<EventReportSnapshot> getAutoData(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(automaticEventReportService.getAutoData(eventId, currentUser));
    }

    @PostMapping(value = "/event/{eventId}/auto-preview", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<byte[]> previewAuto(
            @PathVariable Integer eventId,
            @Valid @RequestBody(required = false) AutomaticEventReportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        byte[] pdfBytes = automaticEventReportService.previewAuto(eventId, request, currentUser);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline()
                .filename("event-report-preview-" + eventId + ".pdf", StandardCharsets.UTF_8)
                .build());
        headers.setCacheControl("no-store, no-cache, must-revalidate");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @PostMapping("/event/{eventId}/auto-submit")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    public ResponseEntity<Map<String, String>> submitAuto(
            @PathVariable Integer eventId,
            @Valid @RequestBody(required = false) AutomaticEventReportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(automaticEventReportService.submitAuto(eventId, request, currentUser));
    }
}
