package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppealResolveRequest {
    @NotBlank
    private String status;

    @Size(max = 2000)
    private String resolutionNote;

    private String contributionType;

    private String leaderEvaluation;
}
