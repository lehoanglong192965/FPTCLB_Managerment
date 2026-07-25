-- Local/shared databases may contain rows inserted with IDENTITY_INSERT after
-- the earlier identity repair migration ran. Align the identity counter with
-- the actual data before inserting new configuration rows.
DECLARE @maxConfigID INT = ISNULL(
    (SELECT MAX(configID) FROM dbo.SystemConfig),
    0
);
DECLARE @currentIdentity NUMERIC(38, 0) = IDENT_CURRENT(N'dbo.SystemConfig');

IF @currentIdentity < @maxConfigID
BEGIN
    DECLARE @reseedSql NVARCHAR(200) =
        N'DBCC CHECKIDENT (''dbo.SystemConfig'', RESEED, '
        + CONVERT(NVARCHAR(20), @maxConfigID)
        + N');';

    EXEC sys.sp_executesql @reseedSql;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfig WHERE configKey = 'EVENT_SUBMISSION_MAX_ATTEMPTS')
BEGIN
    INSERT INTO dbo.SystemConfig (configKey, configValue, updatedAt, updatedBy)
    VALUES ('EVENT_SUBMISSION_MAX_ATTEMPTS', '3', SYSDATETIME(), NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfig WHERE configKey = 'EVENT_SUBMISSION_COOLDOWN_HOURS')
BEGIN
    INSERT INTO dbo.SystemConfig (configKey, configValue, updatedAt, updatedBy)
    VALUES ('EVENT_SUBMISSION_COOLDOWN_HOURS', '24', SYSDATETIME(), NULL);
END;
