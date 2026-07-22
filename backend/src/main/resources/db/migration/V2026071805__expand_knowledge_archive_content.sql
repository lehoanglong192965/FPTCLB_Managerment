/*
 * Some legacy databases created KnowledgeArchive.content with a bounded
 * NVARCHAR length. Parsed Markdown/PDF content can be much larger, so keep the
 * complete Unicode document in NVARCHAR(MAX), matching the JPA entity.
 */
IF OBJECT_ID(N'dbo.KnowledgeArchive', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.KnowledgeArchive', N'content') IS NOT NULL
BEGIN
    ALTER TABLE dbo.KnowledgeArchive
        ALTER COLUMN content NVARCHAR(MAX) NOT NULL;
END;

