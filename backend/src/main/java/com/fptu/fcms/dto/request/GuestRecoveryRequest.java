package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuestRecoveryRequest {
    @NotBlank
    private String registrationCode;
    @NotBlank
    @Email
    private String email;
}
