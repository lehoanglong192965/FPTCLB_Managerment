package com.fptu.fcms.controller;

import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/event-registrations")
@RequiredArgsConstructor
public class EventRegistrationController {

    private final EventRegistrationService eventRegistrationService;

    @PostMapping("/register/{eventId}")
    @PreAuthorize("hasAnyRole('Member')")

    public ResponseEntity<Map<String, String>> registerEvent(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        Integer userID = currentUser.getUserId();
        eventRegistrationService.registerEvent(eventId, userID);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đăng ký sự kiện thành công!"));
    }


    @DeleteMapping("/unregister/{eventId}")

    @PreAuthorize("hasAnyRole('Member')") // Chỉ thành viên mới được hủy đăng ký

    public ResponseEntity<Map<String, String>> unregisterEvent(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        Integer userID = currentUser.getUserId();
        eventRegistrationService.unregisterEvent(eventId, userID);
        return ResponseEntity.ok(Map.of("message", "Hủy đăng ký sự kiện thành công!"));
    }
}
