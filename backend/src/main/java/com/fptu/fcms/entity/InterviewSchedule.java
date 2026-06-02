package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "InterviewSchedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interviewID")
    private Integer interviewID;

    @Column(name = "applicationID")
    private Integer applicationID;

    @Column(name = "scheduledTime")
    private LocalDateTime scheduledTime;

    @Column(name = "location")
    private String location;

    @Column(name = "status")
    private String status;

    @Column(name = "result")
    private String result;

    @Column(name = "notes")
    private String notes;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}

