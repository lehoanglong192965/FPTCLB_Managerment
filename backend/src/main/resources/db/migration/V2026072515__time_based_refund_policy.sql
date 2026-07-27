IF COL_LENGTH(N'dbo.EventRegistration', N'refundRate') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration ADD
        refundRate DECIMAL(5,2) NULL,
        refundPolicySnapshot NVARCHAR(500) NULL,
        refundCalculationNote NVARCHAR(500) NULL;
END;

IF COL_LENGTH(N'dbo.GuestEventRegistration', N'refundRate') IS NULL
BEGIN
    ALTER TABLE dbo.GuestEventRegistration ADD
        refundRate DECIMAL(5,2) NULL,
        refundPolicySnapshot NVARCHAR(500) NULL,
        refundCalculationNote NVARCHAR(500) NULL;
END;

-- SQL Server compiles a complete batch before executing ALTER TABLE. Dynamic
-- SQL delays compilation of the backfill until after the new columns exist.
EXEC sys.sp_executesql N'
    UPDATE dbo.EventRegistration
    SET refundRate = 100.00,
        refundPolicySnapshot = COALESCE(refundPolicySnapshot, N''LEGACY_FULL_REFUND''),
        refundCalculationNote = COALESCE(refundCalculationNote, N''Legacy refund created before the time-based refund policy.'')
    WHERE refundRate IS NULL
      AND paymentStatus IN (N''REFUND_PENDING'', N''REFUNDED'');
';

EXEC sys.sp_executesql N'
    UPDATE dbo.GuestEventRegistration
    SET refundRate = 100.00,
        refundPolicySnapshot = COALESCE(refundPolicySnapshot, N''LEGACY_FULL_REFUND''),
        refundCalculationNote = COALESCE(refundCalculationNote, N''Legacy refund created before the time-based refund policy.'')
    WHERE refundRate IS NULL
      AND paymentStatus IN (N''REFUND_PENDING'', N''REFUNDED'');
';
