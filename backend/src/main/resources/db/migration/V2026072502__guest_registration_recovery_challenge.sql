IF COL_LENGTH('dbo.GuestVerificationOtp', 'purpose') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.GuestVerificationOtp ADD purpose NVARCHAR(30) NULL;');
END;

IF COL_LENGTH('dbo.GuestVerificationOtp', 'challengeHash') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.GuestVerificationOtp ADD challengeHash NVARCHAR(64) NULL;');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_GuestVerificationOtp_ChallengeHash'
      AND object_id = OBJECT_ID('dbo.GuestVerificationOtp')
)
BEGIN
    EXEC(N'CREATE INDEX IX_GuestVerificationOtp_ChallengeHash
        ON dbo.GuestVerificationOtp(challengeHash)
        WHERE challengeHash IS NOT NULL;');
END;
