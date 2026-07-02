package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.FeedbackSubmitRequest;
import com.fptu.fcms.dto.response.FeedbackCompetitionInput;
import com.fptu.fcms.dto.response.FeedbackEligibilityResponse;
import com.fptu.fcms.dto.response.FeedbackGuestTokenResponse;
import com.fptu.fcms.dto.response.FeedbackSubmitResponse;

public interface FeedbackService {
    FeedbackEligibilityResponse checkEligibility(Integer eventId, Integer userId);

    FeedbackSubmitResponse submitFptu(Integer eventId, FeedbackSubmitRequest request, Integer userId);

    FeedbackGuestTokenResponse validateGuestToken(String feedbackToken);

    FeedbackSubmitResponse submitGuest(String feedbackToken, FeedbackSubmitRequest request);

    FeedbackCompetitionInput summary(Integer eventId);
}
