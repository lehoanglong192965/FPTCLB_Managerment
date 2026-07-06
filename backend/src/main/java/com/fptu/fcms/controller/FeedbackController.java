package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.EventFeedbackRequest;
import com.fptu.fcms.dto.request.FeedbackSubmitRequest;
import com.fptu.fcms.dto.response.EventFeedbackReportResponse;
import com.fptu.fcms.dto.response.EventFeedbackResponse;
import com.fptu.fcms.dto.response.FeedbackCompetitionInput;
import com.fptu.fcms.dto.response.FeedbackEligibilityResponse;
import com.fptu.fcms.dto.response.FeedbackGuestTokenResponse;
import com.fptu.fcms.dto.response.FeedbackSubmitResponse;
import com.fptu.fcms.dto.response.PendingFeedbackEventResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Value("${fcms.feedback.public-base-url:http://localhost:5173/feedback/guest}")
    private String publicFeedbackBaseUrl;

    @GetMapping("/events/pending-feedback")
    public ResponseEntity<List<PendingFeedbackEventResponse>> pendingFeedback(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(feedbackService.getPendingFeedbackEvents(principal == null ? null : principal.getUserId()));
    }

    @PostMapping("/events/{eventId}/feedback")
    public ResponseEntity<EventFeedbackResponse> submitEventFeedback(
            @PathVariable Integer eventId,
            @Valid @RequestBody EventFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(feedbackService.submitEventFeedback(eventId, request, principal == null ? null : principal.getUserId()));
    }

    @GetMapping("/events/{eventId}/feedback-report")
    @PreAuthorize("hasAnyRole('Leader', 'ViceLeader', 'ICPDP', 'Admin')")
    public ResponseEntity<EventFeedbackReportResponse> feedbackReport(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(feedbackService.getFeedbackReport(eventId, principal));
    }

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

    @GetMapping("/guest-feedback/{feedbackToken}")
    public ResponseEntity<Void> redirectGuestFeedback(@PathVariable String feedbackToken) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(buildGuestFeedbackLink(feedbackToken)))
                .build();
    }

    @GetMapping("/v1/feedback/guest/{feedbackToken}")
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

    private String buildGuestFeedbackLink(String feedbackToken) {
        String base = publicFeedbackBaseUrl == null || publicFeedbackBaseUrl.isBlank()
                ? "http://localhost:5173/feedback/guest"
                : publicFeedbackBaseUrl.trim();
        return base.endsWith("/") ? base + feedbackToken : base + "/" + feedbackToken;
    }

    @GetMapping({"/events/{eventId}/feedback-summary", "/v1/events/{eventId}/feedback/summary", "/v1/events/{eventId}/feedback-summary"})
    public ResponseEntity<FeedbackCompetitionInput> summary(@PathVariable Integer eventId) {
        return ResponseEntity.ok(feedbackService.summary(eventId));
    }
}

