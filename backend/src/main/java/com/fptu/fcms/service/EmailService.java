package com.fptu.fcms.service;

import java.time.LocalDateTime;

public interface EmailService {

    /**
     * Gửi email xác thực OTP
     */
    void sendOTPEmail(String email, String otpCode);

    /**
     * Gửi email thông báo kích hoạt tài khoản thành công
     */
    void sendAccountActivationEmail(String email, String fullName);

    void sendApplicationAcceptedEmail(
            String email,
            String studentName,
            LocalDateTime interviewTime,
            String interviewLocation
    );

    void sendApplicationRejectedEmail(String email);

    void sendInterviewPassedEmail(String email);

    void sendInterviewFailedEmail(String email);
}

