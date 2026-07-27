package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EvidenceMetadata;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;
import com.fptu.fcms.service.EventReportPdfRenderer;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventReportPdfRendererImpl implements EventReportPdfRenderer {

    private final TemplateEngine templateEngine;

    @Override
    public byte[] renderPdf(
            EventReportSnapshot snapshot,
            AutomaticEventReportRequest leaderComments,
            EvidenceMetadata evidenceMetadata,
            String authorName
    ) {
        String executiveSummary = buildExecutiveSummary(snapshot);

        Context context = new Context();
        context.setVariable("snapshot", snapshot);
        context.setVariable("comments", leaderComments != null ? leaderComments : new AutomaticEventReportRequest("", "", "", "", "", ""));
        context.setVariable("evidence", evidenceMetadata != null ? evidenceMetadata : new EvidenceMetadata("", 0, "", "", 0, "", ""));
        context.setVariable("authorName", authorName != null ? authorName : "Ban Chủ Nhiệm CLB");
        context.setVariable("executiveSummary", executiveSummary);

        String htmlContent = templateEngine.process("reports/event-report-template", context);

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();

            // Register Unicode TTF fonts for Vietnamese character rendering
            try (InputStream isReg = getClass().getResourceAsStream("/fonts/Arial-Regular.ttf");
                 InputStream isBold = getClass().getResourceAsStream("/fonts/Arial-Bold.ttf")) {

                if (isReg != null) {
                    byte[] regBytes = isReg.readAllBytes();
                    builder.useFont(() -> new ByteArrayInputStream(regBytes), "Arial", 400, PdfRendererBuilder.FontStyle.NORMAL, true);
                }
                if (isBold != null) {
                    byte[] boldBytes = isBold.readAllBytes();
                    builder.useFont(() -> new ByteArrayInputStream(boldBytes), "Arial", 700, PdfRendererBuilder.FontStyle.NORMAL, true);
                }
            } catch (Exception fontEx) {
                log.warn("Failed to load embedded Arial font for PDF rendering: {}", fontEx.getMessage());
            }

            builder.withHtmlContent(htmlContent, null);
            builder.toStream(os);
            builder.run();

            byte[] pdfBytes = os.toByteArray();
            log.info("PDF report successfully rendered. size={} bytes, eventCode={}", pdfBytes.length, snapshot.event().eventCode());
            return pdfBytes;
        } catch (IOException e) {
            log.error("Failed to render PDF report for event {}", snapshot.event().eventCode(), e);
            throw new IllegalStateException("Lỗi khi khởi tạo PDF báo cáo tổng kết sự kiện.", e);
        }
    }

    private String buildExecutiveSummary(EventReportSnapshot snapshot) {
        return String.format(
                "Sự kiện \"%s\" (Mã: %s) do %s tổ chức trong %s đã kết thúc. " +
                        "Hệ thống ghi nhận %d lượt đăng ký hợp lệ (gồm %d sinh viên FPTU và %d khách ngoài). " +
                        "Tổng cộng có %d người tham dự thực tế, đạt tỷ lệ tham dự %.2f%%. " +
                        "Về tài chính, tổng số tiền thực thu là %s %s trên tổng phải thu %s %s (đạt tỷ lệ thu %.2f%%). " +
                        "Số liệu minh chứng được ghi nhận với %d cảnh báo dữ liệu từ hệ thống.",
                snapshot.event().eventName(),
                snapshot.event().eventCode(),
                snapshot.event().clubName(),
                snapshot.event().semester(),
                snapshot.registrations().confirmedRegistrations(),
                snapshot.registrations().fptuRegistrations(),
                snapshot.registrations().guestRegistrations(),
                snapshot.attendance().presentParticipants(),
                snapshot.attendance().attendanceRate(),
                snapshot.payments().totalAmountPaid().toPlainString(),
                snapshot.event().currency(),
                snapshot.payments().totalAmountDue().toPlainString(),
                snapshot.event().currency(),
                snapshot.payments().collectionRate(),
                snapshot.warnings().size()
        );
    }
}
