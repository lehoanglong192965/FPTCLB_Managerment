package com.fptu.fcms.entity;

import com.fptu.fcms.enums.GuestOtpStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLRestriction("isDeleted = false")
@Table(name = "GuestVerificationOtp")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GuestVerificationOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "otpID")
    private Integer otpID;

    @Column(name = "guestRegistrationID")
    private Integer guestRegistrationID;

    @Column(name = "guestEmail", nullable = false)
    private String guestEmail;

    @Column(name = "otpHash", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String otpHash;

    @Column(name = "expiresAt", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "resendAvailableAt")
    private LocalDateTime resendAvailableAt;

    @Column(name = "usedAt")
    private LocalDateTime usedAt;

    @Column(name = "verifiedAt")
    private LocalDateTime verifiedAt;

    @Column(name = "attemptCount", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "maxAttempts", nullable = false)
    private Integer maxAttempts = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GuestOtpStatus status = GuestOtpStatus.ACTIVE;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "createdBy")
    private Integer createdBy;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}