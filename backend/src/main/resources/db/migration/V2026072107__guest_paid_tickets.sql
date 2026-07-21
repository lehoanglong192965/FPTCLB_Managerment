IF OBJECT_ID('dbo.GuestEventRegistration', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.GuestEventRegistration', 'ticketCode') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD ticketCode VARCHAR(255) NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'ticketIssuedAt') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD ticketIssuedAt DATETIME2 NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'ticketRevokedAt') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD ticketRevokedAt DATETIME2 NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentStatus') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD paymentStatus VARCHAR(32) NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'amountDue') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD amountDue DECIMAL(18,2) NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'amountPaid') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD amountPaid DECIMAL(18,2) NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentCurrency') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD paymentCurrency VARCHAR(3) NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentReference') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD paymentReference VARCHAR(64) NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentMethod') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD paymentMethod VARCHAR(32) NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'paidAt') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD paidAt DATETIME2 NULL;
    IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentExpiresAt') IS NULL
        ALTER TABLE dbo.GuestEventRegistration ADD paymentExpiresAt DATETIME2 NULL;

    EXEC sys.sp_executesql N'
        UPDATE dbo.GuestEventRegistration
           SET paymentStatus = COALESCE(paymentStatus, ''NOT_REQUIRED''),
               amountPaid = COALESCE(amountPaid, 0),
               paymentCurrency = COALESCE(paymentCurrency, ''VND'')
         WHERE isDeleted = 0;

        UPDATE dbo.GuestEventRegistration
           SET ticketCode = COALESCE(ticketCode, CONVERT(VARCHAR(36), NEWID())),
               ticketIssuedAt = COALESCE(ticketIssuedAt, SYSDATETIME())
         WHERE isDeleted = 0
           AND registrationStatus = ''CONFIRMED''
           AND paymentStatus IN (''NOT_REQUIRED'', ''PAID'');';
END;
