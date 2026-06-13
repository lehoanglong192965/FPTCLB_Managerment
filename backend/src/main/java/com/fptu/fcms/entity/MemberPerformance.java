package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "MemberPerformance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberPerformance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "performanceID")
    private Integer performanceID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "basePoints")
    private Integer basePoints;

    @Column(name = "bonusPoints")
    private Integer bonusPoints;

    @Column(name = "penaltyPoints")
    private Integer penaltyPoints;

    @Column(name = "finalPoints", insertable = false, updatable = false)
    private Integer finalPoints;

    @Column(name = "leaderEvaluation")
    private String leaderEvaluation;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;

}
