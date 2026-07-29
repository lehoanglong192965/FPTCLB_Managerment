package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.OTPVerification;
import com.fptu.fcms.repository.OTPVerificationRepository;
import com.fptu.fcms.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OTPServiceImplTest {

    private static final String EMAIL = "student@fpt.edu.vn";
    private static final String CORRECT_CODE = "123456";
    private static final String WRONG_CODE = "000000";

    @Mock
    private OTPVerificationRepository otpRepository;

    @Mock
    private EmailService emailService;

    private OTPServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new OTPServiceImpl(otpRepository, emailService);
    }

    private OTPVerification activeOtp() {
        LocalDateTime now = LocalDateTime.now();
        return OTPVerification.builder()
                .email(EMAIL)
                .otpCode(CORRECT_CODE)
                .createdAt(now)
                .expiresAt(now.plusMinutes(10))
                .isUsed(false)
                .attempts(0)
                .build();
    }

    private void givenPendingOtp(OTPVerification otp) {
        when(otpRepository.findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(otp));
    }

    @Test
    void verifyOTP_wrongCode_increasesAttempts() {
        OTPVerification otp = activeOtp();
        givenPendingOtp(otp);

        assertFalse(service.verifyOTP(EMAIL, WRONG_CODE));

        // Đây chính là lỗi P0-BE-2: tra cứu theo (email + code) khiến attempts đứng yên ở 0.
        assertEquals(1, otp.getAttempts());
    }

    @Test
    void verifyOTP_locksAfterMaxWrongAttempts() {
        OTPVerification otp = activeOtp();
        givenPendingOtp(otp);

        for (int i = 1; i < OTPVerification.MAX_ATTEMPTS; i++) {
            assertFalse(service.verifyOTP(EMAIL, WRONG_CODE), "lần thử sai thứ " + i + " chưa nên bị khoá");
        }

        assertThrows(IllegalArgumentException.class, () -> service.verifyOTP(EMAIL, WRONG_CODE));
        assertTrue(otp.isLocked());

        // Đã khoá thì mã đúng cũng không đổi được mật khẩu — buộc phải xin mã mới.
        assertThrows(IllegalArgumentException.class, () -> service.verifyOTP(EMAIL, CORRECT_CODE));
        assertFalse(otp.getIsUsed());
    }

    @Test
    void verifyOTP_correctCode_marksUsed() {
        OTPVerification otp = activeOtp();
        givenPendingOtp(otp);

        assertTrue(service.verifyOTP(EMAIL, CORRECT_CODE));
        assertTrue(otp.getIsUsed());
        assertEquals(0, otp.getAttempts());
    }

    @Test
    void verifyOTP_expiredCode_throws() {
        OTPVerification otp = activeOtp();
        otp.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        givenPendingOtp(otp);

        assertThrows(IllegalArgumentException.class, () -> service.verifyOTP(EMAIL, CORRECT_CODE));
    }

    @Test
    void verifyOTP_noPendingOtp_returnsFalse() {
        when(otpRepository.findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.empty());

        assertFalse(service.verifyOTP(EMAIL, CORRECT_CODE));
    }

    @Test
    void verifyOTP_nullCode_doesNotPass() {
        OTPVerification otp = activeOtp();
        givenPendingOtp(otp);

        assertFalse(service.verifyOTP(EMAIL, null));
        assertEquals(1, otp.getAttempts());
    }
}
