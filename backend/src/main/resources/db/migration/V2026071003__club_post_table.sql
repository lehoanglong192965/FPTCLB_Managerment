IF OBJECT_ID('dbo.ClubPost', 'U') IS NULL
BEGIN
    EXEC(N'
        CREATE TABLE dbo.ClubPost (
            postID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClubPost PRIMARY KEY,
            clubID INT NOT NULL,
            createdBy INT NOT NULL,
            content NVARCHAR(MAX) NOT NULL,
            createdAt DATETIME2 NOT NULL CONSTRAINT DF_ClubPost_CreatedAt DEFAULT SYSDATETIME(),
            isDeleted BIT NOT NULL CONSTRAINT DF_ClubPost_IsDeleted DEFAULT 0
        );
    ');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ClubPost_Club_CreatedAt'
      AND object_id = OBJECT_ID('dbo.ClubPost')
)
BEGIN
    EXEC(N'CREATE INDEX IX_ClubPost_Club_CreatedAt ON dbo.ClubPost(clubID, createdAt DESC);');
END;
