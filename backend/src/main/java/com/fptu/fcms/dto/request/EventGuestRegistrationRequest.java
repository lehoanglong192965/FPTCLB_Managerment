package com.fptu.fcms.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Guest registration payload")
public class EventGuestRegistrationRequest {
    @Schema(description = "Guest full name", example = "Nguyen Van A")
    @NotBlank
    @Size(max = 150)
    private String fullName;

    @Schema(description = "Guest email", example = "guest@example.com")
    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @Schema(description = "Guest phone number", example = "0901234567")
    @NotBlank
    @Pattern(regexp = "^[0-9+()\\-\\s]{8,20}$")
    private String phone;
}
