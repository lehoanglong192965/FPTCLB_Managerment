IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentSubmittedAt') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.GuestEventRegistration ADD paymentSubmittedAt DATETIME2 NULL;');
END;

IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentReviewedAt') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.GuestEventRegistration ADD paymentReviewedAt DATETIME2 NULL;');
END;

IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentReviewedBy') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.GuestEventRegistration ADD paymentReviewedBy INT NULL;');
END;

IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentRejectionReason') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.GuestEventRegistration ADD paymentRejectionReason NVARCHAR(500) NULL;');
END;
