/*
 * Guest OTPs now belong to GuestEventRegistration through guestRegistrationID.
 * Older databases still require the legacy eventRegistrationID column, causing
 * inserts for the new guest flow to fail because that value is intentionally null.
 */
IF OBJECT_ID(N'dbo.GuestVerificationOtp', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GuestVerificationOtp', N'eventRegistrationID') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns
       WHERE object_id = OBJECT_ID(N'dbo.GuestVerificationOtp')
         AND name = N'eventRegistrationID'
         AND is_nullable = 0
   )
BEGIN
    ALTER TABLE dbo.GuestVerificationOtp
        ALTER COLUMN eventRegistrationID INT NULL;
END;

