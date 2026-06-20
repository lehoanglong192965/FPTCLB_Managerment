package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private static final DateTimeFormatter INTERVIEW_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:baoduy214365@gmail.com}")
    private String senderEmail;

    @Override
    @Async
    public void sendOTPEmail(String email, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("FPTU Club <" + senderEmail + ">");
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
            message.setFrom("FPTU Club <" + senderEmail + ">");
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

    @Override
    @Async
    public void sendApplicationAcceptedEmail(
            String email,
            String studentName,
            LocalDateTime interviewTime,
            String interviewLocation,
            String clubName
    ) {
        String text = "Xin chào " + studentName + ",\n"
                + "Đơn ứng tuyển của bạn đã được chấp nhận vào vòng phỏng vấn.\n"
                + "Thời gian: " + interviewTime.format(INTERVIEW_TIME_FORMATTER) + "\n"
                + "Địa điểm: " + interviewLocation + "\n"
                + "Vui lòng tham gia đúng giờ.\n"
                + "Trân trọng,\n"
                + clubName;

        sendPlainTextEmail(
                email,
                "Thư mời phỏng vấn - " + clubName,
                text,
                "application accepted"
        );
    }

    @Override
    @Async
    public void sendApplicationRejectedEmail(String email, String clubName) {
        String text = "Cảm ơn bạn đã quan tâm tới " + clubName + ".\n"
                + "Rất tiếc hồ sơ của bạn chưa phù hợp với đợt tuyển này.\n"
                + "Chúc bạn thành công trong những cơ hội tiếp theo.";

        sendPlainTextEmail(
                email,
                "Thư phản hồi hồ sơ ứng tuyển - " + clubName,
                text,
                "application rejected"
        );
    }

    @Override
    @Async
    public void sendInterviewPassedEmail(String email, String clubName) {
        String text = "Chúc mừng!\n"
                + "Bạn đã vượt qua vòng phỏng vấn và chính thức trở thành thành viên " + clubName + ".";

        sendPlainTextEmail(
                email,
                "Thông báo kết quả phỏng vấn - " + clubName,
                text,
                "interview passed"
        );
    }

    @Override
    @Async
    public void sendInterviewFailedEmail(String email, String clubName) {
        String text = "Cảm ơn bạn đã tham gia phỏng vấn cùng " + clubName + ".\n"
                + "Rất tiếc bạn chưa phù hợp với vị trí tuyển dụng trong đợt này.";

        sendPlainTextEmail(
                email,
                "Thông báo kết quả phỏng vấn - " + clubName,
                text,
                "interview failed"
        );
    }

    @Override
    @Async
    public void sendSimpleEmail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("FPTU Club <" + senderEmail + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);

            mailSender.send(message);
            log.info("Simple email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Error sending simple email to: {}", to, e);
        }
    }

    private void sendPlainTextEmail(
            String email,
            String subject,
            String text,
            String emailType
    ) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("FPTU Club <" + senderEmail + ">");
            message.setTo(email);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("{} email sent successfully to: {}", emailType, email);
        } catch (Exception e) {
            log.error("Error sending {} email to: {}", emailType, email, e);
        }
    }
}
