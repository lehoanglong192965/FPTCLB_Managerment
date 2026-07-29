-- Add the audit table mapped by PersonnelReassignLog. Existing two-phase
-- development databases may already have the Hibernate-created table.

SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.PersonnelReassignLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PersonnelReassignLog (
        logID INT IDENTITY(1, 1) NOT NULL,
        actorID INT NULL,
        actorName NVARCHAR(255) NULL,
        clubID INT NULL,
        clubName NVARCHAR(255) NULL,
        createdAt DATETIME2(6) NULL,
        fromName NVARCHAR(255) NULL,
        fromUserID INT NULL,
        isDeleted BIT NULL,
        level NVARCHAR(100) NULL,
        position VARCHAR(20) NULL,
        reason NVARCHAR(MAX) NULL,
        toName NVARCHAR(255) NULL,
        toUserID INT NULL,
        CONSTRAINT PK_PersonnelReassignLog PRIMARY KEY CLUSTERED (logID)
    );
END;
