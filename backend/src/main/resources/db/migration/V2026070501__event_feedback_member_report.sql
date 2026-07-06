IF OBJECT_ID('dbo.EventFeedback', 'U') IS NULL
BEGIN
    EXEC(N'
        CREATE TABLE dbo.EventFeedback (
            feedbackID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_EventFeedback PRIMARY KEY,
            eventID INT NOT NULL,
            registrationID INT NULL,
            guestRegistrationID INT NULL,
            contentRating INT NOT NULL,
            organizationRating INT NOT NULL,
            logisticsRating INT NOT NULL,
            overallRating INT NOT NULL,
            comment NVARCHAR(MAX) NULL,
            isIncludedInExternalScore BIT NOT NULL CONSTRAINT DF_EventFeedback_IncludedInExternalScore DEFAULT 0,
            submittedAt DATETIME2 NOT NULL CONSTRAINT DF_EventFeedback_SubmittedAt DEFAULT SYSDATETIME(),
            createdAt DATETIME2 NULL,
            updatedAt DATETIME2 NULL,
            isDeleted BIT NOT NULL CONSTRAINT DF_EventFeedback_IsDeleted DEFAULT 0
        );
    ');
END;

IF COL_LENGTH('dbo.EventFeedback', 'guestRegistrationID') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.EventFeedback ADD guestRegistrationID INT NULL;');
END;

IF COL_LENGTH('dbo.EventFeedback', 'isIncludedInExternalScore') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.EventFeedback ADD isIncludedInExternalScore BIT NOT NULL CONSTRAINT DF_EventFeedback_IncludedInExternalScore DEFAULT 0;');
END;

IF COL_LENGTH('dbo.EventFeedback', 'submittedAt') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.EventFeedback ADD submittedAt DATETIME2 NOT NULL CONSTRAINT DF_EventFeedback_SubmittedAt DEFAULT SYSDATETIME();');
END;

IF COL_LENGTH('dbo.EventFeedback', 'createdAt') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.EventFeedback ADD createdAt DATETIME2 NULL;');
END;

IF COL_LENGTH('dbo.EventFeedback', 'updatedAt') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.EventFeedback ADD updatedAt DATETIME2 NULL;');
END;

IF COL_LENGTH('dbo.EventFeedback', 'isDeleted') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.EventFeedback ADD isDeleted BIT NOT NULL CONSTRAINT DF_EventFeedback_IsDeleted DEFAULT 0;');
END;

EXEC(N'
    UPDATE dbo.EventFeedback
    SET createdAt = COALESCE(createdAt, submittedAt, SYSDATETIME())
    WHERE createdAt IS NULL;
');

EXEC(N'
    UPDATE dbo.EventFeedback
    SET updatedAt = COALESCE(updatedAt, createdAt, submittedAt, SYSDATETIME())
    WHERE updatedAt IS NULL;
');

EXEC(N'
    WITH duplicate_feedback AS (
        SELECT feedbackID,
               ROW_NUMBER() OVER (
                   PARTITION BY eventID, registrationID
                   ORDER BY submittedAt DESC, feedbackID DESC
               ) AS rn
        FROM dbo.EventFeedback
        WHERE registrationID IS NOT NULL
          AND isDeleted = 0
    )
    UPDATE feedback
    SET isDeleted = 1,
        updatedAt = SYSDATETIME()
    FROM dbo.EventFeedback feedback
    INNER JOIN duplicate_feedback duplicate
        ON feedback.feedbackID = duplicate.feedbackID
    WHERE duplicate.rn > 1;
');

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_EventFeedback_Event_Registration'
      AND object_id = OBJECT_ID('dbo.EventFeedback')
)
BEGIN
    EXEC(N'CREATE INDEX IX_EventFeedback_Event_Registration ON dbo.EventFeedback(eventID, registrationID);');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_EventFeedback_Event_GuestRegistration'
      AND object_id = OBJECT_ID('dbo.EventFeedback')
)
BEGIN
    EXEC(N'CREATE INDEX IX_EventFeedback_Event_GuestRegistration ON dbo.EventFeedback(eventID, guestRegistrationID);');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_EventFeedback_Event_Registration_Active'
      AND object_id = OBJECT_ID('dbo.EventFeedback')
)
BEGIN
    EXEC(N'
        CREATE UNIQUE INDEX UX_EventFeedback_Event_Registration_Active
            ON dbo.EventFeedback(eventID, registrationID)
            WHERE registrationID IS NOT NULL AND isDeleted = 0;
    ');
END;