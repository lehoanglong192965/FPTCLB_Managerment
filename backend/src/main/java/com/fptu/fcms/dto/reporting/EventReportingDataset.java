package com.fptu.fcms.dto.reporting;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.repository.projection.HistoricalUserView;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object (DTO) chứa toàn bộ dữ liệu thô (raw entities) của sự kiện được nạp 1 lần từ CSDL.
 * Layer: DTO.
 * Trách nhiệm chính: Đóng gói Event, danh sách đăng ký SV/Khách, phiên & bản ghi điểm danh, đánh giá feedback và map thông tin người dùng tại một thời điểm cố định.
 * Phụ thuộc/Sử dụng: Được nạp bởi EventReportingDatasetService.loadDataset(). Sau đó, bộ dataset này được truyền sang cho EventReportCalculationService (để tính toán snapshot) và EventExportService (để xuất file CSV minh chứng) mà không cần truy vấn lại CSDL.
 */
public record EventReportingDataset(
        Event event,
        List<EventRegistration> registrations,
        List<GuestEventRegistration> guestRegistrations,
        List<AttendanceSession> attendanceSessions,
        List<AttendanceRecord> attendanceRecords,
        List<EventFeedback> feedbacks,
        Map<Integer, HistoricalUserView> usersById,
        LocalDateTime capturedAt
) {}
