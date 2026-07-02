package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.AttendanceCheckInRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/attendance-sessions", "/api/attendance-sessions"})
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/{sessionId}/check-ins")
    public ResponseEntity<AttendanceCheckInResponse> checkIn(
            @PathVariable Integer sessionId,
            @Valid @RequestBody AttendanceCheckInRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer actorId = principal == null ? null : principal.getUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.checkIn(sessionId, request, actorId));
    }
}
