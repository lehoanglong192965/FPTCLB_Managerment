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
            String interviewLocation,
            String clubName
    );

    void sendApplicationRejectedEmail(String email, String clubName);

    void sendInterviewPassedEmail(String email, String clubName);

    void sendInterviewFailedEmail(String email, String clubName);

    void sendEventReportReminderEmail(String email, String eventName);
}

