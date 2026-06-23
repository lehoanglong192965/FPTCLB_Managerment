package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "MemberRankingSnapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberRankingSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "snapshotID")
    private Integer snapshotID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "userID")
    private Integer userID;

    @org.hibernate.annotations.Nationalized
    @Column(name = "fullName")
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "totalScore")
    private Integer totalScore;

    @Column(name = "contributionPoint")
    private Integer contributionPoint;

    @Column(name = "eventParticipationPoint")
    private Integer eventParticipationPoint;

    @Column(name = "performancePoint")
    private Integer performancePoint;

    @Column(name = "finalizedAt")
    private LocalDateTime finalizedAt;

    @Column(name = "finalizedBy")
    private Integer finalizedBy;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}
