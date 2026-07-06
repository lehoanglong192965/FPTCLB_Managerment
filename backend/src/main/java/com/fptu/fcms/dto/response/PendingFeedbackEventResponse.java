package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PendingFeedbackEventResponse {
    private Integer eventId;
    private String eventName;
    private Integer clubId;
    private Integer registrationId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime feedbackOpensAt;
    private LocalDateTime feedbackClosesAt;
}
