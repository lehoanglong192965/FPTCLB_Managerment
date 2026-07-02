package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(
        name = "AttendanceRecord",
        uniqueConstraints = @UniqueConstraint(name = "UK_AttendanceRecord_Session_Registration", columnNames = {"sessionID", "registrationID"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recordID")
    private Integer recordID;

    @Column(name = "sessionID")
    private Integer sessionID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "participantTypeSnapshotAt")
    private LocalDateTime participantTypeSnapshotAt;

    @Column(name = "participantTypeSnapshot")
    private String participantTypeSnapshot;

    @Column(name = "attendanceStatus")
    private String attendanceStatus;

    @Column(name = "checkInMethod")
    private String checkInMethod;

    @Column(name = "verificationMethod")
    private String verificationMethod;

    @Column(name = "checkedInBy")
    private Integer checkedInBy;

    @Column(name = "checkedInAt")
    private LocalDateTime checkedInAt;

    @Column(name = "manualReason")
    private String manualReason;

    @Column(name = "overrideReason")
    private String overrideReason;

    @Column(name = "note")
    private String note;

    @Column(name = "deviceInfoOrSource")
    private String deviceInfoOrSource;

    @Column(name = "capturedImgUrl")
    private String capturedImgUrl;

    @Column(name = "aiMatchConfidence")
    private BigDecimal aiMatchConfidence;

    @Column(name = "isVerifiedByAI")
    private Boolean isVerifiedByAI;

    @Column(name = "markedAt")
    private LocalDateTime markedAt;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;

    @PrePersist
    @PreUpdate
    private void normalizeLifecycle() {
        if (checkedInAt == null) {
            checkedInAt = markedAt != null ? markedAt : LocalDateTime.now();
        }
        if (markedAt == null) {
            markedAt = checkedInAt;
        }
        if (createdAt == null) {
            createdAt = markedAt;
        }
        updatedAt = LocalDateTime.now();
    }

}
