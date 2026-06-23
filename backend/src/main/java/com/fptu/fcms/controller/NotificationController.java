package com.fptu.fcms.controller;

import com.fptu.fcms.dto.response.MyNotificationResponse;
import com.fptu.fcms.dto.response.NotificationPageResponse;
import com.fptu.fcms.dto.response.UnreadNotificationCountResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final ClubNotificationService clubNotificationService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem danh sách thông báo của tài khoản đang đăng nhập")
    public ResponseEntity<NotificationPageResponse> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(clubNotificationService.getMyNotifications(currentUser, keyword, page, size));
    }

    @GetMapping("/me/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đếm số thông báo chưa đọc của tài khoản đang đăng nhập")
    public ResponseEntity<UnreadNotificationCountResponse> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(clubNotificationService.getUnreadCount(currentUser));
    }

    @GetMapping("/{notificationId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem chi tiết thông báo của tài khoản đang đăng nhập")
    public ResponseEntity<MyNotificationResponse> getNotificationDetail(
            @PathVariable Integer notificationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(clubNotificationService.getNotificationDetail(notificationId, currentUser));
    }

    @PutMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu thông báo đã đọc")
    public ResponseEntity<MyNotificationResponse> markAsRead(
            @PathVariable Integer notificationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(clubNotificationService.markAsRead(notificationId, currentUser));
    }
}