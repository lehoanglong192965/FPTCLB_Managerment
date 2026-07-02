package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuestOtpVerifyRequest {
    @NotBlank
    @Size(min = 4, max = 12)
    private String otp;
}