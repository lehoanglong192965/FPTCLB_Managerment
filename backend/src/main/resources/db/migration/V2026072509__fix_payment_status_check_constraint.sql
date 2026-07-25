-- PaymentStatus enum đã có thêm AWAITING_VERIFICATION và REFUND_PENDING (dùng cho luồng xác nhận
-- chuyển khoản của guest/member) nhưng CHECK constraint trên cột paymentStatus của cả 2 bảng
-- EventRegistration và GuestEventRegistration chưa được cập nhật theo, khiến việc lưu 2 trạng thái
-- này bị SQL Server từ chối (DataIntegrityViolationException -> HTTP 409 "Data conflicts...").
DECLARE @eventRegConstraint SYSNAME;
SELECT TOP (1) @eventRegConstraint = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.EventRegistration')
  AND cc.definition LIKE N'%paymentStatus%';

IF @eventRegConstraint IS NOT NULL
BEGIN
    DECLARE @dropEventRegSql NVARCHAR(MAX) = N'ALTER TABLE dbo.EventRegistration DROP CONSTRAINT ' + QUOTENAME(@eventRegConstraint) + N';';
    EXEC sp_executesql @dropEventRegSql;
END;

ALTER TABLE dbo.EventRegistration WITH CHECK ADD CONSTRAINT CK_EventRegistration_PaymentStatus CHECK (
    paymentStatus IN (
        'NOT_REQUIRED', 'AWAITING_ELIGIBILITY', 'PENDING', 'AWAITING_VERIFICATION',
        'PAID', 'FAILED', 'EXPIRED', 'REFUND_PENDING', 'REFUNDED'
    )
);

DECLARE @guestRegConstraint SYSNAME;
SELECT TOP (1) @guestRegConstraint = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.GuestEventRegistration')
  AND cc.definition LIKE N'%paymentStatus%';

IF @guestRegConstraint IS NOT NULL
BEGIN
    DECLARE @dropGuestRegSql NVARCHAR(MAX) = N'ALTER TABLE dbo.GuestEventRegistration DROP CONSTRAINT ' + QUOTENAME(@guestRegConstraint) + N';';
    EXEC sp_executesql @dropGuestRegSql;
END;

ALTER TABLE dbo.GuestEventRegistration WITH CHECK ADD CONSTRAINT CK_GuestEventRegistration_PaymentStatus CHECK (
    paymentStatus IN (
        'NOT_REQUIRED', 'AWAITING_ELIGIBILITY', 'PENDING', 'AWAITING_VERIFICATION',
        'PAID', 'FAILED', 'EXPIRED', 'REFUND_PENDING', 'REFUNDED'
    )
);
