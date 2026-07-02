package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


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

    @Column(name = "status")
    private String status;

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
            status = "DRAFT";
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

