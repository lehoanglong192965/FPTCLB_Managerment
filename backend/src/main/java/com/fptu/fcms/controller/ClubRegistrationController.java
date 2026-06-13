package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.ReviewRegistrationRequestDTO;
import com.fptu.fcms.dto.response.ClubRegistrationResponseDTO;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs/registrations")
@RequiredArgsConstructor
public class ClubRegistrationController {

    private final ClubRegistrationService registrationService;

    @PostMapping
    public ResponseEntity<?> submitRegistration(
            @Valid @RequestBody ClubRegistrationRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            ClubRegistrationResponseDTO response = registrationService.submitRegistration(request, currentUser.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (BusinessRuleException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<ClubRegistrationResponseDTO>> getMyRegistrations(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(registrationService.getMyRegistrations(currentUser.getUserId()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    public ResponseEntity<List<ClubRegistrationResponseDTO>> getPendingRegistrations() {
        return ResponseEntity.ok(registrationService.getPendingRegistrations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRegistrationById(@PathVariable Integer id) {
        try {
            ClubRegistrationResponseDTO response = registrationService.getRegistrationById(id);
            return ResponseEntity.ok(response);
        } catch (BusinessRuleException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    public ResponseEntity<?> reviewRegistration(
            @PathVariable Integer id,
            @Valid @RequestBody ReviewRegistrationRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        try {
            ClubRegistrationResponseDTO response = registrationService.reviewRegistration(id, request, currentUser.getUserId());
            return ResponseEntity.ok(response);
        } catch (BusinessRuleException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
