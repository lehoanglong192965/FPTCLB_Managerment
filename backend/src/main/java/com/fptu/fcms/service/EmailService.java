package com.fptu.fcms.service;

import java.time.LocalDateTime;
import java.math.BigDecimal;

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

    void sendApplicationRejectedEmail(String email, String clubName, String reason);

    void sendInterviewPassedEmail(String email, String clubName);

    void sendInterviewFailedEmail(String email, String clubName);

    /**
     * Gửi email dạng text thuần với Subject và Content tùy chỉnh
     */
    void sendSimpleEmail(String to, String subject, String content);

    void sendEventTicketConfirmationEmail(
            String email, String fullName, String eventName,
            LocalDateTime startDate, LocalDateTime endDate, String location,
            String ticketCode, BigDecimal amountPaid, String currency
    );

    void sendEventTicketCancellationEmail(
            String email, String fullName, String eventName,
            LocalDateTime startDate, String ticketCode
    );
}

