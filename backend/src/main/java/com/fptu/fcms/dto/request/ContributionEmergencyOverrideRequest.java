package com.fptu.fcms.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContributionEmergencyOverrideRequest {
    private Integer contributionID;

    @JsonAlias("userId")
    private Integer userID;

    private String contributionType;

    private String leaderEvaluation;

    private String tier;

    @Size(max = 2000)
    private String rationale;

    @NotBlank
    @Size(max = 2000)
    private String reason;
}
