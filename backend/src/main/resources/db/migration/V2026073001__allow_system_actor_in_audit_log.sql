-- ============================================================================
-- AuditLog.actorID: NOT NULL -> NULL
--
-- Mọi chuyển trạng thái tự động (EventLifecycleScheduler mở/đóng đăng ký, bắt
-- đầu/kết thúc sự kiện...) ghi audit với actorID = NULL (hành động hệ thống,
-- không có người thực hiện). Cột đang NOT NULL nên INSERT audit fail, kéo cả
-- transaction chuyển trạng thái rollback — hậu quả là chưa từng có sự kiện nào
-- tự mở đăng ký dù scheduler chạy đều. Thao tác thủ công không dính vì luôn có
-- currentUser.
--
-- Index IX_AuditLog_actorID phải drop trước khi ALTER COLUMN (SQL Server chặn
-- đổi nullability trên cột đang nằm trong index), xong tạo lại.
-- ============================================================================
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.AuditLog') AND name = 'actorID' AND is_nullable = 0
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.AuditLog') AND name = 'IX_AuditLog_actorID'
    )
        DROP INDEX IX_AuditLog_actorID ON dbo.AuditLog;

    ALTER TABLE dbo.AuditLog ALTER COLUMN actorID INT NULL;

    CREATE NONCLUSTERED INDEX IX_AuditLog_actorID ON dbo.AuditLog(actorID);
END;
