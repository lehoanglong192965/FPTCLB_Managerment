IF COL_LENGTH('dbo.tblNotifications', 'actionUrl') IS NULL
BEGIN
    ALTER TABLE dbo.tblNotifications ADD actionUrl NVARCHAR(500) NULL;
END;

IF COL_LENGTH('dbo.tblNotifications', 'actionLabel') IS NULL
BEGIN
    ALTER TABLE dbo.tblNotifications ADD actionLabel NVARCHAR(100) NULL;
END;
