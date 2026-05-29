package com.fptu.fcms.membership.controller;

import com.fptu.fcms.membership.dto.RecruitmentSubmitResponse;
import com.fptu.fcms.membership.service.RecruitmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/recruitments")
@RequiredArgsConstructor
public class RecruitmentController {

    private final RecruitmentService recruitmentService;

    @PostMapping("/{id}/submit")
    public ResponseEntity<RecruitmentSubmitResponse> submitApplication(
            @PathVariable("id") Long applicationId,
            @AuthenticationPrincipal OAuth2User principal) {

        // Retrieve current logged in user identifier.
        // Falls back to mock id 1001L for development testing if security principal is absent.
        Long currentUserId = getCurrentUserId(principal);

        RecruitmentSubmitResponse response = recruitmentService.submitApplication(applicationId, currentUserId);
        return ResponseEntity.ok(response);
    }

    private Long getCurrentUserId(OAuth2User principal) {
        if (principal != null) {
            // In a real application, you'd lookup the User entity in the DB by email
            // String email = principal.getAttribute("email");
            // For now, return mock user ID or standard development fallback
        }
        return 1001L;
    }
}
