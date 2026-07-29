package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.GuestPaymentEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class GuestPaymentEmailServiceImpl implements GuestPaymentEmailService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM/yyyy");
    private static final NumberFormat MONEY_FORMATTER =
            NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"));

    private final EmailService emailService;

    @Value("${fcms.payment.bank-name}")
    private String bankName;

    @Value("${fcms.payment.sepay.account-number}")
    private String accountNumber;

    @Value("${fcms.payment.account-name}")
    private String accountName;

    @Value("${fcms.payment.bank-branch}")
    private String bankBranch;

    @Value("${fcms.guest.status-base-url}")
    private String guestStatusBaseUrl;

    @Value("${fcms.guest.lookup-url}")
    private String guestLookupUrl;

    @Override
    public void sendPaymentInstruction(
            GuestEventRegistration registration,
            Event event,
            String guestReference
    ) {
        String statusLink = trimTrailingSlash(guestStatusBaseUrl) + "/" + guestReference;
        String content = "Xin chào " + value(registration.getGuestFullName()) + ",\n\n"
                + "Chỗ của bạn đang được giữ tạm thời cho sự kiện \"" + value(event.getEventName()) + "\".\n"
                + "Vé chỉ được phát hành sau khi thanh toán được xác nhận.\n\n"
                + eventDetails(event)
                + paymentDetails(registration)
                + "\nTiếp tục thanh toán: " + statusLink + "\n"
                + "Tra cứu đăng ký: " + trimTrailingSlash(guestLookupUrl) + "\n\n"
                + "Vui lòng chuyển đúng số tiền và ghi chính xác mã đối chiếu. "
                + "Không chia sẻ đường dẫn tiếp tục thanh toán cho người khác.\n\n"
                + "Trân trọng,\nFPTU Club Management System";
        emailService.sendSimpleEmail(
                registration.getGuestEmail(),
                "[FPTU Clubs] Hoàn tất thanh toán - " + value(event.getEventName()),
                content,
                guestReference
        );
    }

    @Override
    public void sendPaymentReminder(GuestEventRegistration registration, Event event) {
        String content = "Xin chào " + value(registration.getGuestFullName()) + ",\n\n"
                + "Chỗ giữ cho sự kiện \"" + value(event.getEventName()) + "\" sắp hết hạn.\n\n"
                + paymentDetails(registration)
                + "\nNếu đã đóng trang thanh toán, hãy dùng mã đăng ký và email tại: "
                + trimTrailingSlash(guestLookupUrl) + "\n\n"
                + "Sau thời hạn trên, đăng ký sẽ tự động bị hủy và chỗ được trả lại.\n\n"
                + "Trân trọng,\nFPTU Club Management System";
        emailService.sendSimpleEmail(
                registration.getGuestEmail(),
                "[FPTU Clubs] Sắp hết hạn thanh toán - " + value(event.getEventName()),
                content
        );
    }

    @Override
    public void sendVerificationReceived(GuestEventRegistration registration, Event event) {
        emailService.sendSimpleEmail(
                registration.getGuestEmail(),
                "[FPTU Clubs] Đã tiếp nhận yêu cầu xác minh thanh toán",
                "Xin chào " + value(registration.getGuestFullName()) + ",\n\n"
                        + "Hệ thống đã ghi nhận bạn báo chuyển khoản cho sự kiện \""
                        + value(event.getEventName()) + "\".\n"
                        + "Mã đăng ký: " + value(registration.getRegistrationCode()) + "\n"
                        + "Mã đối chiếu: " + value(registration.getPaymentReference()) + "\n"
                        + "Thời điểm ghi nhận: " + formatDateTime(registration.getPaymentSubmittedAt()) + "\n\n"
                        + "Vé sẽ được gửi qua email ngay khi giao dịch được SePay hoặc ban tổ chức xác nhận.\n\n"
                        + "Trân trọng,\nFPTU Club Management System"
        );
    }

    @Override
    public void sendPaymentRejected(GuestEventRegistration registration, Event event) {
        emailService.sendSimpleEmail(
                registration.getGuestEmail(),
                "[FPTU Clubs] Thanh toán không được xác nhận - " + value(event.getEventName()),
                "Xin chào " + value(registration.getGuestFullName()) + ",\n\n"
                        + "Thanh toán cho mã đăng ký " + value(registration.getRegistrationCode())
                        + " không được xác nhận.\n"
                        + "Mã đối chiếu: " + value(registration.getPaymentReference()) + "\n"
                        + "Lý do: " + value(registration.getPaymentRejectionReason()) + "\n\n"
                        + "Đăng ký đã bị hủy và chỗ giữ tạm thời đã được giải phóng.\n\n"
                        + "Trân trọng,\nFPTU Club Management System"
        );
    }

    @Override
    public void sendPaymentExpired(GuestEventRegistration registration, Event event) {
        emailService.sendSimpleEmail(
                registration.getGuestEmail(),
                "[FPTU Clubs] Đăng ký đã hết hạn thanh toán - " + value(event.getEventName()),
                "Xin chào " + value(registration.getGuestFullName()) + ",\n\n"
                        + "Thời hạn thanh toán cho mã đăng ký " + value(registration.getRegistrationCode())
                        + " đã kết thúc lúc " + formatDateTime(registration.getPaymentExpiresAt()) + ".\n"
                        + "Đăng ký đã bị hủy và chỗ được trả lại cho sự kiện.\n\n"
                        + "Nếu sự kiện vẫn còn mở đăng ký, bạn có thể thực hiện một đăng ký mới.\n\n"
                        + "Trân trọng,\nFPTU Club Management System"
        );
    }

    private String eventDetails(Event event) {
        return "THÔNG TIN SỰ KIỆN\n"
                + "Tên sự kiện: " + value(event.getEventName()) + "\n"
                + "Mã sự kiện: " + value(event.getEventCode()) + "\n"
                + "Bắt đầu: " + formatDateTime(event.getStartDate()) + "\n"
                + "Kết thúc: " + formatDateTime(event.getEndDate()) + "\n"
                + "Địa điểm: " + value(event.getLocation()) + "\n\n";
    }

    private String paymentDetails(GuestEventRegistration registration) {
        return "THÔNG TIN THANH TOÁN\n"
                + "Mã đăng ký khách: " + value(registration.getRegistrationCode()) + "\n"
                + "Mã đối chiếu: " + value(registration.getPaymentReference()) + "\n"
                + "Số tiền: " + formatMoney(registration.getAmountDue()) + " "
                + valueOrDefault(registration.getPaymentCurrency(), "VND") + "\n"
                + "Ngân hàng: " + value(bankName) + "\n"
                + "Số tài khoản: " + value(accountNumber) + "\n"
                + "Chủ tài khoản: " + value(accountName) + "\n"
                + "Chi nhánh: " + value(bankBranch) + "\n"
                + "Nội dung chuyển khoản: " + value(registration.getPaymentReference()) + "\n"
                + "Hạn thanh toán: " + formatDateTime(registration.getPaymentExpiresAt()) + "\n";
    }

    private String formatMoney(BigDecimal amount) {
        return amount == null ? "0" : MONEY_FORMATTER.format(amount);
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "—" : value.format(DATE_TIME_FORMATTER);
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Configured guest URL must not be blank");
        }
        return value.replaceAll("/+$", "");
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private String valueOrDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
