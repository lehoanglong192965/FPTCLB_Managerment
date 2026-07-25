IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentInstructionSentAt') IS NULL
    ALTER TABLE dbo.GuestEventRegistration ADD paymentInstructionSentAt DATETIME2 NULL;
IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentReminderSentAt') IS NULL
    ALTER TABLE dbo.GuestEventRegistration ADD paymentReminderSentAt DATETIME2 NULL;
IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentVerificationEmailSentAt') IS NULL
    ALTER TABLE dbo.GuestEventRegistration ADD paymentVerificationEmailSentAt DATETIME2 NULL;
IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentConfirmedEmailSentAt') IS NULL
    ALTER TABLE dbo.GuestEventRegistration ADD paymentConfirmedEmailSentAt DATETIME2 NULL;
IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentRejectedEmailSentAt') IS NULL
    ALTER TABLE dbo.GuestEventRegistration ADD paymentRejectedEmailSentAt DATETIME2 NULL;
IF COL_LENGTH('dbo.GuestEventRegistration', 'paymentExpiredEmailSentAt') IS NULL
    ALTER TABLE dbo.GuestEventRegistration ADD paymentExpiredEmailSentAt DATETIME2 NULL;
