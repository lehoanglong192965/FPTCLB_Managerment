package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EventGuestRegistrationRequest {
    @NotBlank
    @Size(max = 150)
    private String fullName;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank
    @Pattern(regexp = "^[0-9+()\\-\\s]{8,20}$")
    private String phone;
}
