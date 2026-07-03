package com.fptu.fcms.entity;

import com.fptu.fcms.enums.AttendanceSessionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "AttendanceSession")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sessionID")
    private Integer sessionID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "sessionName")
    private String sessionName;

    @Column(name = "checkInTime")
    private LocalDateTime checkInTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AttendanceSessionStatus status;

    @Column(name = "opensAt")
    private LocalDateTime opensAt;

    @Column(name = "closesAt")
    private LocalDateTime closesAt;

    @Column(name = "createdBy")
    private Integer createdBy;

    @Column(name = "openedBy")
    private Integer openedBy;

    @Column(name = "closedBy")
    private Integer closedBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "evidenceProofUrl")
    private String evidenceProofUrl;

    @Column(name = "isDeleted")
    private Boolean isDeleted;

    @PrePersist
    @PreUpdate
    private void normalizeLifecycle() {
        if (status == null) {
            status = AttendanceSessionStatus.DRAFT;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

}

