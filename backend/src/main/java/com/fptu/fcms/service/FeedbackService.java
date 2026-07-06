package com.fptu.fcms.service;

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

import java.util.List;

public interface FeedbackService {
    List<PendingFeedbackEventResponse> getPendingFeedbackEvents(Integer userId);

    EventFeedbackResponse submitEventFeedback(Integer eventId, EventFeedbackRequest request, Integer userId);

    EventFeedbackReportResponse getFeedbackReport(Integer eventId, UserPrincipal principal);

    FeedbackEligibilityResponse checkEligibility(Integer eventId, Integer userId);

    FeedbackSubmitResponse submitFptu(Integer eventId, FeedbackSubmitRequest request, Integer userId);

    FeedbackGuestTokenResponse validateGuestToken(String feedbackToken);

    FeedbackSubmitResponse submitGuest(String feedbackToken, FeedbackSubmitRequest request);

    FeedbackCompetitionInput summary(Integer eventId);
}

