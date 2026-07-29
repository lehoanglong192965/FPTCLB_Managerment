package com.fptu.fcms.dto.reporting;

/**
 * Data Transfer Object (DTO) chứa thông tin minh chứng và các mã băm SHA-256 bảo mật của bộ dữ liệu báo cáo.
 * Layer: DTO.
 * Trách nhiệm chính: Lưu giữ tên file CSV đăng ký/điểm danh, số dòng dữ liệu, mã băm SHA-256 từng file CSV và mã băm Data Hash tổng thể.
 * Phụ thuộc/Sử dụng: Được tạo ra bởi AutomaticEventReportServiceImpl sau khi xuất CSV, sau đó được truyền vào EventReportPdfRenderer để in trực tiếp lên trang cuối (Mục 10) của bản PDF báo cáo.
 */
public record EvidenceMetadata(
        String registrationFilename,
        int registrationRowCount,
        String registrationHash,
        String attendanceFilename,
        int attendanceRowCount,
        String attendanceHash,
        String reportDataHash
) {}
