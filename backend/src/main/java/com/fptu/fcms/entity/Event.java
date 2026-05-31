package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Event")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "clubID",     nullable = false) private Integer clubID;
    @Column(name = "semesterID", nullable = false) private Integer semesterID;

    @Column(name = "eventCode",  nullable = false, unique = true, length = 30)
    private String eventCode;

    @Column(name = "eventName",  nullable = false, length = 150)
    private String eventName;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "location", nullable = false, length = 200)
    @Builder.Default private String location = "FPTU Campus";

    @Column(name = "budget", nullable = false, precision = 18, scale = 2)
    @Builder.Default private BigDecimal budget = BigDecimal.ZERO;

    @Column(name = "startDate", nullable = false)  private LocalDateTime startDate;
    @Column(name = "endDate",   nullable = false)  private LocalDateTime endDate;

    /** Draft | Pending | Approved | Reported | Closed */
    @Column(name = "eventStatus", nullable = false, length = 20)
    @Builder.Default private String eventStatus = "Draft";

    @Column(name = "isResubmitted", nullable = false)
    @Builder.Default private Boolean isResubmitted = false;

    @Column(name = "isScoreLocked", nullable = false)
    @Builder.Default private Boolean isScoreLocked = false;

    @Column(name = "createdAt", nullable = false, updatable = false)
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "isDeleted", nullable = false)
    @Builder.Default private Boolean isDeleted = false;
}
