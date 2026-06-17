package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EventApprovalRequest {
    @NotBlank(message = "decision is required")
    private String decision;

    private String pdpFeedback;
}
