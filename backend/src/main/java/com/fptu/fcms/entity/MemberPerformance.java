package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "MemberPerformance")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MemberPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "performanceID")
    private Integer performanceID;

    @Column(name = "eventID", nullable = false) private Integer eventID;
    @Column(name = "userID",  nullable = false) private Integer userID;
    @Column(name = "clubID",  nullable = false) private Integer clubID;

    @Column(name = "basePoints",    nullable = false) @Builder.Default private Integer basePoints    = 0;
    @Column(name = "bonusPoints",   nullable = false) @Builder.Default private Integer bonusPoints   = 0;
    @Column(name = "penaltyPoints", nullable = false) @Builder.Default private Integer penaltyPoints = 0;

    // finalPoints là computed column trong DB (PERSISTED) — chỉ đọc, không ghi
    @Column(name = "finalPoints", insertable = false, updatable = false)
    private Integer finalPoints;

    @Column(name = "leaderEvaluation", columnDefinition = "NVARCHAR(MAX)")
    private String leaderEvaluation;

    @Column(name = "updatedAt", nullable = false)
    @Builder.Default private LocalDateTime updatedAt = LocalDateTime.now();
}
