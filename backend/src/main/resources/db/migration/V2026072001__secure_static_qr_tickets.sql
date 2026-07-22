IF OBJECT_ID(N'dbo.EventRegistration', N'U') IS NULL
BEGIN
    ;THROW 51000, 'EventRegistration table is required before QR ticket migration.', 1;
END;

IF COL_LENGTH('dbo.EventRegistration', 'ticketCode') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration ADD ticketCode VARCHAR(50) NULL;
END;

IF COL_LENGTH('dbo.EventRegistration', 'ticketIssuedAt') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration ADD ticketIssuedAt DATETIME NULL;
END;

IF COL_LENGTH('dbo.EventRegistration', 'ticketRevokedAt') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration ADD ticketRevokedAt DATETIME NULL;
END;

UPDATE dbo.EventRegistration
SET ticketCode = CONVERT(VARCHAR(36), NEWID()),
    ticketIssuedAt = COALESCE(ticketIssuedAt, GETDATE())
WHERE ISNULL(isDeleted, 0) = 0
  AND (registrationStatus IN ('CONFIRMED', 'REGISTERED') OR status IN ('CONFIRMED', 'REGISTERED'))
  AND (ticketCode IS NULL OR LTRIM(RTRIM(ticketCode)) = '');

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.EventRegistration')
      AND name = N'UX_EventRegistration_TicketCode_Active'
)
BEGIN
    IF EXISTS (
        SELECT ticketCode
        FROM dbo.EventRegistration
        WHERE isDeleted = 0
          AND ticketCode IS NOT NULL
          AND ticketCode <> ''
        GROUP BY ticketCode
        HAVING COUNT_BIG(*) > 1
    )
    BEGIN
        ;THROW 51000, 'Cannot create QR ticket index because active ticket codes are duplicated.', 1;
    END;

    CREATE UNIQUE NONCLUSTERED INDEX UX_EventRegistration_TicketCode_Active
        ON dbo.EventRegistration(ticketCode)
        WHERE isDeleted = 0 AND ticketCode IS NOT NULL AND ticketCode <> '';
END;

IF OBJECT_ID(N'dbo.AttendanceRecord', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.AttendanceRecord')
         AND name = N'UX_AttendanceRecord_Session_Registration_NotNull'
   )
BEGIN
    IF EXISTS (
        SELECT sessionID, registrationID
        FROM dbo.AttendanceRecord
        WHERE isDeleted = 0 AND registrationID IS NOT NULL
        GROUP BY sessionID, registrationID
        HAVING COUNT_BIG(*) > 1
    )
    BEGIN
        ;THROW 51000, 'Cannot create attendance uniqueness index because registration records are duplicated.', 1;
    END;

    CREATE UNIQUE NONCLUSTERED INDEX UX_AttendanceRecord_Session_Registration_NotNull
        ON dbo.AttendanceRecord(sessionID, registrationID)
        WHERE isDeleted = 0 AND registrationID IS NOT NULL;
END;

IF OBJECT_ID(N'dbo.AttendanceRecord', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.AttendanceRecord')
         AND name = N'UX_AttendanceRecord_Session_GuestRegistration_NotNull'
   )
BEGIN
    IF EXISTS (
        SELECT sessionID, guestRegistrationID
        FROM dbo.AttendanceRecord
        WHERE isDeleted = 0 AND guestRegistrationID IS NOT NULL
        GROUP BY sessionID, guestRegistrationID
        HAVING COUNT_BIG(*) > 1
    )
    BEGIN
        ;THROW 51000, 'Cannot create attendance uniqueness index because guest records are duplicated.', 1;
    END;

    CREATE UNIQUE NONCLUSTERED INDEX UX_AttendanceRecord_Session_GuestRegistration_NotNull
        ON dbo.AttendanceRecord(sessionID, guestRegistrationID)
        WHERE isDeleted = 0 AND guestRegistrationID IS NOT NULL;
END;
