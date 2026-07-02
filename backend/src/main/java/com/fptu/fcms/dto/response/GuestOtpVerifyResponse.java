package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GuestOtpVerifyResponse {
    private Integer registrationId;
    private String registrationStatus;
    private String message;
}