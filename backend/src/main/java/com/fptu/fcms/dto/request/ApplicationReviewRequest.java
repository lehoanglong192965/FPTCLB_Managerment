package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplicationReviewRequest {

    @NotNull(message = "applicationId is required")
    @Min(value = 1, message = "applicationId must be greater than 0")
    @Max(value = Integer.MAX_VALUE, message = "applicationId is out of supported range")
    private Long applicationId;

    @NotNull(message = "isAccepted is required")
    private Boolean isAccepted;

    @Future(message = "interviewTime must be in the future")
    private LocalDateTime interviewTime;

    @Size(max = 200, message = "interviewLocation must not exceed 200 characters")
    private String interviewLocation;

    @AssertTrue(message = "interviewTime and interviewLocation are required when isAccepted is true")
    public boolean isAcceptedScheduleValid() {
        if (!Boolean.TRUE.equals(isAccepted)) {
            return true;
        }
        return interviewTime != null
                && interviewLocation != null
                && !interviewLocation.isBlank();
    }
}
