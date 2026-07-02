package com.fptu.fcms.dto.request;

import com.fptu.fcms.enums.ParticipantType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Registration policy payload for a participant type")
public class EventRegistrationPolicyRequest {
    @Schema(description = "Participant type", implementation = ParticipantType.class)
    @NotNull
    private ParticipantType participantType;

    @Schema(description = "Whether this policy is enabled", example = "true")
    private Boolean isEnabled = true;

    @Schema(description = "Seat quota for this participant type", example = "50")
    @Min(0)
    private Integer quota;

    @Schema(description = "Whether waitlist is enabled when quota is full", example = "false")
    private Boolean waitlistEnabled = false;

    @Schema(description = "When a quota release should be evaluated", example = "2026-07-01T12:00:00")
    private LocalDateTime quotaReleaseAt;

    @Schema(description = "Whether manual approval is required", example = "false")
    private Boolean requiresManualApproval = false;
}
