IF COL_LENGTH('dbo.EventReport', 'status') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport
        ADD status NVARCHAR(30) NOT NULL
            CONSTRAINT DF_EventReport_Status DEFAULT 'UPLOADED';
END;

IF COL_LENGTH('dbo.EventReport', 'approvedBy') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD approvedBy INT NULL;
END;

IF COL_LENGTH('dbo.EventReport', 'approvedAt') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD approvedAt DATETIME2 NULL;
END;

IF COL_LENGTH('dbo.EventReport', 'rejectedBy') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD rejectedBy INT NULL;
END;

IF COL_LENGTH('dbo.EventReport', 'rejectedAt') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD rejectedAt DATETIME2 NULL;
END;

IF COL_LENGTH('dbo.EventReport', 'rejectionReason') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD rejectionReason NVARCHAR(MAX) NULL;
END;
