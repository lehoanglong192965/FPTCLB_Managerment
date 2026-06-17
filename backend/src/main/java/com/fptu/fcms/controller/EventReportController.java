package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.EventReportUploadRequest;
import com.fptu.fcms.dto.response.EventReportResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@Tag(name = "Event Reports", description = "API upload báo cáo sự kiện")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class EventReportController {

    private final EventReportService eventReportService;

    @PostMapping("/{eventId}/reports")
    @PreAuthorize("hasAnyRole('Leader','Admin','ICPDP')")
    @Operation(summary = "Upload báo cáo tổng kết sự kiện")
    public ResponseEntity<EventReportResponse> uploadReport(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventReportUploadRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(
                eventReportService.uploadReport(eventId, request, currentUser.getUserId())
        );
    }
}
