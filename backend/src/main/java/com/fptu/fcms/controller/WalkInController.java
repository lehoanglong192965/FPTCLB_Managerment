package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.request.WalkInFptuRequest;
import com.fptu.fcms.dto.request.WalkInGuestEmergencyOverrideRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.WalkInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/attendance-sessions/{sessionId}/walk-ins", "/api/attendance-sessions/{sessionId}/walk-ins"})
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WalkInController {

    private final WalkInService walkInService;

    @PostMapping("/fptu")
    public ResponseEntity<AttendanceCheckInResponse> fptu(
            @PathVariable Integer sessionId,
            @Valid @RequestBody WalkInFptuRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(walkInService.walkInFptu(sessionId, request, principal));
    }

    @PostMapping("/guest")
    public ResponseEntity<GuestRegistrationResponse> guest(
            @PathVariable Integer sessionId,
            @Valid @RequestBody GuestRegistrationRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(walkInService.walkInGuest(sessionId, request, principal));
    }

    @PostMapping("/guest/emergency-override")
    public ResponseEntity<AttendanceCheckInResponse> guestEmergencyOverride(
            @PathVariable Integer sessionId,
            @Valid @RequestBody WalkInGuestEmergencyOverrideRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(walkInService.emergencyGuestOverride(sessionId, request, principal));
    }
}
