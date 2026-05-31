package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@Table(name = "RecruitmentApplication")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "applicationID")
    private Integer applicationID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Column(name = "cvUrl")
    private String cvUrl;

    @Column(name = "introduction")
    private String introduction;

    @Column(name = "answersJson")
    private String answersJson;

    @Column(name = "status")
    private String status;

    @Column(name = "aiScore")
    private BigDecimal aiScore;

    @Column(name = "aiFeedback")
    private String aiFeedback;

    @Column(name = "submittedAt")
    private LocalDateTime submittedAt;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}



