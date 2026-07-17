IF COL_LENGTH('dbo.RecruitmentCycle', 'clubID') IS NULL
BEGIN
    ALTER TABLE dbo.RecruitmentCycle ADD clubID INT NULL;
    ALTER TABLE dbo.RecruitmentCycle
        ADD CONSTRAINT FK_RecruitmentCycle_Club
        FOREIGN KEY (clubID) REFERENCES dbo.Club(clubID);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_RecruitmentCycle_Club_Status'
      AND object_id = OBJECT_ID('dbo.RecruitmentCycle')
)
BEGIN
    CREATE INDEX IX_RecruitmentCycle_Club_Status
        ON dbo.RecruitmentCycle(clubID, status, isDeleted);
END;
