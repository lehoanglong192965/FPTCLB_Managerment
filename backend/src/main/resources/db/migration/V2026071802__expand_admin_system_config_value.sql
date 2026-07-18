-- Admin-managed lists and version snapshots are stored as JSON config values.
-- Increase the previous 500-character limit so these values remain persistent.
IF OBJECT_ID(N'dbo.SystemConfig', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SystemConfig', N'configValue') IS NOT NULL
BEGIN
    ALTER TABLE dbo.SystemConfig ALTER COLUMN configValue NVARCHAR(MAX) NOT NULL;
END;
