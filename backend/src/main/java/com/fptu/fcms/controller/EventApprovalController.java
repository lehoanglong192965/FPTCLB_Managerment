package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.EventApprovalRequest;
import com.fptu.fcms.dto.response.EventApprovalResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventApprovalService;
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
@Tag(name = "Event Approval", description = "API phê duyệt hoặc từ chối sự kiện")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class EventApprovalController {

    private final EventApprovalService eventApprovalService;

    @PutMapping("/{eventId}/approval")
    @PreAuthorize("hasAnyRole('Admin','ICPDP')")
    @Operation(summary = "Phê duyệt hoặc từ chối sự kiện")
    public ResponseEntity<EventApprovalResponse> approveEvent(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventApprovalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(
                eventApprovalService.approveEvent(eventId, request, currentUser.getUserId())
        );
    }
}
