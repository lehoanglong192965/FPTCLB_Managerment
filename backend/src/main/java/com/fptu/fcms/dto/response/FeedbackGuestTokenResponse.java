package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FeedbackGuestTokenResponse {
    private boolean valid;
    private Integer eventId;
    private Integer registrationId;
    private Integer guestRegistrationId;
    private LocalDateTime expiresAt;
    private String reason;
}