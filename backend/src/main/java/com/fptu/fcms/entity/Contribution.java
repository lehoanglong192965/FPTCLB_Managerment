package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Check(constraints = "multiplier >= 0.0 AND multiplier <= 1.5")
@Table(name = "contribution", schema = "core")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Contribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contributionID")
    private Integer contributionID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "basePoints")
    private Integer basePoints;

    @Column(name = "multiplier", precision = 4, scale = 2)
    private BigDecimal multiplier;

    @Column(name = "finalPoints")
    private Integer finalPoints;

    @Column(name = "calculatedAt")
    private LocalDateTime calculatedAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}
