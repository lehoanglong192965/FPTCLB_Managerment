IF OBJECT_ID(N'dbo.VnPayPaymentIntent', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VnPayPaymentIntent (
        vnpayPaymentIntentID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        transactionReference VARCHAR(40) NOT NULL,
        paymentReference VARCHAR(64) NOT NULL,
        registrationID INT NULL,
        guestRegistrationID INT NULL,
        amount DECIMAL(18,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        status VARCHAR(20) NOT NULL,
        createdAt DATETIME2 NOT NULL,
        expiresAt DATETIME2 NOT NULL,
        completedAt DATETIME2 NULL,
        providerTransactionId VARCHAR(100) NULL,
        CONSTRAINT CK_VnPayPaymentIntent_Target CHECK (
            (registrationID IS NOT NULL AND guestRegistrationID IS NULL)
            OR (registrationID IS NULL AND guestRegistrationID IS NOT NULL)
        )
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_VnPayPaymentIntent_TxnRef'
               AND object_id = OBJECT_ID(N'dbo.VnPayPaymentIntent'))
    CREATE UNIQUE INDEX UX_VnPayPaymentIntent_TxnRef
        ON dbo.VnPayPaymentIntent(transactionReference);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VnPayPaymentIntent_PaymentReference'
               AND object_id = OBJECT_ID(N'dbo.VnPayPaymentIntent'))
    CREATE INDEX IX_VnPayPaymentIntent_PaymentReference
        ON dbo.VnPayPaymentIntent(paymentReference);
