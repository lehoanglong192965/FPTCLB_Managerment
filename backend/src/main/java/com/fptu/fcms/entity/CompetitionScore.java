package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "CompetitionScore")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scoreID")
    private Integer scoreID;

    @Column(name = "competitionID", nullable = false)
    private Integer competitionID;

    @Column(name = "userID", nullable = false)
    private Integer userID;

    @Column(name = "activityScore", nullable = false)
    private Integer activityScore = 0;

    @Column(name = "participationScore", nullable = false)
    private Integer participationScore = 0;

    @Column(name = "feedbackScore", nullable = false)
    private Integer feedbackScore = 0;

    @Column(name = "complianceScore", nullable = false)
    private Integer complianceScore = 0;

    @Column(name = "engagementScore", nullable = false)
    private Integer engagementScore = 0;

    @Column(name = "totalScore", nullable = false)
    private Integer totalScore = 0;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;
}
