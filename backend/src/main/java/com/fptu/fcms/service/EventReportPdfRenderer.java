package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EvidenceMetadata;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;

/**
 * Interface định nghĩa dịch vụ render file PDF báo cáo tổng kết sự kiện.
 * Layer: Service Interface.
 * Trách nhiệm chính: Khai báo hàm chuyển đổi thông tin snapshot, nhận xét ban tổ chức, thông tin minh chứng và tên tác giả thành file PDF dạng mảng byte.
 * Phụ thuộc/Sử dụng: Được triển khai bởi EventReportPdfRendererImpl. Được gọi bởi AutomaticEventReportServiceImpl khi xem trước hoặc nộp báo cáo tự động.
 */
public interface EventReportPdfRenderer {
    byte[] renderPdf(
            EventReportSnapshot snapshot,
            AutomaticEventReportRequest leaderComments,
            EvidenceMetadata evidenceMetadata,
            String authorName
    );
}
