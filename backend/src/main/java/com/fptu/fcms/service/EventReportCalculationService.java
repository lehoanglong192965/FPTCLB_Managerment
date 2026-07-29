package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EventReportingDataset;

/**
 * Interface định nghĩa dịch vụ tính toán số liệu snapshot cho báo cáo sự kiện.
 * Layer: Service Interface.
 * Trách nhiệm chính: Tính toán toàn bộ các chỉ số thống kê (đăng ký, điểm danh, tài chính, vé, đánh giá, cảnh báo và độ sẵn sàng) từ bộ dữ liệu dataset.
 * Phụ thuộc/Sử dụng: Được triển khai bởi EventReportCalculationServiceImpl. Nhận vào EventReportingDataset do EventReportingDatasetService nạp và trả về EventReportSnapshot.
 */
public interface EventReportCalculationService {
    EventReportSnapshot calculateSnapshot(EventReportingDataset dataset);
}
