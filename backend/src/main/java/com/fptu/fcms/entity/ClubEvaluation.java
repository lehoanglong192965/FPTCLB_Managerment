package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "ClubEvaluation", indexes = {
        @Index(name = "IX_ClubEvaluation_Club_Semester", columnList = "clubID,semesterID"),
        @Index(name = "IX_ClubEvaluation_EvaluatedAt", columnList = "evaluatedAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClubEvaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluationID")
    private Integer evaluationID;

    @Column(name = "clubID", nullable = false)
    private Integer clubID;

    @Column(name = "semesterID", nullable = false)
    private Integer semesterID;

    @Column(name = "kpiScore", precision = 8, scale = 2)
    private BigDecimal kpiScore;

    @Column(name = "suggestedDecision", length = 60)
    private String suggestedDecision;

    @Column(name = "finalDecision", length = 60)
    private String finalDecision;

    @Column(name = "previousFinalDecision", length = 60)
    private String previousFinalDecision;

    @Column(name = "overallComment", columnDefinition = "NVARCHAR(MAX)")
    private String overallComment;

    @Column(name = "strengths", columnDefinition = "NVARCHAR(MAX)")
    private String strengths;

    @Column(name = "weaknesses", columnDefinition = "NVARCHAR(MAX)")
    private String weaknesses;

    @Column(name = "improvementRequirements", columnDefinition = "NVARCHAR(MAX)")
    private String improvementRequirements;

    @Column(name = "improvementDeadline")
    private LocalDate improvementDeadline;

    @Column(name = "decisionReason", columnDefinition = "NVARCHAR(MAX)")
    private String decisionReason;

    @Column(name = "evaluatedBy")
    private Integer evaluatedBy;

    @Column(name = "evaluatedAt")
    private LocalDateTime evaluatedAt;

    @Column(name = "createdBy")
    private Integer createdBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedBy")
    private Integer updatedBy;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    private void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (evaluatedAt == null) {
            evaluatedAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
