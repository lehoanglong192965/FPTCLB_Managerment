package com.fptu.fcms.entity;

import com.fptu.fcms.enums.ContributionBatchStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "ContributionBatch", indexes = {
        @Index(name = "IX_ContributionBatch_Event", columnList = "eventID"),
        @Index(name = "IX_ContributionBatch_Club_Status", columnList = "clubID,status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContributionBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batchID")
    private Integer batchID;

    @Column(name = "eventID", nullable = false)
    private Integer eventID;

    @Column(name = "clubID", nullable = false)
    private Integer clubID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ContributionBatchStatus status = ContributionBatchStatus.SCORING;

    @Column(name = "reportApprovedBy")
    private Integer reportApprovedBy;

    @Column(name = "reportApprovedAt")
    private LocalDateTime reportApprovedAt;

    @Column(name = "scoringOpenedAt")
    private LocalDateTime scoringOpenedAt;

    @Column(name = "scoringSubmittedAt")
    private LocalDateTime scoringSubmittedAt;

    @Column(name = "scoringSubmittedBy")
    private Integer scoringSubmittedBy;

    @Column(name = "appealOpenedAt")
    private LocalDateTime appealOpenedAt;

    @Column(name = "appealClosesAt")
    private LocalDateTime appealClosesAt;

    @Column(name = "finalizedAt")
    private LocalDateTime finalizedAt;

    @Column(name = "finalizedBy")
    private Integer finalizedBy;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    private void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (scoringOpenedAt == null) {
            scoringOpenedAt = now;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
