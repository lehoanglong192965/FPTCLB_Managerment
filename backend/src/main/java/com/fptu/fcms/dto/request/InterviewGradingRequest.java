package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InterviewGradingRequest {

    @NotNull(message = "applicationId is required")
    @Min(value = 1, message = "applicationId must be greater than 0")
    @Max(value = Integer.MAX_VALUE, message = "applicationId is out of supported range")
    private Long applicationId;

    @NotNull(message = "isPassed is required")
    private Boolean isPassed;
}
