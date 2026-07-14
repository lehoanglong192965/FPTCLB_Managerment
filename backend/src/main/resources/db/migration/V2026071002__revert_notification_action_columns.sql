IF COL_LENGTH('dbo.tblNotifications', 'actionUrl') IS NOT NULL
BEGIN
    ALTER TABLE dbo.tblNotifications DROP COLUMN actionUrl;
END;

IF COL_LENGTH('dbo.tblNotifications', 'actionLabel') IS NOT NULL
BEGIN
    ALTER TABLE dbo.tblNotifications DROP COLUMN actionLabel;
END;
