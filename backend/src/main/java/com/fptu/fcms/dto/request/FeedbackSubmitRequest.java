package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedbackSubmitRequest {
    @NotNull
    private Integer registrationId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer contentRating;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer organizationRating;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer logisticsRating;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer overallRating;

    @Size(max = 2000)
    private String comment;
}
