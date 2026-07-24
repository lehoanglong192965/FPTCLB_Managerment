IF COL_LENGTH('dbo.Event', 'submissionAttemptCount') IS NULL
    ALTER TABLE dbo.Event ADD submissionAttemptCount INT NOT NULL
        CONSTRAINT DF_Event_submissionAttemptCount DEFAULT 0;

IF COL_LENGTH('dbo.Event', 'lastSubmittedAt') IS NULL
    ALTER TABLE dbo.Event ADD lastSubmittedAt DATETIME2 NULL;

IF COL_LENGTH('dbo.Event', 'submissionBlockedUntil') IS NULL
    ALTER TABLE dbo.Event ADD submissionBlockedUntil DATETIME2 NULL;
