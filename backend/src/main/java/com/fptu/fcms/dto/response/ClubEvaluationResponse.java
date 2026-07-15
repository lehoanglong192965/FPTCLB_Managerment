package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubEvaluationResponse {
    private Integer evaluationID;
    private Integer clubID;
    private Integer semesterID;
    private BigDecimal kpiScore;
    private String suggestedDecision;
    private String finalDecision;
    private String previousFinalDecision;
    private String overallComment;
    private String strengths;
    private String weaknesses;
    private String improvementRequirements;
    private LocalDate improvementDeadline;
    private String decisionReason;
    private Integer evaluatedBy;
    private String evaluatedByName;
    private LocalDateTime evaluatedAt;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private Integer updatedBy;
    private LocalDateTime updatedAt;
}
