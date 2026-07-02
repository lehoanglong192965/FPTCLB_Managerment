package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

    @Column(name = "eventRegistrationID", nullable = false)
    private Integer eventRegistrationID;

    @Column(name = "guestEmail", nullable = false)
    private String guestEmail;

    @Column(name = "otpHash", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String otpHash;

    @Column(name = "expiresAt", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "usedAt")
    private LocalDateTime usedAt;

    @Column(name = "attemptCount", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "createdBy")
    private Integer createdBy;

    @Column(name = "isDeleted")
    private Boolean isDeleted = false;
}
