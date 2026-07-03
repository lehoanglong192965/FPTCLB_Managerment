package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Check(constraints = "multiplier >= 0.0 AND multiplier <= 1.5")
@Table(name = "EventContribution", indexes = {
        @Index(name = "IX_EventContribution_Batch_User", columnList = "batchID,userID"),
        @Index(name = "IX_EventContribution_Event_User", columnList = "eventID,userID")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventContribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contributionID")
    private Integer contributionID;

    @Column(name = "batchID")
    private Integer batchID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "contributionType", length = 40)
    private String contributionType;

    @Column(name = "leaderEvaluation", length = 40)
    private String leaderEvaluation;

    @Column(name = "basePoints")
    private Integer basePoints;

    @Column(name = "multiplier", precision = 4, scale = 2)
    private BigDecimal multiplier;

    @Column(name = "bonusPoints")
    private Integer bonusPoints;

    @Column(name = "penaltyPoints")
    private Integer penaltyPoints;

    @Column(name = "finalPoints")
    private Integer finalPoints;

    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "calculatedAt")
    private LocalDateTime calculatedAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "updatedBy")
    private Integer updatedBy;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}
