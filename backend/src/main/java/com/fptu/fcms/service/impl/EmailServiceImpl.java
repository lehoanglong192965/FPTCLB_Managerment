package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.*;
import com.fptu.fcms.util.EmailMaskingUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.util.HtmlUtils;
import jakarta.mail.internet.MimeMessage;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private static final DateTimeFormatter INTERVIEW_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter EVENT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:baoduy214365@gmail.com}")
    private String senderEmail;

    @Override
    @Async
    public void sendOTPEmail(String email, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        try {
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
            log.info("OTP email sent successfully to: {}", EmailMaskingUtil.maskEmail(email));
        } catch (Exception e) {
            log.error("Error sending OTP email to: {}", EmailMaskingUtil.maskEmail(email), e);
        } finally {
            logEmailPreview(message, "OTP", otpCode);
        }
    }

    @Override
    @Async
    public void sendAccountActivationEmail(String email, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        try {
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
            log.info("Account activation email sent successfully to: {}", EmailMaskingUtil.maskEmail(email));
        } catch (Exception e) {
            log.error("Error sending account activation email to: {}", EmailMaskingUtil.maskEmail(email), e);
        } finally {
            logEmailPreview(message, "account activation", null);
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
    public void sendApplicationRejectedEmail(String email, String clubName, String reason) {
        String text = "Cảm ơn bạn đã quan tâm tới " + clubName + ".\n"
                + "Rất tiếc hồ sơ của bạn chưa phù hợp với đợt tuyển này.\n"
                + "Lý do: " + (reason != null ? reason : "Không đủ tiêu chí tuyển dụng") + "\n"
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
        SimpleMailMessage message = new SimpleMailMessage();
        try {
            message.setFrom("FPTU Club <" + senderEmail + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);

            mailSender.send(message);
            log.info("Simple email sent successfully to: {}", EmailMaskingUtil.maskEmail(to));
        } catch (Exception e) {
            log.error("Error sending simple email to: {}", EmailMaskingUtil.maskEmail(to), e);
        } finally {
            logEmailPreview(message, "simple", null);
        }
    }

    private void sendPlainTextEmail(
            String email,
            String subject,
            String text,
            String emailType
    ) {
        SimpleMailMessage message = new SimpleMailMessage();
        try {
            message.setFrom("FPTU Club <" + senderEmail + ">");
            message.setTo(email);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("{} email sent successfully to: {}", emailType, EmailMaskingUtil.maskEmail(email));
        } catch (Exception e) {
            log.error("Error sending {} email to: {}", emailType, EmailMaskingUtil.maskEmail(email), e);
        } finally {
            logEmailPreview(message, emailType, null);
        }
    }

    @Override
    @Async
    public void sendEventTicketConfirmationEmail(
            String email, String fullName, String eventName,
            LocalDateTime startDate, LocalDateTime endDate, String location,
            String ticketCode, BigDecimal amountPaid, String currency
    ) {
        if (email == null || email.isBlank() || ticketCode == null || ticketCode.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("FPTU Club <" + senderEmail + ">");
            helper.setTo(email);
            helper.setSubject("Đăng ký và thanh toán vé thành công - " + eventName);
            String paidText = amountPaid == null ? "—" : amountPaid.toPlainString() + " " + (currency == null ? "VND" : currency);
            String html = """
                    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033">
                      <h2 style="color:#e65318">Đăng ký vé thành công</h2>
                      <p>Xin chào <strong>%s</strong>,</p>
                      <p>Thanh toán của bạn đã được xác nhận. Vui lòng xuất trình QR bên dưới khi check-in.</p>
                      <table style="width:100%%;border-collapse:collapse">
                        <tr><td style="padding:6px;color:#667085">Sự kiện</td><td style="padding:6px"><strong>%s</strong></td></tr>
                        <tr><td style="padding:6px;color:#667085">Bắt đầu</td><td style="padding:6px">%s</td></tr>
                        <tr><td style="padding:6px;color:#667085">Kết thúc</td><td style="padding:6px">%s</td></tr>
                        <tr><td style="padding:6px;color:#667085">Địa điểm</td><td style="padding:6px">%s</td></tr>
                        <tr><td style="padding:6px;color:#667085">Đã thanh toán</td><td style="padding:6px">%s</td></tr>
                      </table>
                      <div style="text-align:center;margin:22px 0"><img src="cid:eventTicketQr" width="240" height="240" alt="QR vé sự kiện"/></div>
                      <p style="font-size:12px;color:#667085;word-break:break-all">Mã vé: %s</p>
                      <p>Trân trọng,<br/>FPTU Club Management System</p>
                    </div>
                    """.formatted(
                    escape(fullName), escape(eventName), formatTime(startDate), formatTime(endDate),
                    escape(location), escape(paidText), escape(ticketCode));
            helper.setText(html, true);
            helper.addInline("eventTicketQr", new ByteArrayResource(generateQrPng(ticketCode)), "image/png");
            mailSender.send(message);
            log.info("Event ticket confirmation email sent to: {}", EmailMaskingUtil.maskEmail(email));
        } catch (Exception e) {
            log.error("Error sending event ticket confirmation email to: {}", EmailMaskingUtil.maskEmail(email), e);
        }
    }

    @Override
    @Async
    public void sendEventTicketCancellationEmail(
            String email, String fullName, String eventName,
            LocalDateTime startDate, String ticketCode
    ) {
        String content = "Xin chào " + safe(fullName) + ",\n\n"
                + "Vé của bạn cho sự kiện \"" + safe(eventName) + "\" đã được hủy.\n"
                + "Thời gian: " + formatTime(startDate) + "\n"
                + "Mã vé đã thu hồi: " + safe(ticketCode) + "\n\n"
                + "Mã QR cũ không còn hiệu lực để check-in. Nếu vé đã thanh toán, vui lòng liên hệ ban tổ chức về chính sách hoàn tiền.\n\n"
                + "Trân trọng,\nFPTU Club Management System";
        sendPlainTextEmail(email, "Thông báo hủy vé - " + safe(eventName), content, "event ticket cancellation");
    }

    private byte[] generateQrPng(String value) throws Exception {
        var matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 320, 320);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return output.toByteArray();
        }
    }

    private String formatTime(LocalDateTime value) {
        return value == null ? "—" : value.format(EVENT_TIME_FORMATTER);
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(safe(value));
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private void logEmailPreview(SimpleMailMessage message, String emailType, String secretToRedact) {
        String recipient = message.getTo() != null && message.getTo().length > 0
                ? EmailMaskingUtil.maskEmail(message.getTo()[0])
                : "(unknown)";
        String content = message.getText() != null ? message.getText() : "(empty content)";
        if (secretToRedact != null && !secretToRedact.isBlank()) {
            content = content.replace(secretToRedact, "******");
        }

        log.info("""

                ==================== EMAIL PREVIEW ====================
                Type    : {}
                To      : {}
                Subject : {}
                ----------------------- CONTENT -----------------------
                {}
                ========================================================
                """,
                emailType,
                recipient,
                message.getSubject() != null ? message.getSubject() : "(no subject)",
                content);
    }
}
