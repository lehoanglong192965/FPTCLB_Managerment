-- Persist enough evidence to reconcile manual refunds. The application does
-- not initiate bank payouts; an authorized manager records the bank transfer
-- reference only after the money has actually been returned.
IF COL_LENGTH(N'dbo.EventRegistration', N'refundAmount') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration ADD
        refundAmount DECIMAL(18,2) NULL,
        refundRequestedAt DATETIME2 NULL,
        refundProcessedAt DATETIME2 NULL,
        refundProcessedBy INT NULL,
        refundTransactionReference NVARCHAR(100) NULL,
        refundNote NVARCHAR(500) NULL;
END;

IF COL_LENGTH(N'dbo.GuestEventRegistration', N'refundAmount') IS NULL
BEGIN
    ALTER TABLE dbo.GuestEventRegistration ADD
        refundAmount DECIMAL(18,2) NULL,
        refundRequestedAt DATETIME2 NULL,
        refundProcessedAt DATETIME2 NULL,
        refundProcessedBy INT NULL,
        refundTransactionReference NVARCHAR(100) NULL,
        refundNote NVARCHAR(500) NULL;
END;

CREATE INDEX IX_EventRegistration_RefundPending
    ON dbo.EventRegistration (paymentStatus, refundRequestedAt)
    WHERE paymentStatus = 'REFUND_PENDING' AND isDeleted = 0;

CREATE INDEX IX_GuestEventRegistration_RefundPending
    ON dbo.GuestEventRegistration (paymentStatus, refundRequestedAt)
    WHERE paymentStatus = 'REFUND_PENDING' AND isDeleted = 0;
