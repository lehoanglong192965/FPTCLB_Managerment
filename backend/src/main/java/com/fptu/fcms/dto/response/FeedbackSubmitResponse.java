package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FeedbackSubmitResponse {
    private Integer feedbackId;
    private Integer eventId;
    private Integer registrationId;
    private Integer guestRegistrationId;
    private boolean includedInExternalScore;
    private LocalDateTime submittedAt;
}