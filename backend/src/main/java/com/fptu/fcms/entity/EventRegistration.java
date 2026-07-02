package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.*;


@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventRegistration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registrationID")
    private Integer registrationID;

    @Column(name = "eventID")
    private Integer eventID;

    @Column(name = "userID")
    private Integer userID;

    @Column(name = "participantTypeSnapshotAt")
    private LocalDateTime participantTypeSnapshotAt;

    @Column(name = "registrationStatus")
    private String registrationStatus;

    @Column(name = "registrationChannel")
    private String registrationChannel;

    @Column(name = "guestFullName")
    private String guestFullName;

    @Column(name = "guestEmail")
    private String guestEmail;

    @Column(name = "guestPhone")
    private String guestPhone;

    @Column(name = "participantType")
    private String participantType;

    @Column(name = "registeredAt")
    private LocalDateTime registeredAt;

    @Column(name = "status")
    private String status;

    @Column(name = "ticketCode")
    private String ticketCode;

    @Column(name = "ticketIssuedAt")
    private LocalDateTime ticketIssuedAt;

    @Column(name = "ticketRevokedAt")
    private LocalDateTime ticketRevokedAt;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "createdBy")
    private Integer createdBy;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "updatedBy")
    private Integer updatedBy;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;

    @PrePersist
    @PreUpdate
    private void normalizeLifecycle() {
        if (registrationStatus == null) {
            registrationStatus = status;
        }
        if (status == null) {
            status = registrationStatus;
        }
        if (registrationChannel == null) {
            registrationChannel = userID == null ? "GUEST" : "FPTU";
        }
        if (participantTypeSnapshotAt == null) {
            participantTypeSnapshotAt = registeredAt;
        }
        if (createdAt == null) {
            createdAt = registeredAt != null ? registeredAt : LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        if (registrationStatus == null) {
            registrationStatus = "REGISTERED";
        }
        if (status == null) {
            status = registrationStatus;
        }
    }

}
