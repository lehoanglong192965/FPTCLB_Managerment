package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "Event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "clubID")
    private Integer clubID;

    @Column(name = "semesterID")
    private Integer semesterID;

    @Column(name = "eventCode")
    private String eventCode;

    @org.hibernate.annotations.Nationalized
    @Column(name = "eventName")
    private String eventName;

    @org.hibernate.annotations.Nationalized
    @Column(name = "description")
    private String description;

    @org.hibernate.annotations.Nationalized
    @Column(name = "location")
    private String location;

    @Column(name = "budget")
    private BigDecimal budget;

    @Column(name = "startDate")
    private LocalDateTime startDate;

    @Column(name = "endDate")
    private LocalDateTime endDate;

    @Column(name = "eventStatus")
    private String eventStatus;

    @org.hibernate.annotations.Nationalized
    @Column(name = "pdpFeedback")
    private String pdpFeedback;

    @Column(name = "approvedBy")
    private Integer approvedBy;

    @Column(name = "approvedAt")
    private LocalDateTime approvedAt;

    @Column(name = "isResubmitted")
    private Boolean isResubmitted;

    @Column(name = "isScoreLocked")
    private Boolean isScoreLocked;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

}


