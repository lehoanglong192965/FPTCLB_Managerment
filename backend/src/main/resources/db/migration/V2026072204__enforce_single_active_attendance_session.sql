SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_WARNINGS ON;
SET ANSI_PADDING ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;

IF EXISTS (
    SELECT eventID
    FROM dbo.AttendanceSession
    WHERE isDeleted = 0
    GROUP BY eventID
    HAVING COUNT_BIG(*) > 1
)
BEGIN
    THROW 51000, 'Cannot enforce one active attendance session per event because duplicate active sessions exist.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_AttendanceSession_Event_Active'
      AND object_id = OBJECT_ID('dbo.AttendanceSession')
)
BEGIN
    CREATE UNIQUE INDEX UX_AttendanceSession_Event_Active
        ON dbo.AttendanceSession(eventID)
        WHERE isDeleted = 0;
END;
