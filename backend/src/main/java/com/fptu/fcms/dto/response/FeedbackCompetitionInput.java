package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.FeedbackAssessmentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FeedbackCompetitionInput {
    private Integer eventId;
    private Integer clubId;
    private long eligibleExternalPresentCount;
    private long externalFeedbackResponseCount;
    private double externalFeedbackResponseRate;
    private double averageOverallRating;
    private long positiveFeedbackCount;
    private double positiveFeedbackRate;
    private FeedbackAssessmentStatus feedbackAssessmentStatus;
    private int minimumEligiblePresentCountUsed;
    private int minimumResponseCountUsed;
    private double goodAverageRatingThresholdUsed;
    private double goodPositiveFeedbackRateThresholdUsed;
    private LocalDateTime calculatedAt;
}
