package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class GuestRegistrationResponse {
    private Integer eventId;
    private Integer registrationId;
    private String registrationStatus;
    private String guestReference;
    private LocalDateTime otpExpiresAt;
    private LocalDateTime resendAvailableAt;
}