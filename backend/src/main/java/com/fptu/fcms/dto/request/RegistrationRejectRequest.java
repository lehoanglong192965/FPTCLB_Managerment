package com.fptu.fcms.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request to reject a registration")
public class RegistrationRejectRequest {
    @Schema(description = "Reason for rejection", example = "Missing club membership")
    @NotBlank
    private String reason;
}
