package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.security.UserPrincipal;

/**
 * Interface định nghĩa dịch vụ xuất dữ liệu sự kiện sang định dạng CSV.
 * Layer: Service Interface.
 * Trách nhiệm chính: Xuất danh sách đăng ký tham gia và danh sách chi tiết điểm danh của sự kiện ra định dạng file CSV.
 * Phụ thuộc/Sử dụng: Được triển khai bởi EventExportServiceImpl. Tái sử dụng dữ liệu từ EventReportingDataset do EventReportingDatasetService cung cấp để tạo dữ liệu minh chứng mà không cần truy vấn lại CSDL.
 */
public interface EventExportService {
    CsvExportResult exportRegistrations(Integer eventId, UserPrincipal currentUser);

    CsvExportResult exportAttendance(Integer eventId, UserPrincipal currentUser);

    CsvExportResult exportRegistrations(EventReportingDataset dataset);

    CsvExportResult exportRegistrations(EventReportingDataset dataset, boolean canViewGuestContact);

    CsvExportResult exportAttendance(EventReportingDataset dataset);
}
