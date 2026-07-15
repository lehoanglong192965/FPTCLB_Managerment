package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ClubEvaluationRequest {
    private Integer semesterId;

    @Size(max = 60)
    private String finalDecision;

    private String overallComment;
    private String strengths;
    private String weaknesses;
    private String improvementRequirements;
    private LocalDate improvementDeadline;
    private String decisionReason;
}
