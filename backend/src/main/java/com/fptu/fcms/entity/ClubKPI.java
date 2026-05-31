package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ClubKPI")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubKPI {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kpiID")
    private Integer kpiID;

    @Column(name = "clubID",     nullable = false) private Integer clubID;
    @Column(name = "semesterID", nullable = false) private Integer semesterID;

    @Column(name = "totalEventsHeld", nullable = false) @Builder.Default private Integer totalEventsHeld = 0;
    @Column(name = "totalMembers",    nullable = false) @Builder.Default private Integer totalMembers    = 0;

    @Column(name = "kpiScore", nullable = false, precision = 5, scale = 2)
    @Builder.Default private BigDecimal kpiScore = BigDecimal.ZERO;

    @Column(name = "rankingTier", length = 5) private String rankingTier;

    @Column(name = "updatedAt", nullable = false)
    @Builder.Default private LocalDateTime updatedAt = LocalDateTime.now();
}
