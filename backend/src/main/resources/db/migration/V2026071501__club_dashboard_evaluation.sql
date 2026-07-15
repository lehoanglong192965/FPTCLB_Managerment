IF OBJECT_ID('dbo.ClubEvaluation', 'U') IS NULL
BEGIN
    EXEC(N'
        CREATE TABLE dbo.ClubEvaluation (
            evaluationID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClubEvaluation PRIMARY KEY,
            clubID INT NOT NULL,
            semesterID INT NOT NULL,
            kpiScore DECIMAL(8,2) NULL,
            suggestedDecision NVARCHAR(60) NULL,
            finalDecision NVARCHAR(60) NULL,
            previousFinalDecision NVARCHAR(60) NULL,
            overallComment NVARCHAR(MAX) NULL,
            strengths NVARCHAR(MAX) NULL,
            weaknesses NVARCHAR(MAX) NULL,
            improvementRequirements NVARCHAR(MAX) NULL,
            improvementDeadline DATE NULL,
            decisionReason NVARCHAR(MAX) NULL,
            evaluatedBy INT NULL,
            evaluatedAt DATETIME2 NULL,
            createdBy INT NULL,
            createdAt DATETIME2 NOT NULL CONSTRAINT DF_ClubEvaluation_CreatedAt DEFAULT SYSDATETIME(),
            updatedBy INT NULL,
            updatedAt DATETIME2 NULL,
            isDeleted BIT NOT NULL CONSTRAINT DF_ClubEvaluation_IsDeleted DEFAULT 0,
            CONSTRAINT FK_ClubEvaluation_Club FOREIGN KEY (clubID) REFERENCES dbo.Club(clubID),
            CONSTRAINT FK_ClubEvaluation_Semester FOREIGN KEY (semesterID) REFERENCES dbo.Semester(semesterID),
            CONSTRAINT FK_ClubEvaluation_EvaluatedBy FOREIGN KEY (evaluatedBy) REFERENCES dbo.UserAccount(userID)
        );
    ');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ClubEvaluation_Club_Semester'
      AND object_id = OBJECT_ID('dbo.ClubEvaluation')
)
BEGIN
    EXEC(N'CREATE INDEX IX_ClubEvaluation_Club_Semester ON dbo.ClubEvaluation(clubID, semesterID, isDeleted);');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ClubEvaluation_EvaluatedAt'
      AND object_id = OBJECT_ID('dbo.ClubEvaluation')
)
BEGIN
    EXEC(N'CREATE INDEX IX_ClubEvaluation_EvaluatedAt ON dbo.ClubEvaluation(evaluatedAt DESC);');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfig WHERE configKey = 'club.dashboard.kpi.weights')
BEGIN
    INSERT INTO dbo.SystemConfig (configKey, configValue, updatedAt, updatedBy)
    VALUES (
        'club.dashboard.kpi.weights',
        'eventCompletion=25;activeMember=20;attendance=20;reportOnTime=15;contribution=10;compliance=10',
        SYSDATETIME(),
        NULL
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfig WHERE configKey = 'club.dashboard.decision.rules')
BEGIN
    INSERT INTO dbo.SystemConfig (configKey, configValue, updatedAt, updatedBy)
    VALUES (
        'club.dashboard.decision.rules',
        'continueMin=80;improvementMin=60;warningMin=40;criticalWarningDecision=Suspend',
        SYSDATETIME(),
        NULL
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfig WHERE configKey = 'club.dashboard.thresholds')
BEGIN
    INSERT INTO dbo.SystemConfig (configKey, configValue, updatedAt, updatedBy)
    VALUES (
        'club.dashboard.thresholds',
        'minimumMembers=5;reportDeadlineDays=5;lowContributionScore=50;lowAttendanceRate=50;lowAiConfidence=0.60',
        SYSDATETIME(),
        NULL
    );
END;
