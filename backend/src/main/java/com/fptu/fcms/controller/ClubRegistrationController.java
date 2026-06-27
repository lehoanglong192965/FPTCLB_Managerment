package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.ReviewRegistrationRequestDTO;
import com.fptu.fcms.dto.response.ClubRegistrationResponseDTO;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.ClubRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs/registrations")
@RequiredArgsConstructor
public class ClubRegistrationController {

    @Qualifier("clubRegistrationServiceImpl")
    private final ClubRegistrationService registrationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    public ResponseEntity<ClubRegistrationResponseDTO> submitRegistration(
            @Valid @RequestBody ClubRegistrationRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ClubRegistrationResponseDTO response = registrationService.submitRegistration(request, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    public ResponseEntity<List<ClubRegistrationResponseDTO>> getRegistrations(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(registrationService.getRegistrations(status));
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
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    public ResponseEntity<ClubRegistrationResponseDTO> getRegistrationById(@PathVariable Integer id) {
        ClubRegistrationResponseDTO response = registrationService.getRegistrationById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('Admin', 'ICPDP')")
    public ResponseEntity<ClubRegistrationResponseDTO> reviewRegistration(
            @PathVariable Integer id,
            @Valid @RequestBody ReviewRegistrationRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ClubRegistrationResponseDTO response = registrationService.reviewRegistration(id, request, currentUser.getUserId());
        return ResponseEntity.ok(response);
    }
}
