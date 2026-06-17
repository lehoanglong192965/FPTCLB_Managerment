package com.fptu.fcms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventReport")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reportID")
    private Integer reportID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "reportUrl")
    private String reportUrl;

    @org.hibernate.annotations.Nationalized
    @Column(name = "summary")
    private String summary;

    @Column(name = "uploadedBy")
    private Integer uploadedBy;

    @Column(name = "uploadedAt")
    private LocalDateTime uploadedAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}
