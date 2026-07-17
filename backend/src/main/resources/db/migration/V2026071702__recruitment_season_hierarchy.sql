IF COL_LENGTH('dbo.RecruitmentCycle', 'parentCycleID') IS NULL
BEGIN
    ALTER TABLE dbo.RecruitmentCycle ADD parentCycleID INT NULL;
    ALTER TABLE dbo.RecruitmentCycle
        ADD CONSTRAINT FK_RecruitmentCycle_Parent
        FOREIGN KEY (parentCycleID) REFERENCES dbo.RecruitmentCycle(cycleID);
END;

IF COL_LENGTH('dbo.RecruitmentCycle', 'semesterID') IS NULL
BEGIN
    ALTER TABLE dbo.RecruitmentCycle ADD semesterID INT NULL;
    ALTER TABLE dbo.RecruitmentCycle
        ADD CONSTRAINT FK_RecruitmentCycle_Semester
        FOREIGN KEY (semesterID) REFERENCES dbo.Semester(semesterID);
END;

IF COL_LENGTH('dbo.RecruitmentCycle', 'endDate') IS NULL
BEGIN
    ALTER TABLE dbo.RecruitmentCycle ADD endDate DATE NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_RecruitmentCycle_Parent_Club'
      AND object_id = OBJECT_ID('dbo.RecruitmentCycle')
)
BEGIN
    CREATE INDEX IX_RecruitmentCycle_Parent_Club
        ON dbo.RecruitmentCycle(parentCycleID, clubID, status, isDeleted);
END;
