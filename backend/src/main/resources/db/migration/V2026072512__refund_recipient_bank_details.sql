-- Recipient bank details are collected only for refund processing. Never
-- store banking passwords, PINs, OTPs, card security codes, or login data.
IF COL_LENGTH(N'dbo.EventRegistration', N'refundBankName') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration ADD
        refundBankName NVARCHAR(100) NULL,
        refundAccountNumber NVARCHAR(50) NULL,
        refundAccountHolder NVARCHAR(150) NULL;
END;

IF COL_LENGTH(N'dbo.GuestEventRegistration', N'refundBankName') IS NULL
BEGIN
    ALTER TABLE dbo.GuestEventRegistration ADD
        refundBankName NVARCHAR(100) NULL,
        refundAccountNumber NVARCHAR(50) NULL,
        refundAccountHolder NVARCHAR(150) NULL;
END;
