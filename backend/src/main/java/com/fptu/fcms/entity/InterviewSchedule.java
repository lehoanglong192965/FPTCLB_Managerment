package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "InterviewSchedule")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interviewID")
    private Integer interviewID;

    @Column(name = "applicationID", nullable = false) private Integer applicationID;

    @Column(name = "scheduledTime", nullable = false) private LocalDateTime scheduledTime;

    @Column(name = "location", nullable = false, length = 200)
    private String location;

    /** Scheduled | Completed | Cancelled */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default private String status = "Scheduled";

    /** Passed | Failed */
    @Column(name = "result", length = 20)
    private String result;

    @Column(name = "notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(name = "createdAt", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default private Boolean isDeleted = false;
}
