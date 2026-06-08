package com.fptu.fcms.service;

import com.fptu.fcms.entity.OTPVerification;

public interface OTPService {

    /**
     * Tạo và gửi OTP xác thực cho email
     */
    void generateAndSendOTP(String email);

    /**
     * Kiểm tra và xác thực mã OTP
     */
    boolean verifyOTP(String email, String otpCode);

    /**
     * Lấy OTP gần đây nhất (chưa sử dụng) của email
     */
    OTPVerification getLatestOTP(String email);
}

