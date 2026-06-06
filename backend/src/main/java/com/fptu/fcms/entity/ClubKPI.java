package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "ClubKPI")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClubKPI {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kpiID")
    private Integer kpiID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Column(name = "totalEventsHeld")
    private Integer totalEventsHeld;

    @Column(name = "totalMembers")
    private Integer totalMembers;

    @Column(name = "kpiScore")
    private BigDecimal kpiScore;

    @Column(name = "rankingTier")
    private String rankingTier;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

}


