package com.fptu.fcms.repository;

import com.fptu.fcms.entity.OTPVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OTPVerificationRepository extends JpaRepository<OTPVerification, Integer> {

    /**
     * Tìm OTP gần đây nhất (chưa sử dụng) theo email
     */
    Optional<OTPVerification> findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(String email);

    /**
     * Tìm OTP theo email và code
     */
    Optional<OTPVerification> findByEmailAndOtpCode(String email, String otpCode);
}

