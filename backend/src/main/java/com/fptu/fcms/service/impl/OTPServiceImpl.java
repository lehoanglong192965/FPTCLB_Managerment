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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
        // Tạo mã OTP 6 chữ số (dùng SecureRandom để không bị đoán trước).
        // Cận trên là 1_000_000 (exclusive) để phủ đủ dải 000000-999999.
        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));

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
    }

    @Override
    @Transactional
    public boolean verifyOTP(String email, String otpCode) {
        // Tra theo email, KHÔNG kèm otpCode: mã nhập sai vẫn phải tìm ra được bản ghi thì
        // attempts mới tăng lên. Tra theo (email + code) thì mọi lần đoán sai đều trả về
        // rỗng, bộ đếm đứng yên ở 0 và giới hạn MAX_ATTEMPTS không bao giờ chạm tới.
        Optional<OTPVerification> otpOptional =
                otpRepository.findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(email);

        if (otpOptional.isEmpty()) {
            log.warn("OTP not found for email: {}", EmailMaskingUtil.maskEmail(email));
            return false;
        }

        OTPVerification otp = otpOptional.get();

        if (otp.isExpired()) {
            log.warn("OTP expired for email: {}", EmailMaskingUtil.maskEmail(email));
            throw new IllegalArgumentException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới!");
        }

        if (otp.isLocked()) {
            log.warn("OTP max attempts reached for email: {}", EmailMaskingUtil.maskEmail(email));
            throw new IllegalArgumentException("Quá nhiều lần thử sai. Vui lòng yêu cầu mã OTP mới!");
        }

        if (!matchesCode(otp.getOtpCode(), otpCode)) {
            int attempts = (otp.getAttempts() == null ? 0 : otp.getAttempts()) + 1;
            otp.setAttempts(attempts);
            otpRepository.save(otp);

            if (attempts >= OTPVerification.MAX_ATTEMPTS) {
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

    /** So khớp thời gian hằng định để không lộ dần mã đúng qua chênh lệch thời gian phản hồi. */
    private boolean matchesCode(String expected, String provided) {
        if (expected == null || provided == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public OTPVerification getLatestOTP(String email) {
        return otpRepository.findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã OTP hợp lệ. Vui lòng yêu cầu mã mới!"));
    }
}

