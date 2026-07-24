IF OBJECT_ID('dbo.PaymentWebhookTransaction', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentWebhookTransaction (
        webhookTransactionID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        transactionId VARCHAR(100) NOT NULL,
        paymentReference VARCHAR(64) NULL,
        guestRegistrationID INT NULL,
        amount DECIMAL(18,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        transferContent NVARCHAR(500) NOT NULL,
        transferredAt DATETIME2 NULL,
        processingStatus VARCHAR(30) NOT NULL,
        processingMessage NVARCHAR(500) NULL,
        payloadHash CHAR(64) NOT NULL,
        createdAt DATETIME2 NOT NULL,
        processedAt DATETIME2 NULL
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_PaymentWebhookTransaction_TransactionId'
      AND object_id = OBJECT_ID('dbo.PaymentWebhookTransaction')
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX UX_PaymentWebhookTransaction_TransactionId
        ON dbo.PaymentWebhookTransaction(transactionId);');
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_PaymentWebhookTransaction_PaymentReference'
      AND object_id = OBJECT_ID('dbo.PaymentWebhookTransaction')
)
BEGIN
    EXEC(N'CREATE INDEX IX_PaymentWebhookTransaction_PaymentReference
        ON dbo.PaymentWebhookTransaction(paymentReference);');
END;
