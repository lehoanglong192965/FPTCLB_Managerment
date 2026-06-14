package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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

    @NotNull(message = "interviewScore is required")
    @DecimalMin(value = "0.0", message = "interviewScore must be at least 0.0")
    @DecimalMax(value = "10.0", message = "interviewScore must be at most 10.0")
    private Double interviewScore;
}
