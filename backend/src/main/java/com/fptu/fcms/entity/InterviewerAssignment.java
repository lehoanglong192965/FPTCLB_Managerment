package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "InterviewerAssignment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterviewerAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignmentID")
    private Integer assignmentID;

    @Column(name = "interviewID")
    private Integer interviewID;

    @Column(name = "interviewerID")
    private Integer interviewerID;

    @Column(name = "evaluation")
    private String evaluation;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}

