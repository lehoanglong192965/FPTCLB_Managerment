package com.fptu.fcms.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventRegistration", indexes = {
        @Index(name = "IX_EventRegistration_RegistrationCode", columnList = "registrationCode"),
        @Index(name = "IX_EventRegistration_GuestReferenceHash", columnList = "guestReferenceHash"),
        @Index(name = "IX_EventRegistration_Event_GuestEmailNormalized", columnList = "eventID,guestEmailNormalized"),
        @Index(name = "IX_EventRegistration_Event_GuestPhoneNormalized", columnList = "eventID,guestPhoneNormalized")
})
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

    @Column(name = "guestEmailNormalized")
    private String guestEmailNormalized;

    @Column(name = "guestPhone")
    private String guestPhone;

    @Column(name = "guestPhoneNormalized")
    private String guestPhoneNormalized;

    @Column(name = "guestReferenceHash")
    private String guestReferenceHash;

    @Column(name = "schoolOrOrganization")
    private String schoolOrOrganization;

    @Column(name = "consentAccepted")
    private Boolean consentAccepted;

    @Column(name = "discoverySource")
    private String discoverySource;

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

    @Column(name = "registrationCode")
    private String registrationCode;

    @Column(name = "waitlistPosition")
    private Integer waitlistPosition;

    @Column(name = "verifiedAt")
    private LocalDateTime verifiedAt;

    @Column(name = "cancelledAt")
    private LocalDateTime cancelledAt;

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
        if (registrationStatus == null) {
            registrationStatus = "PENDING_VERIFICATION";
            status = registrationStatus;
        }
        registrationStatus = normalizeStatus(registrationStatus);
        status = normalizeStatus(status);
        if (registrationChannel == null) {
            registrationChannel = userID == null ? "ONLINE" : "FPTU";
        }
        if (guestEmailNormalized == null && guestEmail != null) {
            guestEmailNormalized = guestEmail.trim().toLowerCase(java.util.Locale.ROOT);
        }
        if (guestPhoneNormalized == null && guestPhone != null) {
            guestPhoneNormalized = guestPhone.replaceAll("\\D", "");
        }
        if (participantTypeSnapshotAt == null) {
            participantTypeSnapshotAt = registeredAt;
        }
        if (createdAt == null) {
            createdAt = registeredAt != null ? registeredAt : LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        updatedAt = LocalDateTime.now();
    }

    private String normalizeStatus(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase(java.util.Locale.ROOT);
        if ("CANCELED".equals(normalized)) {
            return "CANCELLED";
        }
        return normalized;
    }
}
