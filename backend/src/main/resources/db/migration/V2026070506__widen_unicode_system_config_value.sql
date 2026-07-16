-- Follow-up to V2026070505: preserve Flyway checksum history while widening
-- legacy finite NVARCHAR configValue columns to the feature-supported length.
-- NVARCHAR(MAX) is deliberately left unchanged.

IF OBJECT_ID(N'dbo.SystemConfig', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SystemConfig', N'configValue') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns column_info
       JOIN sys.types type_info ON type_info.user_type_id = column_info.user_type_id
       WHERE column_info.object_id = OBJECT_ID(N'dbo.SystemConfig')
         AND column_info.name = N'configValue'
         AND type_info.name = N'nvarchar'
         AND column_info.max_length <> -1
         AND column_info.max_length < 1000
   )
BEGIN
    ALTER TABLE dbo.SystemConfig ALTER COLUMN configValue NVARCHAR(500) NOT NULL;
END;
GO
