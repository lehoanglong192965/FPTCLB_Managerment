package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class EventFeedbackReportResponse {
    private Integer eventId;
    private String eventName;
    private long totalFeedback;
    private double avgContentRating;
    private double avgOrganizationRating;
    private double avgLogisticsRating;
    private double avgOverallRating;
    private List<FeedbackItem> feedbackItems;

    @Getter
    @AllArgsConstructor
    public static class FeedbackItem {
        private Integer feedbackId;
        private Integer registrationId;
        private Integer guestRegistrationId;
        private String respondentType;
        private String respondentName;
        private String respondentEmail;
        private Integer contentRating;
        private Integer organizationRating;
        private Integer logisticsRating;
        private Integer overallRating;
        private String comment;
        private LocalDateTime createdAt;
    }
}
