package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.GuestVerificationOtp;
import com.fptu.fcms.enums.GuestOtpStatus;
import com.fptu.fcms.repository.GuestVerificationOtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Persists failed OTP state in an independent transaction so the counter is
 * not rolled back when the verification request returns an HTTP error.
 */
@Service
@RequiredArgsConstructor
public class GuestOtpAttemptService {

    private final GuestVerificationOtpRepository otpRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markExpired(Integer otpId, LocalDateTime now) {
        GuestVerificationOtp otp = load(otpId);
        if (GuestOtpStatus.ACTIVE.equals(otp.getStatus())) {
            otp.setStatus(GuestOtpStatus.EXPIRED);
            otp.setUpdatedAt(now);
            otpRepository.saveAndFlush(otp);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markLocked(Integer otpId, LocalDateTime now) {
        GuestVerificationOtp otp = load(otpId);
        if (GuestOtpStatus.ACTIVE.equals(otp.getStatus())) {
            otp.setStatus(GuestOtpStatus.LOCKED);
            otp.setUpdatedAt(now);
            otpRepository.saveAndFlush(otp);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordInvalidAttempt(Integer otpId, LocalDateTime now) {
        GuestVerificationOtp otp = load(otpId);
        if (!GuestOtpStatus.ACTIVE.equals(otp.getStatus())) return;

        int attempts = (otp.getAttemptCount() == null ? 0 : otp.getAttemptCount()) + 1;
        otp.setAttemptCount(attempts);
        if (otp.getMaxAttempts() != null && attempts >= otp.getMaxAttempts()) {
            otp.setStatus(GuestOtpStatus.LOCKED);
        }
        otp.setUpdatedAt(now);
        otpRepository.saveAndFlush(otp);
    }

    private GuestVerificationOtp load(Integer otpId) {
        return otpRepository.findById(otpId)
                .orElseThrow(() -> new IllegalArgumentException("OTP not found."));
    }
}
