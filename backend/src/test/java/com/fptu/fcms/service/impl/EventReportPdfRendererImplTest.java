package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EvidenceMetadata;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Lớp Unit Test cho EventReportPdfRendererImpl.
 * Layer: Test (Unit Test).
 * Trách nhiệm chính: Kiểm thử khả năng biên dịch mẫu HTML (Thymeleaf) và xuất ra file PDF hoàn chỉnh (OpenHTMLtoPDF), xác minh hỗ trợ hiển thị tiếng Việt Unicode, cấu trúc PDF hợp lệ và nội dung trích xuất chính xác.
 * 
 * Đầu vào: EventReportSnapshot, AutomaticEventReportRequest (nhận xét), EvidenceMetadata, tên người nộp.
 * Đầu ra: Mảng byte PDF (%PDF-...) và nội dung văn bản trích xuất kiểm tra chứa đúng tiêu đề & thông tin sự kiện.
 */
class EventReportPdfRendererImplTest {

    private EventReportPdfRendererImpl pdfRenderer;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");

        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);

        pdfRenderer = new EventReportPdfRendererImpl(templateEngine);
    }

    @Test
    @DisplayName("renderPdf renders real PDF with Vietnamese Unicode characters without error")
    void testRenderPdfWithVietnameseUnicode() throws Exception {
        EventReportSnapshot.EventOverview overview = new EventReportSnapshot.EventOverview(
                1, "EVT-TECH-01", "Hội thảo Công nghệ 2026", "CLB F-Code", "SPRING 2026", "Hội trường Alpha", "P.102", "Mô tả", false,
                LocalDateTime.of(2026, 7, 25, 9, 0), LocalDateTime.of(2026, 7, 25, 17, 0),
                LocalDateTime.of(2026, 7, 10, 8, 0), LocalDateTime.of(2026, 7, 24, 23, 59),
                LocalDateTime.of(2026, 7, 25, 8, 30), LocalDateTime.of(2026, 7, 25, 12, 0),
                200, true, true, BigDecimal.valueOf(100000), "VND", BigDecimal.valueOf(5000000), "COMPLETED"
        );

        EventReportSnapshot snapshot = new EventReportSnapshot(
                overview,
                new EventReportSnapshot.RegistrationMetrics(150, 140, 10, 0, 100, 40, 10, 93.33, 6.67, Map.of("CONFIRMED", 140), Map.of("FPTU", 100)),
                new EventReportSnapshot.TicketMetrics(140, 140, 0, 0, 20, 120, 100, 10, 1.4, 3),
                new EventReportSnapshot.PaymentMetrics(BigDecimal.valueOf(12000000), BigDecimal.valueOf(12000000), BigDecimal.ZERO, 120, 0, 0, 0, 20, 100.0, BigDecimal.valueOf(100000), BigDecimal.valueOf(240.0), Map.of("PAID", 120), Map.of("BANK_TRANSFER", 120)),
                new EventReportSnapshot.AttendanceMetrics(1, 140, 120, 20, 85.71, 14.29, 10, 90, 30, 110, 10, 10, Map.of("QR", 120), Map.of("SELF", 120)),
                new EventReportSnapshot.FeedbackMetrics(10, BigDecimal.valueOf(4.8), BigDecimal.valueOf(83.33)),
                List.of(new EventReportSnapshot.ReportWarning("INFO_OK", "INFO", "Thông tin", "Dữ liệu đầy đủ", 0, false)),
                new EventReportSnapshot.ReportReadiness(true, true, true, true, true, 0),
                LocalDateTime.now(), "1.0.0", "1.0.0"
        );

        AutomaticEventReportRequest comments = new AutomaticEventReportRequest(
                "Sự kiện thu hút đông đảo sinh viên tham gia nhiệt tình.",
                "Đạt 100% mục tiêu chuyên môn.",
                "Hệ thống âm thanh phòng họp bị trục trặc đầu giờ.",
                "Không có giải trình.",
                "Cần chuẩn bị mic dự phòng.",
                "Đề xuất tăng thêm 1 phiên Q&A."
        );

        EvidenceMetadata evidence = new EvidenceMetadata("reg.csv", 140, "HASH1", "att.csv", 120, "HASH2", "DATAHASH");

        byte[] pdfBytes = pdfRenderer.renderPdf(snapshot, comments, evidence, "Lê Hoàng Long");

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 1000);
        assertEquals('%', pdfBytes[0]);
        assertEquals('P', pdfBytes[1]);
        assertEquals('D', pdfBytes[2]);
        assertEquals('F', pdfBytes[3]);

        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            String extractedText = stripper.getText(document);

            assertNotNull(extractedText);
            assertTrue(extractedText.contains("BÁO CÁO TỔNG KẾT SỰ KIỆN") || extractedText.contains("Báo Cáo Tổng Kết Sự Kiện"));
            assertTrue(extractedText.contains("Hội thảo Công nghệ 2026"));
        }
    }
}
