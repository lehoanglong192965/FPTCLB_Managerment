package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.FeedbackSubmitRequest;
import com.fptu.fcms.dto.response.FeedbackCompetitionInput;
import com.fptu.fcms.dto.response.FeedbackEligibilityResponse;
import com.fptu.fcms.dto.response.FeedbackGuestTokenResponse;
import com.fptu.fcms.dto.response.FeedbackSubmitResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping({"/v1/events/{eventId}/feedback/eligibility", "/events/{eventId}/feedback/eligibility"})
    public ResponseEntity<FeedbackEligibilityResponse> checkEligibility(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(feedbackService.checkEligibility(eventId, principal == null ? null : principal.getUserId()));
    }

    @PostMapping({"/events/{eventId}/feedbacks", "/v1/events/{eventId}/feedback", "/v1/events/{eventId}/feedbacks"})
    public ResponseEntity<FeedbackSubmitResponse> submitFptu(
            @PathVariable Integer eventId,
            @Valid @RequestBody FeedbackSubmitRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(feedbackService.submitFptu(eventId, request, principal == null ? null : principal.getUserId()));
    }

    @GetMapping({"/guest-feedback/{feedbackToken}", "/v1/feedback/guest/{feedbackToken}"})
    public ResponseEntity<FeedbackGuestTokenResponse> validateGuestToken(@PathVariable String feedbackToken) {
        return ResponseEntity.ok(feedbackService.validateGuestToken(feedbackToken));
    }

    @PostMapping({"/guest-feedback/{feedbackToken}", "/v1/feedback/guest/{feedbackToken}"})
    public ResponseEntity<FeedbackSubmitResponse> submitGuest(
            @PathVariable String feedbackToken,
            @Valid @RequestBody FeedbackSubmitRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feedbackService.submitGuest(feedbackToken, request));
    }

    @GetMapping({"/events/{eventId}/feedback-summary", "/v1/events/{eventId}/feedback/summary", "/v1/events/{eventId}/feedback-summary"})
    public ResponseEntity<FeedbackCompetitionInput> summary(@PathVariable Integer eventId) {
        return ResponseEntity.ok(feedbackService.summary(eventId));
    }
}
