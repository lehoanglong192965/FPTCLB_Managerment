package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.AttendanceCorrectionRequest;
import com.fptu.fcms.dto.request.AttendanceSessionRequest;
import com.fptu.fcms.dto.response.AttendanceRegistrationSearchResponse;
import com.fptu.fcms.dto.response.AttendanceSessionResponse;
import com.fptu.fcms.dto.response.AttendanceSummaryResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AttendanceSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1", "/api"})
@RequiredArgsConstructor
public class AttendanceSessionController {

    private final AttendanceSessionService attendanceSessionService;

    @PostMapping("/events/{eventId}/attendance-sessions")
    public ResponseEntity<AttendanceSessionResponse> create(
            @PathVariable Integer eventId,
            @Valid @RequestBody AttendanceSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attendanceSessionService.create(eventId, request, userId(principal)));
    }

    @PutMapping("/attendance-sessions/{sessionId}")
    public ResponseEntity<AttendanceSessionResponse> update(
            @PathVariable Integer sessionId,
            @Valid @RequestBody AttendanceSessionRequest request
    ) {
        return ResponseEntity.ok(attendanceSessionService.update(sessionId, request));
    }


    @GetMapping("/events/{eventId}/attendance-session")
    public ResponseEntity<AttendanceSessionResponse> getByEvent(@PathVariable Integer eventId) {
        return ResponseEntity.ok(attendanceSessionService.getByEvent(eventId));
    }
    @PostMapping("/attendance-sessions/{sessionId}/open")
    public ResponseEntity<AttendanceSessionResponse> open(
            @PathVariable Integer sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(attendanceSessionService.open(sessionId, userId(principal)));
    }

    @PostMapping("/attendance-sessions/{sessionId}/close")
    public ResponseEntity<AttendanceSessionResponse> close(
            @PathVariable Integer sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(attendanceSessionService.close(sessionId, userId(principal)));
    }

    @GetMapping("/attendance-sessions/{sessionId}/registrations/search")
    public ResponseEntity<List<AttendanceRegistrationSearchResponse>> search(
            @PathVariable Integer sessionId,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(attendanceSessionService.searchRegistrations(sessionId, keyword));
    }

    @GetMapping("/attendance-sessions/{sessionId}/registrations/{registrationId}/preview")
    public ResponseEntity<AttendanceRegistrationSearchResponse> preview(
            @PathVariable Integer sessionId,
            @PathVariable Integer registrationId
    ) {
        return ResponseEntity.ok(attendanceSessionService.preview(sessionId, registrationId));
    }

    @GetMapping("/events/{eventId}/attendance-summary")
    public ResponseEntity<AttendanceSummaryResponse> summary(@PathVariable Integer eventId) {
        return ResponseEntity.ok(attendanceSessionService.summary(eventId));
    }

    @PatchMapping("/attendance-records/{attendanceRecordId}")
    public ResponseEntity<AttendanceRegistrationSearchResponse> correct(
            @PathVariable Integer attendanceRecordId,
            @Valid @RequestBody AttendanceCorrectionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(attendanceSessionService.correct(attendanceRecordId, request, userId(principal)));
    }

    private Integer userId(UserPrincipal principal) {
        return principal == null ? null : principal.getUserId();
    }
}
