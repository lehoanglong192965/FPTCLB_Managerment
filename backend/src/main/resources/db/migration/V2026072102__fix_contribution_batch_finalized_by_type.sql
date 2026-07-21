/*
 * ContributionBatch.finalizedBy stores the userID that finalized the batch.
 * Some databases created this column as DATETIME, which makes Hibernate try to
 * read a datetime value as Integer and breaks every ContributionBatch query.
 */
IF OBJECT_ID('dbo.ContributionBatch', 'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       JOIN sys.types t ON t.user_type_id = c.user_type_id
       WHERE c.object_id = OBJECT_ID('dbo.ContributionBatch')
         AND c.name = 'finalizedBy'
         AND t.name <> 'int'
   )
BEGIN
    DECLARE @defaultConstraint sysname;
    DECLARE @dropDefaultSql nvarchar(1000);

    SELECT @defaultConstraint = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.ContributionBatch')
      AND c.name = 'finalizedBy';

    IF @defaultConstraint IS NOT NULL
    BEGIN
        SET @dropDefaultSql = N'ALTER TABLE dbo.ContributionBatch DROP CONSTRAINT '
            + QUOTENAME(@defaultConstraint);
        EXEC sys.sp_executesql @dropDefaultSql;
    END;

    ALTER TABLE dbo.ContributionBatch ADD finalizedByUserID INT NULL;
    ALTER TABLE dbo.ContributionBatch DROP COLUMN finalizedBy;
    EXEC sys.sp_rename
        @objname = N'dbo.ContributionBatch.finalizedByUserID',
        @newname = N'finalizedBy',
        @objtype = N'COLUMN';
END;
