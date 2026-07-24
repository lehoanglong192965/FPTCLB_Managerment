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
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom("FPTU Club <" + senderEmail + ">");
            helper.setTo(email);
            helper.setSubject("FPTU Club Management - Mã xác thực OTP của bạn");
            helper.setText(buildOtpEmailHtml(otpCode), true);

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", EmailMaskingUtil.maskEmail(email));
        } catch (Exception e) {
            log.error("Error sending OTP email to: {}", EmailMaskingUtil.maskEmail(email), e);
        }
    }

    private String buildOtpEmailHtml(String otpCode) {
        return """
                <div style="background:#F2F2F2;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif">
                  <table role="presentation" width="628" align="center" style="max-width:100%%;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border-collapse:collapse">
                    <tr>
                      <td width="628" height="169" align="center" valign="middle" style="background:#14224E">
                        <table role="presentation" align="center" style="margin:0 auto;border-collapse:collapse">
                          <tr>
                            <td style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#FF6B00,#FF8C33);box-shadow:0 4px 14px rgba(0,0,0,0.25);text-align:center;vertical-align:middle;font-size:26px;font-weight:800;color:#ffffff">F</td>
                            <td style="padding-left:12px;font-size:20px;font-weight:800;color:#F37021;letter-spacing:-0.3px">FPTU Clubs</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td width="628" height="68" align="center" valign="middle" style="padding:0 24px">
                        <div style="font-size:20px;font-weight:700;color:#1A1A1A;line-height:1.2">Xác nhận mã OTP</div>
                      </td>
                    </tr>
                    <tr>
                      <td width="628" height="244" valign="top" style="padding:12px 32px 16px;box-sizing:border-box">
                        <p style="margin:0 0 4px;font-size:14px;color:#1A1A1A">Xin chào,</p>
                        <p style="margin:0 0 10px;font-size:13px;color:#444444;line-height:1.4">Bạn vừa yêu cầu mã xác thực OTP. Vui lòng nhập mã bên dưới để tiếp tục:</p>
                        <div style="background:#F2F2F2;border-radius:10px;padding:12px 0;margin:0 0 10px;text-align:center;font-size:28px;font-weight:700;letter-spacing:8px;color:#000000">%s</div>
                        <p style="margin:0;font-size:13px;color:#444444;line-height:1.4">Mã có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này với bất kỳ ai, kể cả nhân viên FPTU Club.</p>
                      </td>
                    </tr>
                  </table>
                </div>
                """.formatted(escape(otpCode));
    }

    @Override
    @Async
    public void sendAccountActivationEmail(String email, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom("FPTU Club <" + senderEmail + ">");
            helper.setTo(email);
            helper.setSubject("FPTU Club Management - Tài khoản đã được kích hoạt");
            helper.setText(buildAccountActivationEmailHtml(fullName), true);

            mailSender.send(message);
            log.info("Account activation email sent successfully to: {}", EmailMaskingUtil.maskEmail(email));
        } catch (Exception e) {
            log.error("Error sending account activation email to: {}", EmailMaskingUtil.maskEmail(email), e);
        }
    }

    private String buildAccountActivationEmailHtml(String fullName) {
        return """
                <div style="background:#F2F2F2;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif">
                  <table role="presentation" width="628" align="center" style="max-width:100%%;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border-collapse:collapse">
                    <tr>
                      <td width="628" height="169" align="center" valign="middle" style="background:#14224E">
                        <table role="presentation" align="center" style="margin:0 auto;border-collapse:collapse">
                          <tr>
                            <td style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#FF6B00,#FF8C33);box-shadow:0 4px 14px rgba(0,0,0,0.25);text-align:center;vertical-align:middle;font-size:26px;font-weight:800;color:#ffffff">F</td>
                            <td style="padding-left:12px;font-size:20px;font-weight:800;color:#F37021;letter-spacing:-0.3px">FPTU Clubs</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td width="628" align="center" valign="middle" style="padding:24px 24px 4px">
                        <div style="font-size:20px;font-weight:700;color:#1A1A1A;line-height:1.2">Tài khoản đã được kích hoạt</div>
                      </td>
                    </tr>
                    <tr>
                      <td width="628" valign="top" style="padding:24px 32px 8px;box-sizing:border-box">
                        <p style="margin:0 0 14px;font-size:14px;color:#1A1A1A">Xin chào <strong>%s</strong>,</p>
                        <p style="margin:0 0 14px;font-size:13px;color:#444444;line-height:1.5">Cảm ơn bạn đã tạo tài khoản tại <strong>FPTU Club Management System</strong>.</p>
                        <p style="margin:0 0 14px;font-size:13px;color:#444444;line-height:1.5">Tài khoản của bạn hiện tại đã hoạt động. Bạn có thể đăng nhập bằng email và mật khẩu của mình để bắt đầu sử dụng hệ thống.</p>
                        <p style="margin:0 0 14px;font-size:13px;color:#444444;line-height:1.5">Sau khi đăng nhập, bạn có thể xem danh sách CLB, đăng ký tham gia sự kiện và theo dõi thông báo của mình.</p>
                        <p style="margin:0;font-size:13px;color:#444444;line-height:1.5">Trân trọng,<br/>FPTU Club Management System</p>
                      </td>
                    </tr>
                    <tr>
                      <td width="628" style="padding:0 32px">
                        <div style="border-top:1px solid #EDEDED"></div>
                      </td>
                    </tr>
                    <tr>
                      <td width="628" align="center" valign="middle" style="padding:24px 32px 32px">
                        <table role="presentation" align="center" style="margin:0 auto;border-collapse:collapse">
                          <tr>
                            <td style="border-radius:8px;background:linear-gradient(135deg,#FF6B00,#FF8C33)">
                              <a href="http://localhost:5173/login" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">Khám phá ngay!</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                """.formatted(escape(fullName));
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
