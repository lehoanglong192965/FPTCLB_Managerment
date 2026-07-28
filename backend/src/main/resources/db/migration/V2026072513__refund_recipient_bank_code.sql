IF COL_LENGTH(N'dbo.EventRegistration', N'refundBankCode') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration ADD refundBankCode VARCHAR(20) NULL;
END;

IF COL_LENGTH(N'dbo.GuestEventRegistration', N'refundBankCode') IS NULL
BEGIN
    ALTER TABLE dbo.GuestEventRegistration ADD refundBankCode VARCHAR(20) NULL;
END;

