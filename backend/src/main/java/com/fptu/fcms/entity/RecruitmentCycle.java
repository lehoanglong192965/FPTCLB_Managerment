package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "RecruitmentCycle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentCycle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cycleID")
    private Integer cycleID;

    @Column(name = "title")
    private String title;

    /** JSON string that describes the dynamic form/questions */
    @Column(name = "questionsJson", columnDefinition = "nvarchar(max)")
    private String questionsJson;

    /** Status: e.g., Open, Closed */
    @Column(name = "status")
    private String status;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "startDate")
    private LocalDate startDate;

    @Column(name = "closedAt")
    private LocalDateTime closedAt;

    /** Whether a reminder has already been sent for this cycle */
    @Column(name = "reminded")
    private Boolean reminded;

    @Column(name = "isDeleted")
    private Boolean isDeleted;
}
