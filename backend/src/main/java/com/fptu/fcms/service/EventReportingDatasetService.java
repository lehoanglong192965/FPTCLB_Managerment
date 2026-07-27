package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.security.UserPrincipal;

/**
 * Interface định nghĩa dịch vụ nạp bộ dữ liệu thô (dataset) của sự kiện từ CSDL.
 * Layer: Service Interface.
 * Trách nhiệm chính: Khai báo hàm nạp 1 lần duy nhất toàn bộ thông tin sự kiện, đăng ký, điểm danh, đánh giá để phục vụ các bước xử lý báo cáo tiếp theo.
 * Phụ thuộc/Sử dụng: Được triển khai bởi EventReportingDatasetServiceImpl. Được gọi bởi AutomaticEventReportServiceImpl, kết quả trả về được chia sẻ dùng chung cho EventReportCalculationService và EventExportService mà không cần truy vấn lại CSDL.
 */
public interface EventReportingDatasetService {
    EventReportingDataset loadDataset(Integer eventId, UserPrincipal currentUser);
}
