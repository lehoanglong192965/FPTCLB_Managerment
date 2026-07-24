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
