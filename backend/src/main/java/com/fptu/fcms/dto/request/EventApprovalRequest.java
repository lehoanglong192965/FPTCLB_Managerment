package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventApprovalRequest {
    @NotBlank(message = "decision không được để trống.")
    private String decision;

    private String pdpFeedback;
}