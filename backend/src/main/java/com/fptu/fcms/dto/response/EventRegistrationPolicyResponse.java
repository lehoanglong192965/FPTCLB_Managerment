package com.fptu.fcms.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Schema(description = "Registration policy response")
public class EventRegistrationPolicyResponse {
    private final Integer policyID;
    private final Integer eventID;
    private final String participantType;
    private final Boolean isEnabled;
    private final Integer quota;
    private final Boolean waitlistEnabled;
    private final LocalDateTime quotaReleaseAt;
    private final Boolean requiresManualApproval;
    private final Boolean requiresApproval;
    private final LocalDateTime createdAt;
}
