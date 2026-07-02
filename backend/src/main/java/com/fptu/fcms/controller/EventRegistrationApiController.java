package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.EventWalkInRegistrationRequest;
import com.fptu.fcms.dto.request.EventGuestRegistrationRequest;
import com.fptu.fcms.dto.request.RegistrationRejectRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.dto.response.RegistrationPageResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Event Registration", description = "API dang ky, duyet, va huy dang ky su kien")
public class EventRegistrationApiController {

    private final EventRegistrationService eventRegistrationService;

    @PostMapping({"/api/events/{eventId}/registrations/me", "/api/v1/events/{eventId}/registrations/me"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Dang ky su kien cho tai khoan hien tai")
    public ResponseEntity<Map<String, String>> registerMe(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventRegistrationService.registerEvent(eventId, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registration submitted."));
    }

    @GetMapping({"/api/registrations/me/events", "/api/v1/registrations/me/events"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lay danh sach su kien da dang ky cua toi")
    public ResponseEntity<List<Event>> getMyRegistrations(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventRegistrationService.getEventsByUserRegistered(currentUser.getUserId()));
    }

    @PostMapping({"/api/events/{eventId}/registrations/guest", "/api/v1/events/{eventId}/registrations/guest"})
    @PreAuthorize("permitAll()")
    @Operation(summary = "Dang ky khach moi")
    public ResponseEntity<Map<String, String>> registerGuest(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventGuestRegistrationRequest request) {
        eventRegistrationService.registerGuestEvent(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Guest registration submitted for approval."));
    }

    @PostMapping({"/api/events/{eventId}/registrations/walk-in", "/api/v1/events/{eventId}/registrations/walk-in"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tao dang ky walk-in")
    public ResponseEntity<Map<String, String>> registerWalkIn(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventWalkInRegistrationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventRegistrationService.registerWalkInEvent(eventId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Walk-in registration submitted."));
    }

    @GetMapping({"/api/events/{eventId}/registrations", "/api/v1/events/{eventId}/registrations"})
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    @Operation(summary = "Danh sach dang ky theo event")
    public ResponseEntity<RegistrationPageResponse> listRegistrations(
            @PathVariable Integer eventId,
            @RequestParam(required = false) String participantType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "registeredAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventRegistrationService.getRegistrations(
                eventId,
                participantType,
                status,
                keyword,
                page,
                size,
                sortBy,
                sortDir,
                currentUser
        ));
    }

    @GetMapping({"/api/events/{eventId}/registrations/pending", "/api/v1/events/{eventId}/registrations/pending"})
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    @Operation(summary = "Danh sach dang ky cho duyet")
    public ResponseEntity<RegistrationPageResponse> listPendingRegistrations(
            @PathVariable Integer eventId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "registeredAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(eventRegistrationService.getRegistrations(
                eventId,
                null,
                "PENDING_APPROVAL",
                keyword,
                page,
                size,
                sortBy,
                sortDir,
                currentUser
        ));
    }

    @PostMapping({"/api/events/{eventId}/registrations/{registrationId}/approve", "/api/v1/events/{eventId}/registrations/{registrationId}/approve"})
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    @Operation(summary = "Duyet dang ky")
    public ResponseEntity<Map<String, String>> approveRegistration(
            @PathVariable Integer eventId,
            @PathVariable Integer registrationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventRegistrationService.approveRegistration(eventId, registrationId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Registration approved."));
    }

    @PostMapping({"/api/events/{eventId}/registrations/{registrationId}/reject", "/api/v1/events/{eventId}/registrations/{registrationId}/reject"})
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader')")
    @Operation(summary = "Tu choi dang ky")
    public ResponseEntity<Map<String, String>> rejectRegistration(
            @PathVariable Integer eventId,
            @PathVariable Integer registrationId,
            @Valid @RequestBody RegistrationRejectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventRegistrationService.rejectRegistration(eventId, registrationId, request, currentUser);
        return ResponseEntity.ok(Map.of("message", "Registration rejected."));
    }

    @PostMapping({"/api/registrations/{registrationId}/cancel", "/api/v1/registrations/{registrationId}/cancel"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Huy dang ky cua chinh minh")
    public ResponseEntity<Map<String, String>> cancelRegistration(
            @PathVariable Integer registrationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        eventRegistrationService.cancelRegistration(registrationId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Registration cancelled."));
    }
}
