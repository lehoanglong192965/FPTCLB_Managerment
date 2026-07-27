package com.fptu.fcms.service;

import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;
import com.fptu.fcms.security.UserPrincipal;

import java.util.Map;

/**
 * Interface định nghĩa các dịch vụ tạo báo cáo tổng kết sự kiện tự động.
 * Layer: Service Interface.
 * Trách nhiệm chính: Khai báo hợp đồng dịch vụ cho việc lấy dữ liệu snapshot, xem trước file PDF và nộp chính thức báo cáo tự động.
 * Phụ thuộc/Sử dụng: Được triển khai bởi AutomaticEventReportServiceImpl và được gọi bởi ReportController.
 */
public interface AutomaticEventReportService {

    /**
     * Lấy dữ liệu snapshot tự động cho sự kiện.
     * @param eventId ID sự kiện
     * @param currentUser Người dùng thao tác
     * @return Snapshot tổng hợp chỉ số sự kiện
     */
    EventReportSnapshot getAutoData(Integer eventId, UserPrincipal currentUser);

    /**
     * Dựng mảng byte của file PDF xem trước báo cáo sự kiện.
     * @param eventId ID sự kiện
     * @param request Nhận xét của Ban tổ chức
     * @param currentUser Người dùng thao tác
     * @return Mảng byte của file PDF
     */
    byte[] previewAuto(Integer eventId, AutomaticEventReportRequest request, UserPrincipal currentUser);

    /**
     * Nộp chính thức báo cáo tự động (xuất PDF + CSV minh chứng, lưu Cloudinary, ghi DB).
     * @param eventId ID sự kiện
     * @param request Nhận xét của Ban tổ chức
     * @param currentUser Người dùng thao tác
     * @return Map chứa thông báo kết quả và URL báo cáo
     */
    Map<String, String> submitAuto(Integer eventId, AutomaticEventReportRequest request, UserPrincipal currentUser);
}
