package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "competition_penalty")
@Getter
@Setter
public class CompetitionPenalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer penaltyID;

    @Column(name = "competition_id", nullable = false)
    private Integer competitionID;

    @Column(name = "user_id", nullable = false)
    private Integer userID;

    @Column(name = "penalty_name", nullable = false, length = 100)
    private String penaltyName;

    @Column(name = "description")
    private String description;

    @Column(name = "points_deduction")
    private Integer pointsDeduction;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
