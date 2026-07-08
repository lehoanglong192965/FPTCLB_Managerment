package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.*;

import com.fptu.fcms.entity.OTPVerification;
import com.fptu.fcms.repository.OTPVerificationRepository;
import com.fptu.fcms.util.EmailMaskingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OTPServiceImpl implements OTPService {

    private final OTPVerificationRepository otpRepository;
    private final EmailService emailService;

    @Value("${otp.expiration-minutes:10}")
    private Integer otpExpirationMinutes;

    private static final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void generateAndSendOTP(String email) {
        // Tạo mã OTP 6 chữ số (dùng SecureRandom để không bị đoán trước)
        String otpCode = String.format("%06d", secureRandom.nextInt(999999));

        // Lấy OTP cũ (nếu có) và đánh dấu là đã sử dụng
        Optional<OTPVerification> oldOTP = otpRepository.findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(email);
        oldOTP.ifPresent(otp -> {
            otp.setIsUsed(true);
            otpRepository.save(otp);
        });

        // Tạo OTP mới
        LocalDateTime now = LocalDateTime.now();
        OTPVerification newOTP = OTPVerification.builder()
                .email(email)
                .otpCode(otpCode)
                .createdAt(now)
                .expiresAt(now.plusMinutes(otpExpirationMinutes))
                .isUsed(false)
                .attempts(0)
                .build();

        otpRepository.save(newOTP);

        // Gửi email với OTP
        emailService.sendOTPEmail(email, otpCode);
        log.info("OTP generated and sent to: {}", EmailMaskingUtil.maskEmail(email));
        System.out.println("Your OTP generated: "+otpCode);

    }

    @Override
    @Transactional
    public boolean verifyOTP(String email, String otpCode) {
        Optional<OTPVerification> otpOptional = otpRepository.findByEmailAndOtpCode(email, otpCode);

        if (otpOptional.isEmpty()) {
            log.warn("OTP not found for email: {}", EmailMaskingUtil.maskEmail(email));
            return false;
        }

        OTPVerification otp = otpOptional.get();

        // Kiểm tra OTP còn hợp lệ không
        if (!otp.isValid()) {
            // Tăng số lần thử
            if (otp.getAttempts() == null) {
                otp.setAttempts(1);
            } else {
                otp.setAttempts(otp.getAttempts() + 1);
            }
            otpRepository.save(otp);

            if (otp.isExpired()) {
                log.warn("OTP expired for email: {}", EmailMaskingUtil.maskEmail(email));
                throw new IllegalArgumentException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới!");
            }

            if (otp.getAttempts() >= 5) {
                log.warn("OTP max attempts reached for email: {}", EmailMaskingUtil.maskEmail(email));
                throw new IllegalArgumentException("Quá nhiều lần thử sai. Vui lòng yêu cầu mã OTP mới!");
            }

            log.warn("Invalid OTP for email: {}", EmailMaskingUtil.maskEmail(email));
            return false;
        }

        // Đánh dấu OTP là đã sử dụng
        otp.setIsUsed(true);
        otpRepository.save(otp);

        log.info("OTP verified successfully for email: {}", EmailMaskingUtil.maskEmail(email));
        return true;
    }

    @Override
    public OTPVerification getLatestOTP(String email) {
        return otpRepository.findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã OTP hợp lệ. Vui lòng yêu cầu mã mới!"));
    }
}

