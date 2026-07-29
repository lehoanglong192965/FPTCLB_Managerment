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

    // Cố tình KHÔNG có findByEmailAndOtpCode: tra cứu kèm mã khiến lần đoán sai không khớp
    // bản ghi nào, nên attempts không tăng và cơ chế khoá brute-force mất tác dụng.
}

