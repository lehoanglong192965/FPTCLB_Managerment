package com.fptu.fcms.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyOTPRequest {
    private String email;
    private String otpCode;
}

