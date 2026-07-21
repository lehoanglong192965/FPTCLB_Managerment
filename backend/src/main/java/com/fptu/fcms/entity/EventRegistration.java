package com.fptu.fcms.entity;

import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.PaymentMethod;
import com.fptu.fcms.enums.PaymentStatus;
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
import java.math.BigDecimal;
import java.util.Locale;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "EventRegistration", indexes = {
        @Index(name = "IX_EventRegistration_RegistrationCode", columnList = "registrationCode"),
        @Index(name = "IX_EventRegistration_GuestReferenceHash", columnList = "guestReferenceHash"),
        @Index(name = "IX_EventRegistration_Event_GuestEmailNormalized", columnList = "eventID,guestEmailNormalized"),
        @Index(name = "IX_EventRegistration_Event_GuestPhoneNormalized", columnList = "eventID,guestPhoneNormalized"),
        @Index(name = "IX_EventRegistration_Event_User", columnList = "eventID,userID"),
        @Index(name = "IX_EventRegistration_Status", columnList = "registrationStatus")
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

    @Enumerated(EnumType.STRING)
    @Column(name = "registrationStatus")
    private RegistrationStatus registrationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "registrationChannel")
    private RegistrationChannel registrationChannel;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "participantType")
    private ParticipantType participantType;

    @Column(name = "registeredAt")
    private LocalDateTime registeredAt;

    @Column(name = "status")
    @Deprecated
    private String status;

    @Column(name = "ticketCode")
    private String ticketCode;

    @Column(name = "ticketIssuedAt")
    private LocalDateTime ticketIssuedAt;

    @Column(name = "ticketRevokedAt")
    private LocalDateTime ticketRevokedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "paymentStatus")
    private PaymentStatus paymentStatus = PaymentStatus.NOT_REQUIRED;

    @Column(name = "amountDue")
    private BigDecimal amountDue;

    @Column(name = "amountPaid")
    private BigDecimal amountPaid;

    @Column(name = "paymentCurrency", length = 3)
    private String paymentCurrency;

    @Column(name = "paymentReference", length = 64)
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "paymentMethod")
    private PaymentMethod paymentMethod;

    @Column(name = "paidAt")
    private LocalDateTime paidAt;

    @Column(name = "paymentExpiresAt")
    private LocalDateTime paymentExpiresAt;

    @Column(name = "registrationCode")
    private String registrationCode;

    @Column(name = "waitlistPosition")
    private Integer waitlistPosition;

    @Column(name = "capacityExempt", nullable = false)
    private Boolean capacityExempt = false;

    @Column(name = "purchaserUserID")
    private Integer purchaserUserID;

    @Column(name = "ticketOrderCode", length = 64)
    private String ticketOrderCode;

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
        if (registrationStatus == null && status != null && !status.isBlank()) {
            registrationStatus = RegistrationStatus.fromValue(status);
        }
        if (registrationStatus == null) {
            registrationStatus = RegistrationStatus.PENDING_VERIFICATION;
        }
        status = registrationStatus.name();

        if (participantType == null) {
            participantType = userID == null ? ParticipantType.GUEST : ParticipantType.PARTICIPANT;
        }
        if (registrationChannel == null) {
            registrationChannel = userID == null ? RegistrationChannel.ONLINE : RegistrationChannel.FPTU;
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
        if (capacityExempt == null) {
            capacityExempt = false;
        }
    }
}
