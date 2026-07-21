IF COL_LENGTH('dbo.EventReport', 'registrationEvidenceUrl') IS NULL
    ALTER TABLE dbo.EventReport ADD registrationEvidenceUrl NVARCHAR(1000) NULL;

IF COL_LENGTH('dbo.EventReport', 'registrationEvidencePublicId') IS NULL
    ALTER TABLE dbo.EventReport ADD registrationEvidencePublicId NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.EventReport', 'registrationEvidenceHash') IS NULL
    ALTER TABLE dbo.EventReport ADD registrationEvidenceHash CHAR(64) NULL;

IF COL_LENGTH('dbo.EventReport', 'attendanceEvidenceUrl') IS NULL
    ALTER TABLE dbo.EventReport ADD attendanceEvidenceUrl NVARCHAR(1000) NULL;

IF COL_LENGTH('dbo.EventReport', 'attendanceEvidencePublicId') IS NULL
    ALTER TABLE dbo.EventReport ADD attendanceEvidencePublicId NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.EventReport', 'attendanceEvidenceHash') IS NULL
    ALTER TABLE dbo.EventReport ADD attendanceEvidenceHash CHAR(64) NULL;

IF COL_LENGTH('dbo.EventReport', 'evidenceGeneratedAt') IS NULL
    ALTER TABLE dbo.EventReport ADD evidenceGeneratedAt DATETIME2 NULL;

IF COL_LENGTH('dbo.EventReport', 'evidenceRegistrationRowCount') IS NULL
    ALTER TABLE dbo.EventReport ADD evidenceRegistrationRowCount INT NULL;

IF COL_LENGTH('dbo.EventReport', 'evidenceAttendanceRowCount') IS NULL
    ALTER TABLE dbo.EventReport ADD evidenceAttendanceRowCount INT NULL;