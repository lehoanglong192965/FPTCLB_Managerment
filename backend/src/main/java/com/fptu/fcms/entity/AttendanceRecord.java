package com.fptu.fcms.entity;

import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(
        name = "AttendanceRecord",
        indexes = {
                @Index(name = "IX_AttendanceRecord_Session_User", columnList = "sessionID,userID"),
                @Index(name = "IX_AttendanceRecord_Session_Registration", columnList = "sessionID,registrationID"),
                @Index(name = "IX_AttendanceRecord_Session_GuestRegistration", columnList = "sessionID,guestRegistrationID")
        }
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

    @Column(name = "guestRegistrationID")
    private Integer guestRegistrationID;

    @Column(name = "participantTypeSnapshotAt")
    private LocalDateTime participantTypeSnapshotAt;

    @Column(name = "participantTypeSnapshot")
    private String participantTypeSnapshot;

    @Column(name = "attendanceStatus")
    @Convert(converter = AttendanceStatusConverter.class)
    private AttendanceStatus attendanceStatus;

    @Column(name = "checkInMethod")
    @Convert(converter = CheckInMethodConverter.class)
    private CheckInMethod checkInMethod;

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
