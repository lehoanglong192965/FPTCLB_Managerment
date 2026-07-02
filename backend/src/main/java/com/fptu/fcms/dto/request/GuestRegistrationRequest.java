package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuestRegistrationRequest {
    @NotBlank
    @Size(max = 255)
    private String fullName;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(max = 20)
    private String phone;

    @Size(max = 255)
    private String schoolOrOrganization;

    @AssertTrue(message = "consent must be accepted")
    private boolean consent;

    @NotBlank
    @Size(max = 50)
    private String discoverySource;
}