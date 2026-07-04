IF COL_LENGTH('dbo.EventContribution', 'registrationID') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD registrationID INT NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'attendanceRecordID') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD attendanceRecordID INT NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'assignmentID') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD assignmentID INT NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'membershipID') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD membershipID INT NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'clubRoleIDSnapshot') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD clubRoleIDSnapshot INT NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'clubRoleSnapshot') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD clubRoleSnapshot NVARCHAR(50) NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'individualRankingEligible') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution
        ADD individualRankingEligible BIT NOT NULL
            CONSTRAINT DF_EventContribution_IndividualRankingEligible DEFAULT 1;
END;

IF COL_LENGTH('dbo.EventContribution', 'tier') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD tier NVARCHAR(20) NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'rationale') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD rationale NVARCHAR(2000) NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'finalizedAt') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD finalizedAt DATETIME2 NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'finalizedBy') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution ADD finalizedBy INT NULL;
END;

IF COL_LENGTH('dbo.EventContribution', 'releasedToPerformance') IS NULL
BEGIN
    ALTER TABLE dbo.EventContribution
        ADD releasedToPerformance BIT NOT NULL
            CONSTRAINT DF_EventContribution_ReleasedToPerformance DEFAULT 0;
END;
