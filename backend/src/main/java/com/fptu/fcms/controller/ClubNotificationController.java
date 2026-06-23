package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.CreateNotificationRequest;
import com.fptu.fcms.dto.response.NotificationResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubNotificationService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubNotificationController {

    private final ClubNotificationService clubNotificationService;

    @PostMapping("/{clubId}/notifications")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Leader gửi thông báo đến thành viên CLB")
    public ResponseEntity<NotificationResponse> createNotification(
            @PathVariable Integer clubId,
            @Valid @RequestBody CreateNotificationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        NotificationResponse response = clubNotificationService.createNotification(clubId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}