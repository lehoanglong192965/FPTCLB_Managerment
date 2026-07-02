package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FeedbackEligibilityResponse {
    private boolean eligible;
    private Integer eventId;
    private Integer registrationId;
    private String reason;
}
