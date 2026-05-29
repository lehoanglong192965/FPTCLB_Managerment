package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "RecruitmentApplication")
public class RecruitmentApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer applicationID;

    @Column(nullable = false)
    private Integer clubID;

    @Column(nullable = false)
    private Integer userID;

    @Column(nullable = false)
    private Integer semesterID;

    @Column(length = 500)
    private String cvUrl;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String introduction;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String answersJson;

    @Column(nullable = false, length = 20)
    private String status = "Draft";

    @Column(precision = 5, scale = 2)
    private BigDecimal aiScore;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String aiFeedback;

    private LocalDateTime submittedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean isDeleted = false;
}