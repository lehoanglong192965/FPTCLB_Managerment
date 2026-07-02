package com.fptu.fcms.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Walk-in registration payload")
public class EventWalkInRegistrationRequest {
    @Schema(description = "Participant full name", example = "Nguyen Van A")
    @NotBlank
    @Size(max = 150)
    private String fullName;

    @Schema(description = "Participant email", example = "participant@example.com")
    @Size(max = 255)
    private String email;

    @Schema(description = "Participant phone", example = "0901234567")
    @Size(max = 20)
    private String phone;
}
