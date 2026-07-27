-- Local/shared databases may contain rows inserted with IDENTITY_INSERT after
-- the earlier identity repair migration ran. Align the identity counter with
-- the actual data without modifying an already-applied migration.
IF OBJECT_ID(N'dbo.SystemConfig', N'U') IS NOT NULL
BEGIN
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
END;
