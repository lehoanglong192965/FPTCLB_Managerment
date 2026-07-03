package com.fptu.fcms.entity;

import com.fptu.fcms.enums.AppealStatus;
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
@Table(name = "ContributionAppeal", indexes = {
        @Index(name = "IX_ContributionAppeal_Batch_Status", columnList = "batchID,status"),
        @Index(name = "IX_ContributionAppeal_Event_User", columnList = "eventID,userID")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContributionAppeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appealID")
    private Integer appealID;

    @Column(name = "batchID", nullable = false)
    private Integer batchID;

    @Column(name = "eventID", nullable = false)
    private Integer eventID;

    @Column(name = "contributionID")
    private Integer contributionID;

    @Column(name = "userID", nullable = false)
    private Integer userID;

    @Column(name = "reason", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @Column(name = "resolutionNote", columnDefinition = "NVARCHAR(MAX)")
    private String resolutionNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AppealStatus status = AppealStatus.PENDING;

    @Column(name = "requestedAt", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "resolvedAt")
    private LocalDateTime resolvedAt;

    @Column(name = "resolvedBy")
    private Integer resolvedBy;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    private void onCreate() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
