package com.fptu.fcms.entity;

import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "GuestEventRegistration", indexes = {
        @Index(name = "IX_GuestEventRegistration_RegistrationCode", columnList = "registrationCode"),
        @Index(name = "IX_GuestEventRegistration_GuestReferenceHash", columnList = "guestReferenceHash"),
        @Index(name = "IX_GuestEventRegistration_Event_Email", columnList = "eventID,guestEmailNormalized"),
        @Index(name = "IX_GuestEventRegistration_Event_Phone", columnList = "eventID,guestPhoneNormalized")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GuestEventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "guestRegistrationID")
    private Integer guestRegistrationID;

    @Column(name = "eventID", nullable = false)
    private Integer eventID;

    @Column(name = "guestFullName", nullable = false)
    private String guestFullName;

    @Column(name = "guestEmail", nullable = false)
    private String guestEmail;

    @Column(name = "guestEmailNormalized", nullable = false)
    private String guestEmailNormalized;

    @Column(name = "guestPhone", nullable = false)
    private String guestPhone;

    @Column(name = "guestPhoneNormalized", nullable = false)
    private String guestPhoneNormalized;

    @Column(name = "guestReferenceHash", nullable = false)
    private String guestReferenceHash;

    @Column(name = "schoolOrOrganization")
    private String schoolOrOrganization;

    @Column(name = "consentAccepted")
    private Boolean consentAccepted;

    @Column(name = "discoverySource")
    private String discoverySource;

    @Enumerated(EnumType.STRING)
    @Column(name = "participantType", nullable = false)
    private ParticipantType participantType = ParticipantType.GUEST;

    @Column(name = "participantTypeSnapshotAt")
    private LocalDateTime participantTypeSnapshotAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "registrationStatus", nullable = false)
    private RegistrationStatus registrationStatus = RegistrationStatus.PENDING_VERIFICATION;

    @Enumerated(EnumType.STRING)
    @Column(name = "registrationChannel", nullable = false)
    private RegistrationChannel registrationChannel = RegistrationChannel.ONLINE;

    @Column(name = "status")
    private String status;

    @Column(name = "registeredAt")
    private LocalDateTime registeredAt;

    @Column(name = "registrationCode")
    private String registrationCode;

    @Column(name = "waitlistPosition")
    private Integer waitlistPosition;

    @Column(name = "verifiedAt")
    private LocalDateTime verifiedAt;

    @Column(name = "cancelledAt")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellationReason", length = 500)
    private String cancellationReason;

    @Column(name = "cancellationSource", length = 30)
    private String cancellationSource;

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
        if (registrationStatus == null && status != null && !status.isBlank()) {
            registrationStatus = RegistrationStatus.fromValue(status);
        }
        if (registrationStatus == null) {
            registrationStatus = RegistrationStatus.PENDING_VERIFICATION;
        }
        status = registrationStatus.name();

        if (participantType == null) {
            participantType = ParticipantType.GUEST;
        }
        if (registrationChannel == null) {
            registrationChannel = RegistrationChannel.ONLINE;
        }
        if (guestEmailNormalized == null && guestEmail != null) {
            guestEmailNormalized = guestEmail.trim().toLowerCase(Locale.ROOT);
        }
        if (guestPhoneNormalized == null && guestPhone != null) {
            guestPhoneNormalized = guestPhone.replaceAll("\\D", "");
        }
        if (participantTypeSnapshotAt == null) {
            participantTypeSnapshotAt = registeredAt != null ? registeredAt : LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = registeredAt != null ? registeredAt : LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
}
