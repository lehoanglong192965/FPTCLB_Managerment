IF COL_LENGTH('dbo.EventReport', 'cloudinaryPublicId') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD cloudinaryPublicId NVARCHAR(500) NULL;
END;

IF COL_LENGTH('dbo.EventReport', 'originalFilename') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD originalFilename NVARCHAR(500) NULL;
END;

IF COL_LENGTH('dbo.EventReport', 'fileSize') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD fileSize BIGINT NULL;
END;

IF COL_LENGTH('dbo.EventReport', 'mimeType') IS NULL
BEGIN
    ALTER TABLE dbo.EventReport ADD mimeType NVARCHAR(100) NULL;
END;
