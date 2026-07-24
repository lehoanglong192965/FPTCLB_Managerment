IF OBJECT_ID('dbo.BankPaymentTransaction', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.BankPaymentTransaction (
        bankPaymentTransactionID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        provider VARCHAR(30) NOT NULL,
        providerTransactionId VARCHAR(100) NOT NULL,
        gateway VARCHAR(50) NULL,
        accountNumber VARCHAR(50) NULL,
        paymentReference VARCHAR(64) NULL,
        guestRegistrationID INT NULL,
        transferAmount DECIMAL(18,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        transferType VARCHAR(10) NULL,
        transferContent NVARCHAR(500) NULL,
        referenceCode VARCHAR(100) NULL,
        transactionDate DATETIME2 NULL,
        processingStatus VARCHAR(30) NOT NULL,
        processingMessage NVARCHAR(500) NULL,
        payloadHash CHAR(64) NOT NULL,
        createdAt DATETIME2 NOT NULL,
        processedAt DATETIME2 NULL
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_BankPaymentTransaction_ProviderTransaction'
      AND object_id = OBJECT_ID('dbo.BankPaymentTransaction')
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX UX_BankPaymentTransaction_ProviderTransaction
        ON dbo.BankPaymentTransaction(provider, providerTransactionId);');
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_BankPaymentTransaction_PaymentReference'
      AND object_id = OBJECT_ID('dbo.BankPaymentTransaction')
)
BEGIN
    EXEC(N'CREATE INDEX IX_BankPaymentTransaction_PaymentReference
        ON dbo.BankPaymentTransaction(paymentReference);');
END;
