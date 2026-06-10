package com.fptu.fcms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:baoduy214365@gmail.com}")
    private String senderEmail;

    @Override
    @Async
    public void sendOTPEmail(String email, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(email);
            message.setSubject("FPTU Club Management - Ma xac thuc OTP cua ban");

            // Soạn nội dung text thuần, dùng \n để xuống dòng
            String text = "Xin chào,\n\n"
                    + "Bạn đã yêu cầu xác thực tài khoản. Mã xác thực của bạn là: " + otpCode + "\n\n"
                    + "Lưu ý: Mã này sẽ hết hạn trong 10 phút. Tuyệt đối không chia sẻ mã này với bất kỳ ai.\n\n"
                    + "Trân trọng,\nFPTU Club Management System";

            message.setText(text);

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Error sending OTP email to: {}", email, e);
        }
    }

    @Override
    @Async
    public void sendAccountActivationEmail(String email, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(email);
            message.setSubject("FPTU Club Management - Tai khoan da duoc kich hoat");

            // Soạn nội dung text thuần, dùng \n để xuống dòng
            String text = "Xin chào " + fullName + ",\n\n"
                    + "Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công.\n"
                    + "Bạn hiện có thể đăng nhập vào hệ thống bằng email và mật khẩu của mình.\n\n"
                    + "Trân trọng,\nFPTU Club Management System";

            message.setText(text);

            mailSender.send(message);
            log.info("Account activation email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Error sending activation email to: {}", email, e);
        }
    }
}