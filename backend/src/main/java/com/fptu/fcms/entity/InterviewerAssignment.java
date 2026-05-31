package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "InterviewerAssignment")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewerAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignmentID")
    private Integer assignmentID;

    @Column(name = "interviewID",   nullable = false) private Integer interviewID;
    @Column(name = "interviewerID", nullable = false) private Integer interviewerID;

    @Column(name = "evaluation", columnDefinition = "NVARCHAR(MAX)")
    private String evaluation;

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default private Boolean isDeleted = false;
}
