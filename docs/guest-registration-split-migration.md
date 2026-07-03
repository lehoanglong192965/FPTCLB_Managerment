# Guest Registration Split Migration

Guest registrations now use `GuestEventRegistration` instead of `EventRegistration`.

For an existing SQL Server schema, run these adjustments before testing the guest OTP, attendance, and feedback flows:

```sql
IF OBJECT_ID('dbo.GuestEventRegistration', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GuestEventRegistration (
        guestRegistrationID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        eventID INT NOT NULL,
        guestFullName NVARCHAR(255) NOT NULL,
        guestEmail NVARCHAR(255) NOT NULL,
        guestEmailNormalized NVARCHAR(255) NOT NULL,
        guestPhone NVARCHAR(50) NOT NULL,
        guestPhoneNormalized NVARCHAR(50) NOT NULL,
        guestReferenceHash NVARCHAR(255) NOT NULL,
        schoolOrOrganization NVARCHAR(255) NULL,
        consentAccepted BIT NULL,
        discoverySource NVARCHAR(50) NULL,
        participantType NVARCHAR(50) NOT NULL DEFAULT 'GUEST',
        participantTypeSnapshotAt DATETIME2 NULL,
        registrationStatus NVARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
        registrationChannel NVARCHAR(50) NOT NULL DEFAULT 'ONLINE',
        status NVARCHAR(50) NULL,
        registeredAt DATETIME2 NULL,
        registrationCode NVARCHAR(100) NULL,
        waitlistPosition INT NULL,
        verifiedAt DATETIME2 NULL,
        cancelledAt DATETIME2 NULL,
        createdAt DATETIME2 NULL,
        createdBy INT NULL,
        updatedAt DATETIME2 NULL,
        updatedBy INT NULL,
        isDeleted BIT NULL DEFAULT 0
    );
END;

IF COL_LENGTH('dbo.GuestVerificationOtp', 'guestRegistrationID') IS NULL
BEGIN
    ALTER TABLE dbo.GuestVerificationOtp ADD guestRegistrationID INT NULL;
END;

IF COL_LENGTH('dbo.GuestVerificationOtp', 'eventRegistrationID') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GuestVerificationOtp ALTER COLUMN eventRegistrationID INT NULL;
END;

IF COL_LENGTH('dbo.AttendanceRecord', 'guestRegistrationID') IS NULL
BEGIN
    ALTER TABLE dbo.AttendanceRecord ADD guestRegistrationID INT NULL;
END;

IF OBJECT_ID('dbo.UK_AttendanceRecord_Session_Registration', 'UQ') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AttendanceRecord DROP CONSTRAINT UK_AttendanceRecord_Session_Registration;
END;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AttendanceRecord_Session_GuestRegistration')
BEGIN
    DROP INDEX IX_AttendanceRecord_Session_GuestRegistration ON dbo.AttendanceRecord;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AttendanceRecord_Session_GuestRegistration')
BEGIN
    CREATE INDEX IX_AttendanceRecord_Session_GuestRegistration ON dbo.AttendanceRecord(sessionID, guestRegistrationID);
END;

UPDATE dbo.AttendanceRecord SET isDeleted = 0 WHERE isDeleted IS NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_AttendanceRecord_Session_Registration_NotNull' AND object_id = OBJECT_ID('dbo.AttendanceRecord'))
BEGIN
    CREATE UNIQUE INDEX UX_AttendanceRecord_Session_Registration_NotNull
        ON dbo.AttendanceRecord(sessionID, registrationID)
        WHERE registrationID IS NOT NULL AND isDeleted = 0;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_AttendanceRecord_Session_GuestRegistration_NotNull' AND object_id = OBJECT_ID('dbo.AttendanceRecord'))
BEGIN
    CREATE UNIQUE INDEX UX_AttendanceRecord_Session_GuestRegistration_NotNull
        ON dbo.AttendanceRecord(sessionID, guestRegistrationID)
        WHERE guestRegistrationID IS NOT NULL AND isDeleted = 0;
END;

IF COL_LENGTH('dbo.EventFeedback', 'guestRegistrationID') IS NULL
BEGIN
    ALTER TABLE dbo.EventFeedback ADD guestRegistrationID INT NULL;
END;

IF COL_LENGTH('dbo.EventFeedback', 'registrationID') IS NOT NULL
BEGIN
    ALTER TABLE dbo.EventFeedback ALTER COLUMN registrationID INT NULL;
END;

IF COL_LENGTH('dbo.EventFeedbackInvitation', 'guestRegistrationID') IS NULL
BEGIN
    ALTER TABLE dbo.EventFeedbackInvitation ADD guestRegistrationID INT NULL;
END;

IF COL_LENGTH('dbo.EventFeedbackInvitation', 'registrationID') IS NOT NULL
BEGIN
    ALTER TABLE dbo.EventFeedbackInvitation ALTER COLUMN registrationID INT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GuestEventRegistration_GuestReferenceHash')
BEGIN
    CREATE INDEX IX_GuestEventRegistration_GuestReferenceHash ON dbo.GuestEventRegistration(guestReferenceHash);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FeedbackInvitation_Event_GuestRegistration')
BEGIN
    CREATE INDEX IX_FeedbackInvitation_Event_GuestRegistration ON dbo.EventFeedbackInvitation(eventID, guestRegistrationID);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EventFeedback_Event_GuestRegistration')
BEGIN
    CREATE INDEX IX_EventFeedback_Event_GuestRegistration ON dbo.EventFeedback(eventID, guestRegistrationID);
END;
```

`spring.jpa.hibernate.ddl-auto=update` can create missing mapped objects, but it will not reliably relax old `NOT NULL` columns or drop old unique constraints. The old `AttendanceRecord(sessionID, registrationID)` unique constraint must be dropped because guest rows keep `registrationID = NULL`; otherwise SQL Server can reject multiple guest attendance rows in the same session. If an existing database has unique constraints on `(eventID, registrationID)` in `EventFeedback` or `EventFeedbackInvitation`, drop and recreate them as filtered unique indexes for non-null `registrationID`, then add a matching filtered unique index for non-null `guestRegistrationID`.

