package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventRegistrationService;
import jakarta.validation.Valid;
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
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, String>> registerEvent(
            @PathVariable Integer eventId,
            @RequestParam(required = false) Integer userID,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Integer resolvedUserID = currentUser != null ? currentUser.getUserId() : userID;
        if (resolvedUserID == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Cần userID nếu chưa đăng nhập."));
        }

        eventRegistrationService.registerEvent(eventId, resolvedUserID);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đăng ký sự kiện thành công!"));
    }

    @PostMapping("/register-guest/{eventId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, String>> registerGuestEvent(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventGuestRegistrationRequest request) {
        eventRegistrationService.registerGuestEvent(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Guest registration successful!"));
    }

    @DeleteMapping("/unregister/{eventId}")
    @PreAuthorize("hasAnyRole('Member')")
    public ResponseEntity<Map<String, String>> unregisterEvent(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Integer userID = currentUser.getUserId();
        eventRegistrationService.unregisterEvent(eventId, userID);
        return ResponseEntity.ok(Map.of("message", "Hủy đăng ký sự kiện thành công!"));
    }

    @GetMapping("/my-registrations")
    @PreAuthorize("hasAnyRole('Member')")
    public ResponseEntity<?> getMyRegistrations(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventRegistrationService.getEventsByUserRegistered(currentUser.getUserId()));
    }
}
