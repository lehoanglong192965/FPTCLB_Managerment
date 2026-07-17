package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AIChatAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Lớp giao tiếp với Database để ghi nhận lịch sử các câu hỏi và câu trả lời của AI Chatbot.
// Đầu vào: Đối tượng log (chứa thông tin người dùng, trạng thái success/fallback, và thời gian thực hiện).
// Đầu ra: Lưu lịch sử hội thoại xuống cơ sở dữ liệu để tiện cho việc kiểm toán (Audit) và cải thiện hệ thống sau này.
@Repository
public interface AIChatAuditLogRepository extends JpaRepository<AIChatAuditLog, Integer> {
}
