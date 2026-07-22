/* Event descriptions are limited by word count in the application, so the
 * database column must not retain the legacy NVARCHAR(500) character limit. */
IF OBJECT_ID('dbo.Event', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.Event', 'description') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Event ALTER COLUMN description NVARCHAR(MAX) NULL;
END;
