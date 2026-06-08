package com.fptu.fcms.service;

import com.fptu.fcms.entity.OTPVerification;

public interface EmailService {

    /**
     * Gửi email xác thực OTP
     */
    void sendOTPEmail(String email, String otpCode);

    /**
     * Gửi email thông báo kích hoạt tài khoản thành công
     */
    void sendAccountActivationEmail(String email, String fullName);
}

