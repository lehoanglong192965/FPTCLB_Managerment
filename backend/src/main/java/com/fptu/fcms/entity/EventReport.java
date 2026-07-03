package com.fptu.fcms.entity;

import com.fptu.fcms.enums.EventReportStatus;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private EventReportStatus status = EventReportStatus.UPLOADED;

    @Column(name = "approvedBy")
    private Integer approvedBy;

    @Column(name = "approvedAt")
    private LocalDateTime approvedAt;

    @Column(name = "rejectedBy")
    private Integer rejectedBy;

    @Column(name = "rejectedAt")
    private LocalDateTime rejectedAt;

    @Column(name = "rejectionReason", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionReason;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}
