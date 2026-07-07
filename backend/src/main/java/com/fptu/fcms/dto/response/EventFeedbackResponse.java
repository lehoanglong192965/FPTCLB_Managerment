package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class EventFeedbackResponse {
    private Integer feedbackId;
    private Integer eventId;
    private Integer registrationId;
    private Integer contentRating;
    private Integer organizationRating;
    private Integer logisticsRating;
    private Integer overallRating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
