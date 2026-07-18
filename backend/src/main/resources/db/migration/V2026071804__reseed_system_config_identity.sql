-- Some baseline/demo scripts insert explicit SystemConfig IDs with
-- IDENTITY_INSERT. Keep SQL Server's identity counter above the existing rows
-- so dynamically created admin configuration keys cannot reuse a primary key.
IF OBJECT_ID(N'dbo.SystemConfig', N'U') IS NOT NULL
BEGIN
    DECLARE @maxConfigID INT = ISNULL(
        (SELECT MAX(configID) FROM dbo.SystemConfig),
        0
    );
    DECLARE @reseedSql NVARCHAR(200) =
        N'DBCC CHECKIDENT (''dbo.SystemConfig'', RESEED, '
        + CONVERT(NVARCHAR(20), @maxConfigID)
        + N');';

    EXEC sys.sp_executesql @reseedSql;
END;
