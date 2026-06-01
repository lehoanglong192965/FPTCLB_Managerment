package com.fptu.fcms.repository;

import com.fptu.fcms.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository cho AuditLog — ghi vết mọi thao tác nhạy cảm.
 *
 * Mọi hành động Bổ nhiệm / Bãi nhiệm Leader đều được ghi vào bảng AuditLog
 * để phục vụ kiểm toán hệ thống.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    // Sử dụng save() mặc định từ JpaRepository để lưu audit log
    // Có thể bổ sung các query tìm kiếm audit theo actorID, actionType, tableName khi cần
}