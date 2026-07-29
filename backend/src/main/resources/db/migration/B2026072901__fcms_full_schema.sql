-- FCMS cumulative schema baseline at canonical version 2026072901.
-- Generated from a disposable SQL Server database after applying the
-- Azure/deploy checksum cohort and all schema migrations through V2026072901.
-- Schema only: no database creation, Flyway history, credentials, or business data.

SET ANSI_NULLS, ANSI_PADDING, ANSI_WARNINGS, ARITHABORT, CONCAT_NULL_YIELDS_NULL, QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

GO
PRINT N'Creating Table [dbo].[AIChatAuditLog]...';


GO
CREATE TABLE [dbo].[AIChatAuditLog] (
    [chatLogID]     INT            IDENTITY (1, 1) NOT NULL,
    [userID]        INT            NULL,
    [userPrompt]    NVARCHAR (MAX) NOT NULL,
    [aiResponse]    NVARCHAR (MAX) NOT NULL,
    [intentMatched] VARCHAR (50)   NULL,
    [tokensUsed]    INT            NOT NULL,
    [createdAt]     DATETIME       NOT NULL,
    [status]        VARCHAR (20)   NOT NULL,
    [citationsJson] NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([chatLogID] ASC)
);


GO
PRINT N'Creating Index [dbo].[AIChatAuditLog].[IX_AIChatAuditLog_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_AIChatAuditLog_userID]
    ON [dbo].[AIChatAuditLog]([userID] ASC);


GO
PRINT N'Creating Table [dbo].[AllowedEmailWhitelist]...';


GO
CREATE TABLE [dbo].[AllowedEmailWhitelist] (
    [whitelistID] INT           IDENTITY (1, 1) NOT NULL,
    [email]       VARCHAR (100) NOT NULL,
    [addedAt]     DATETIME      NOT NULL,
    [isDeleted]   BIT           NOT NULL,
    PRIMARY KEY CLUSTERED ([whitelistID] ASC)
);


GO
PRINT N'Creating Index [dbo].[AllowedEmailWhitelist].[UX_Whitelist_email]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Whitelist_email]
    ON [dbo].[AllowedEmailWhitelist]([email] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[AttendanceRecord]...';


GO
CREATE TABLE [dbo].[AttendanceRecord] (
    [recordID]                  INT            IDENTITY (1, 1) NOT NULL,
    [sessionID]                 INT            NOT NULL,
    [userID]                    INT            NULL,
    [registrationID]            INT            NULL,
    [guestRegistrationID]       INT            NULL,
    [participantTypeSnapshotAt] DATETIME       NULL,
    [participantTypeSnapshot]   VARCHAR (50)   NULL,
    [attendanceStatus]          VARCHAR (50)   NOT NULL,
    [checkInMethod]             VARCHAR (50)   NULL,
    [verificationMethod]        VARCHAR (50)   NULL,
    [checkedInBy]               INT            NULL,
    [checkedInAt]               DATETIME       NULL,
    [manualReason]              NVARCHAR (MAX) NULL,
    [overrideReason]            NVARCHAR (MAX) NULL,
    [note]                      NVARCHAR (MAX) NULL,
    [deviceInfoOrSource]        NVARCHAR (MAX) NULL,
    [capturedImgUrl]            VARCHAR (500)  NULL,
    [aiMatchConfidence]         DECIMAL (5, 2) NULL,
    [isVerifiedByAI]            BIT            NOT NULL,
    [markedAt]                  DATETIME       NOT NULL,
    [createdAt]                 DATETIME       NOT NULL,
    [updatedAt]                 DATETIME       NULL,
    [isDeleted]                 BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([recordID] ASC)
);


GO
PRINT N'Creating Index [dbo].[AttendanceRecord].[IX_AttendanceRecord_Session_GuestRegistration]...';


GO
CREATE NONCLUSTERED INDEX [IX_AttendanceRecord_Session_GuestRegistration]
    ON [dbo].[AttendanceRecord]([sessionID] ASC, [guestRegistrationID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[AttendanceRecord].[IX_AttendanceRecord_Session_User]...';


GO
CREATE NONCLUSTERED INDEX [IX_AttendanceRecord_Session_User]
    ON [dbo].[AttendanceRecord]([sessionID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[AttendanceRecord].[IX_AttendanceRecord_Session_Registration]...';


GO
CREATE NONCLUSTERED INDEX [IX_AttendanceRecord_Session_Registration]
    ON [dbo].[AttendanceRecord]([sessionID] ASC, [registrationID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[AttendanceRecord].[UX_AttendanceRecord_Session_Registration_NotNull]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AttendanceRecord_Session_Registration_NotNull]
    ON [dbo].[AttendanceRecord]([sessionID] ASC, [registrationID] ASC) WHERE ([registrationID] IS NOT NULL AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[AttendanceRecord].[UX_AttendanceRecord_Session_GuestRegistration_NotNull]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AttendanceRecord_Session_GuestRegistration_NotNull]
    ON [dbo].[AttendanceRecord]([sessionID] ASC, [guestRegistrationID] ASC) WHERE ([guestRegistrationID] IS NOT NULL AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[AttendanceRecord].[IX_AttendanceRecord_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_AttendanceRecord_userID]
    ON [dbo].[AttendanceRecord]([userID] ASC) WHERE ([isDeleted]=(0) AND [userID] IS NOT NULL);


GO
PRINT N'Creating Table [dbo].[AttendanceSession]...';


GO
CREATE TABLE [dbo].[AttendanceSession] (
    [sessionID]        INT            IDENTITY (1, 1) NOT NULL,
    [eventID]          INT            NOT NULL,
    [sessionName]      NVARCHAR (100) NOT NULL,
    [checkInTime]      DATETIME       NOT NULL,
    [evidenceProofUrl] VARCHAR (500)  NULL,
    [status]           VARCHAR (30)   NOT NULL,
    [opensAt]          DATETIME       NULL,
    [closesAt]         DATETIME       NULL,
    [createdBy]        INT            NULL,
    [openedBy]         INT            NULL,
    [closedBy]         INT            NULL,
    [createdAt]        DATETIME       NOT NULL,
    [updatedAt]        DATETIME       NULL,
    [isDeleted]        BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([sessionID] ASC)
);


GO
PRINT N'Creating Index [dbo].[AttendanceSession].[UX_AttendanceSession_Event_Active]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AttendanceSession_Event_Active]
    ON [dbo].[AttendanceSession]([eventID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[AttendanceSession].[IX_AttendanceSession_eventID]...';


GO
CREATE NONCLUSTERED INDEX [IX_AttendanceSession_eventID]
    ON [dbo].[AttendanceSession]([eventID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[AuditLog]...';


GO
CREATE TABLE [dbo].[AuditLog] (
    [logID]              INT            IDENTITY (1, 1) NOT NULL,
    [actorID]            INT            NOT NULL,
    [actionType]         VARCHAR (50)   NOT NULL,
    [tableName]          VARCHAR (50)   NOT NULL,
    [recordID]           INT            NOT NULL,
    [oldValue]           NVARCHAR (MAX) NULL,
    [newValue]           NVARCHAR (MAX) NULL,
    [overrideReason]     NVARCHAR (MAX) NOT NULL,
    [beforeJson]         NVARCHAR (MAX) NULL,
    [afterJson]          NVARCHAR (MAX) NULL,
    [reason]             NVARCHAR (MAX) NULL,
    [eventID]            INT            NULL,
    [registrationID]     INT            NULL,
    [attendanceRecordID] INT            NULL,
    [requestId]          VARCHAR (80)   NULL,
    [executedAt]         DATETIME       NOT NULL,
    PRIMARY KEY CLUSTERED ([logID] ASC)
);


GO
PRINT N'Creating Index [dbo].[AuditLog].[IX_AuditLog_actorID]...';


GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_actorID]
    ON [dbo].[AuditLog]([actorID] ASC);


GO
PRINT N'Creating Table [dbo].[BankPaymentTransaction]...';


GO
CREATE TABLE [dbo].[BankPaymentTransaction] (
    [bankPaymentTransactionID] BIGINT          IDENTITY (1, 1) NOT NULL,
    [provider]                 VARCHAR (30)    NOT NULL,
    [providerTransactionId]    VARCHAR (100)   NOT NULL,
    [gateway]                  VARCHAR (50)    NULL,
    [accountNumber]            VARCHAR (50)    NULL,
    [paymentReference]         VARCHAR (64)    NULL,
    [guestRegistrationID]      INT             NULL,
    [transferAmount]           DECIMAL (18, 2) NOT NULL,
    [currency]                 VARCHAR (3)     NOT NULL,
    [transferType]             VARCHAR (10)    NULL,
    [transferContent]          NVARCHAR (500)  NULL,
    [referenceCode]            VARCHAR (100)   NULL,
    [transactionDate]          DATETIME2 (7)   NULL,
    [processingStatus]         VARCHAR (30)    NOT NULL,
    [processingMessage]        NVARCHAR (500)  NULL,
    [payloadHash]              CHAR (64)       NOT NULL,
    [createdAt]                DATETIME2 (7)   NOT NULL,
    [processedAt]              DATETIME2 (7)   NULL,
    PRIMARY KEY CLUSTERED ([bankPaymentTransactionID] ASC)
);


GO
PRINT N'Creating Index [dbo].[BankPaymentTransaction].[UX_BankPaymentTransaction_ProviderTransaction]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_BankPaymentTransaction_ProviderTransaction]
    ON [dbo].[BankPaymentTransaction]([provider] ASC, [providerTransactionId] ASC);


GO
PRINT N'Creating Index [dbo].[BankPaymentTransaction].[IX_BankPaymentTransaction_PaymentReference]...';


GO
CREATE NONCLUSTERED INDEX [IX_BankPaymentTransaction_PaymentReference]
    ON [dbo].[BankPaymentTransaction]([paymentReference] ASC);


GO
PRINT N'Creating Table [dbo].[Club]...';


GO
CREATE TABLE [dbo].[Club] (
    [clubID]                   INT            IDENTITY (1, 1) NOT NULL,
    [clubCode]                 VARCHAR (20)   NOT NULL,
    [clubName]                 NVARCHAR (100) NOT NULL,
    [description]              NVARCHAR (MAX) NULL,
    [applicationFormQuestions] NVARCHAR (MAX) NULL,
    [clubStatus]               VARCHAR (20)   NOT NULL,
    [category]                 NVARCHAR (100) NULL,
    [clubImage]                VARCHAR (500)  NULL,
    [contactEmail]             VARCHAR (100)  NULL,
    [contactPhone]             VARCHAR (20)   NULL,
    [facebookUrl]              VARCHAR (500)  NULL,
    [createdAt]                DATETIME       NOT NULL,
    [isDeleted]                BIT            NOT NULL,
    [clubImagePublicId]        NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([clubID] ASC)
);


GO
PRINT N'Creating Index [dbo].[Club].[UX_Club_clubCode]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Club_clubCode]
    ON [dbo].[Club]([clubCode] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[ClubBlacklist]...';


GO
CREATE TABLE [dbo].[ClubBlacklist] (
    [blacklistID] INT            IDENTITY (1, 1) NOT NULL,
    [clubID]      INT            NOT NULL,
    [userID]      INT            NOT NULL,
    [reason]      NVARCHAR (500) NULL,
    [createdAt]   DATETIME       NOT NULL,
    [isDeleted]   BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([blacklistID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ClubBlacklist].[UX_ClubBlacklist_Unique]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_ClubBlacklist_Unique]
    ON [dbo].[ClubBlacklist]([clubID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ClubBlacklist].[IX_ClubBlacklist_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubBlacklist_userID]
    ON [dbo].[ClubBlacklist]([userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[ClubEvaluation]...';


GO
CREATE TABLE [dbo].[ClubEvaluation] (
    [evaluationID]            INT            IDENTITY (1, 1) NOT NULL,
    [clubID]                  INT            NOT NULL,
    [semesterID]              INT            NOT NULL,
    [kpiScore]                DECIMAL (8, 2) NULL,
    [suggestedDecision]       NVARCHAR (60)  NULL,
    [finalDecision]           NVARCHAR (60)  NULL,
    [previousFinalDecision]   NVARCHAR (60)  NULL,
    [overallComment]          NVARCHAR (MAX) NULL,
    [strengths]               NVARCHAR (MAX) NULL,
    [weaknesses]              NVARCHAR (MAX) NULL,
    [improvementRequirements] NVARCHAR (MAX) NULL,
    [improvementDeadline]     DATE           NULL,
    [decisionReason]          NVARCHAR (MAX) NULL,
    [evaluatedBy]             INT            NULL,
    [evaluatedAt]             DATETIME2 (7)  NULL,
    [createdBy]               INT            NULL,
    [createdAt]               DATETIME2 (7)  NOT NULL,
    [updatedBy]               INT            NULL,
    [updatedAt]               DATETIME2 (7)  NULL,
    [isDeleted]               BIT            NOT NULL,
    CONSTRAINT [PK_ClubEvaluation] PRIMARY KEY CLUSTERED ([evaluationID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ClubEvaluation].[IX_ClubEvaluation_EvaluatedAt]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubEvaluation_EvaluatedAt]
    ON [dbo].[ClubEvaluation]([evaluatedAt] DESC);


GO
PRINT N'Creating Index [dbo].[ClubEvaluation].[IX_ClubEvaluation_Club_Semester]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubEvaluation_Club_Semester]
    ON [dbo].[ClubEvaluation]([clubID] ASC, [semesterID] ASC, [isDeleted] ASC);


GO
PRINT N'Creating Table [dbo].[ClubKPI]...';


GO
CREATE TABLE [dbo].[ClubKPI] (
    [kpiID]           INT            IDENTITY (1, 1) NOT NULL,
    [clubID]          INT            NOT NULL,
    [semesterID]      INT            NOT NULL,
    [totalEventsHeld] INT            NOT NULL,
    [totalMembers]    INT            NOT NULL,
    [kpiScore]        DECIMAL (5, 2) NOT NULL,
    [rankingTier]     VARCHAR (5)    NULL,
    [updatedAt]       DATETIME       NOT NULL,
    [isDeleted]       BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([kpiID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ClubKPI].[IX_ClubKPI_semesterID]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubKPI_semesterID]
    ON [dbo].[ClubKPI]([semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ClubKPI].[UX_ClubKPI_Unique]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_ClubKPI_Unique]
    ON [dbo].[ClubKPI]([clubID] ASC, [semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[ClubMembership]...';


GO
CREATE TABLE [dbo].[ClubMembership] (
    [membershipID] INT  IDENTITY (1, 1) NOT NULL,
    [clubID]       INT  NOT NULL,
    [userID]       INT  NOT NULL,
    [semesterID]   INT  NOT NULL,
    [clubRoleID]   INT  NOT NULL,
    [joinedDate]   DATE NOT NULL,
    [isDeleted]    BIT  NOT NULL,
    PRIMARY KEY CLUSTERED ([membershipID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ClubMembership].[IX_ClubMembership_clubRoleID]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubMembership_clubRoleID]
    ON [dbo].[ClubMembership]([clubRoleID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ClubMembership].[UX_Membership_UniqueStaff]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Membership_UniqueStaff]
    ON [dbo].[ClubMembership]([clubID] ASC, [userID] ASC, [semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ClubMembership].[IX_ClubMembership_ClubSemester]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubMembership_ClubSemester]
    ON [dbo].[ClubMembership]([clubID] ASC, [semesterID] ASC, [isDeleted] ASC);


GO
PRINT N'Creating Index [dbo].[ClubMembership].[IX_ClubMembership_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubMembership_userID]
    ON [dbo].[ClubMembership]([userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ClubMembership].[UX_Membership_LeaderExclusive]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Membership_LeaderExclusive]
    ON [dbo].[ClubMembership]([userID] ASC, [semesterID] ASC) WHERE ([clubRoleID]=(1) AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ClubMembership].[IX_ClubMembership_Club_User_Semester]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubMembership_Club_User_Semester]
    ON [dbo].[ClubMembership]([clubID] ASC, [userID] ASC, [semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ClubMembership].[IX_ClubMembership_semesterID]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubMembership_semesterID]
    ON [dbo].[ClubMembership]([semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[ClubPost]...';


GO
CREATE TABLE [dbo].[ClubPost] (
    [postID]    INT            IDENTITY (1, 1) NOT NULL,
    [clubID]    INT            NOT NULL,
    [createdBy] INT            NOT NULL,
    [content]   NVARCHAR (MAX) NOT NULL,
    [createdAt] DATETIME2 (7)  NOT NULL,
    [isDeleted] BIT            NOT NULL,
    CONSTRAINT [PK_ClubPost] PRIMARY KEY CLUSTERED ([postID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ClubPost].[IX_ClubPost_Club_CreatedAt]...';


GO
CREATE NONCLUSTERED INDEX [IX_ClubPost_Club_CreatedAt]
    ON [dbo].[ClubPost]([clubID] ASC, [createdAt] DESC);


GO
PRINT N'Creating Table [dbo].[ClubRegistration]...';


GO
CREATE TABLE [dbo].[ClubRegistration] (
    [registrationID]    INT            IDENTITY (1, 1) NOT NULL,
    [clubCode]          VARCHAR (30)   NOT NULL,
    [clubName]          NVARCHAR (100) NOT NULL,
    [clubNameEn]        VARCHAR (100)  NULL,
    [category]          NVARCHAR (50)  NOT NULL,
    [clubImage]         VARCHAR (500)  NULL,
    [description]       NVARCHAR (MAX) NULL,
    [mission]           NVARCHAR (MAX) NOT NULL,
    [uniqueness]        NVARCHAR (MAX) NOT NULL,
    [orgStructure]      NVARCHAR (MAX) NOT NULL,
    [meetingFrequency]  NVARCHAR (50)  NOT NULL,
    [meetingLocation]   NVARCHAR (100) NOT NULL,
    [financialPlan]     NVARCHAR (200) NOT NULL,
    [status]            VARCHAR (30)   NOT NULL,
    [icpdpComment]      NVARCHAR (MAX) NULL,
    [createdBy]         INT            NOT NULL,
    [createdAt]         DATETIME       NOT NULL,
    [updatedAt]         DATETIME       NULL,
    [isDeleted]         BIT            NOT NULL,
    [clubImagePublicId] NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([registrationID] ASC)
);


GO
PRINT N'Creating Table [dbo].[ClubRegistrationMember]...';


GO
CREATE TABLE [dbo].[ClubRegistrationMember] (
    [memberID]          INT            IDENTITY (1, 1) NOT NULL,
    [registrationID]    INT            NOT NULL,
    [proposedRole]      VARCHAR (20)   NOT NULL,
    [studentId]         VARCHAR (20)   NOT NULL,
    [fullName]          NVARCHAR (100) NOT NULL,
    [email]             VARCHAR (100)  NOT NULL,
    [phoneNumber]       VARCHAR (20)   NOT NULL,
    [cohort]            VARCHAR (20)   NULL,
    [clazz]             VARCHAR (20)   NULL,
    [facebookLink]      VARCHAR (200)  NULL,
    [cardImage]         VARCHAR (255)  NULL,
    [isDeleted]         BIT            NOT NULL,
    [cardImagePublicId] NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([memberID] ASC)
);


GO
PRINT N'Creating Table [dbo].[ClubRole]...';


GO
CREATE TABLE [dbo].[ClubRole] (
    [clubRoleID]  INT            IDENTITY (1, 1) NOT NULL,
    [roleName]    VARCHAR (30)   NOT NULL,
    [description] NVARCHAR (200) NULL,
    [isDeleted]   BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([clubRoleID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ClubRole].[UX_ClubRole_roleName]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_ClubRole_roleName]
    ON [dbo].[ClubRole]([roleName] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[Competition]...';


GO
CREATE TABLE [dbo].[Competition] (
    [competitionID] INT            IDENTITY (1, 1) NOT NULL,
    [clubID]        INT            NOT NULL,
    [semesterID]    INT            NOT NULL,
    [title]         NVARCHAR (150) NOT NULL,
    [description]   NVARCHAR (MAX) NULL,
    [status]        VARCHAR (20)   NOT NULL,
    [createdAt]     DATETIME       NOT NULL,
    [isDeleted]     BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([competitionID] ASC)
);


GO
PRINT N'Creating Table [dbo].[competition_award]...';


GO
CREATE TABLE [dbo].[competition_award] (
    [awardID]        INT            IDENTITY (1, 1) NOT NULL,
    [competition_id] INT            NOT NULL,
    [award_name]     NVARCHAR (100) NOT NULL,
    [description]    NVARCHAR (MAX) NULL,
    [points_bonus]   INT            NULL,
    [is_deleted]     BIT            NOT NULL,
    [created_at]     DATETIME       NOT NULL,
    [updated_at]     DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([awardID] ASC)
);


GO
PRINT N'Creating Table [dbo].[competition_penalty]...';


GO
CREATE TABLE [dbo].[competition_penalty] (
    [penaltyID]        INT            IDENTITY (1, 1) NOT NULL,
    [competition_id]   INT            NOT NULL,
    [user_id]          INT            NOT NULL,
    [penalty_name]     NVARCHAR (100) NOT NULL,
    [description]      NVARCHAR (MAX) NULL,
    [points_deduction] INT            NULL,
    [is_deleted]       BIT            NOT NULL,
    [created_at]       DATETIME       NOT NULL,
    [updated_at]       DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([penaltyID] ASC)
);


GO
PRINT N'Creating Table [dbo].[CompetitionScore]...';


GO
CREATE TABLE [dbo].[CompetitionScore] (
    [scoreID]            INT IDENTITY (1, 1) NOT NULL,
    [competitionID]      INT NOT NULL,
    [userID]             INT NOT NULL,
    [activityScore]      INT NOT NULL,
    [participationScore] INT NOT NULL,
    [feedbackScore]      INT NOT NULL,
    [complianceScore]    INT NOT NULL,
    [engagementScore]    INT NOT NULL,
    [totalScore]         INT NOT NULL,
    [isDeleted]          BIT NOT NULL,
    PRIMARY KEY CLUSTERED ([scoreID] ASC)
);


GO
PRINT N'Creating Table [dbo].[ContributionAppeal]...';


GO
CREATE TABLE [dbo].[ContributionAppeal] (
    [appealID]       INT            IDENTITY (1, 1) NOT NULL,
    [batchID]        INT            NOT NULL,
    [eventID]        INT            NOT NULL,
    [contributionID] INT            NULL,
    [userID]         INT            NOT NULL,
    [reason]         NVARCHAR (MAX) NOT NULL,
    [resolutionNote] NVARCHAR (MAX) NULL,
    [status]         VARCHAR (30)   NOT NULL,
    [requestedAt]    DATETIME       NOT NULL,
    [resolvedAt]     DATETIME       NULL,
    [resolvedBy]     INT            NULL,
    [isDeleted]      BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([appealID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ContributionAppeal].[IX_ContributionAppeal_Batch_Status]...';


GO
CREATE NONCLUSTERED INDEX [IX_ContributionAppeal_Batch_Status]
    ON [dbo].[ContributionAppeal]([batchID] ASC, [status] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ContributionAppeal].[IX_ContributionAppeal_Event_User]...';


GO
CREATE NONCLUSTERED INDEX [IX_ContributionAppeal_Event_User]
    ON [dbo].[ContributionAppeal]([eventID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[ContributionBatch]...';


GO
CREATE TABLE [dbo].[ContributionBatch] (
    [batchID]            INT          IDENTITY (1, 1) NOT NULL,
    [eventID]            INT          NOT NULL,
    [clubID]             INT          NOT NULL,
    [semesterID]         INT          NULL,
    [status]             VARCHAR (30) NOT NULL,
    [reportApprovedBy]   INT          NULL,
    [reportApprovedAt]   DATETIME     NULL,
    [scoringOpenedAt]    DATETIME     NULL,
    [scoringSubmittedAt] DATETIME     NULL,
    [scoringSubmittedBy] INT          NULL,
    [appealOpenedAt]     DATETIME     NULL,
    [appealClosesAt]     DATETIME     NULL,
    [finalizedAt]        DATETIME     NULL,
    [finalizedBy]        INT          NULL,
    [createdAt]          DATETIME     NOT NULL,
    [updatedAt]          DATETIME     NULL,
    [isDeleted]          BIT          NOT NULL,
    PRIMARY KEY CLUSTERED ([batchID] ASC)
);


GO
PRINT N'Creating Index [dbo].[ContributionBatch].[IX_ContributionBatch_Event]...';


GO
CREATE NONCLUSTERED INDEX [IX_ContributionBatch_Event]
    ON [dbo].[ContributionBatch]([eventID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[ContributionBatch].[IX_ContributionBatch_Club_Status]...';


GO
CREATE NONCLUSTERED INDEX [IX_ContributionBatch_Club_Status]
    ON [dbo].[ContributionBatch]([clubID] ASC, [status] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[DisciplineLog]...';


GO
CREATE TABLE [dbo].[DisciplineLog] (
    [disciplineID]     INT            IDENTITY (1, 1) NOT NULL,
    [userID]           INT            NOT NULL,
    [semesterID]       INT            NOT NULL,
    [reason]           NVARCHAR (500) NOT NULL,
    [disciplineStatus] VARCHAR (20)   NOT NULL,
    [createdAt]        DATETIME       NOT NULL,
    [isDeleted]        BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([disciplineID] ASC)
);


GO
PRINT N'Creating Index [dbo].[DisciplineLog].[IX_DisciplineLog_User_Semester]...';


GO
CREATE NONCLUSTERED INDEX [IX_DisciplineLog_User_Semester]
    ON [dbo].[DisciplineLog]([userID] ASC, [semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[DisciplineLog].[IX_DisciplineLog_semesterID]...';


GO
CREATE NONCLUSTERED INDEX [IX_DisciplineLog_semesterID]
    ON [dbo].[DisciplineLog]([semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[Event]...';


GO
CREATE TABLE [dbo].[Event] (
    [eventID]                INT             IDENTITY (1, 1) NOT NULL,
    [clubID]                 INT             NOT NULL,
    [semesterID]             INT             NOT NULL,
    [eventCode]              VARCHAR (30)    NOT NULL,
    [eventName]              NVARCHAR (150)  NOT NULL,
    [description]            NVARCHAR (MAX)  NULL,
    [location]               NVARCHAR (200)  NOT NULL,
    [budget]                 DECIMAL (18, 2) NOT NULL,
    [startDate]              DATETIME        NOT NULL,
    [endDate]                DATETIME        NOT NULL,
    [eventStatus]            VARCHAR (20)    NOT NULL,
    [pdpFeedback]            NVARCHAR (MAX)  NULL,
    [rejectionReason]        NVARCHAR (MAX)  NULL,
    [approvedBy]             INT             NULL,
    [approvedAt]             DATETIME        NULL,
    [isResubmitted]          BIT             NOT NULL,
    [isInternal]             BIT             NOT NULL,
    [isScoreLocked]          BIT             NOT NULL,
    [maxParticipants]        INT             NULL,
    [totalCapacity]          INT             NULL,
    [allowWalkIn]            BIT             NOT NULL,
    [registrationOpenAt]     DATETIME        NULL,
    [registrationCloseAt]    DATETIME        NULL,
    [checkInOpenAt]          DATETIME        NULL,
    [checkInCloseAt]         DATETIME        NULL,
    [feedbackEnabled]        BIT             NOT NULL,
    [feedbackOpensAt]        DATETIME        NULL,
    [feedbackClosesAt]       DATETIME        NULL,
    [createdBy]              INT             NULL,
    [bannerUrl]              NVARCHAR (MAX)  NULL,
    [createdAt]              DATETIME        NOT NULL,
    [isDeleted]              BIT             NOT NULL,
    [bannerPublicId]         NVARCHAR (500)  NULL,
    [latitude]               FLOAT (53)      NULL,
    [longitude]              FLOAT (53)      NULL,
    [venueName]              NVARCHAR (255)  NULL,
    [locationDetail]         NVARCHAR (500)  NULL,
    [isPaidEvent]            BIT             NOT NULL,
    [ticketPrice]            DECIMAL (18, 2) NULL,
    [ticketCurrency]         VARCHAR (3)     NOT NULL,
    [submissionAttemptCount] INT             NOT NULL,
    [lastSubmittedAt]        DATETIME2 (7)   NULL,
    [submissionBlockedUntil] DATETIME2 (7)   NULL,
    [withdrawalReason]       NVARCHAR (MAX)  NULL,
    [withdrawnBy]            INT             NULL,
    [withdrawnAt]            DATETIME2 (7)   NULL,
    PRIMARY KEY CLUSTERED ([eventID] ASC)
);


GO
PRINT N'Creating Index [dbo].[Event].[IX_Event_semesterID]...';


GO
CREATE NONCLUSTERED INDEX [IX_Event_semesterID]
    ON [dbo].[Event]([semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[Event].[UX_Event_eventCode]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Event_eventCode]
    ON [dbo].[Event]([eventCode] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[Event].[IX_Event_clubID]...';


GO
CREATE NONCLUSTERED INDEX [IX_Event_clubID]
    ON [dbo].[Event]([clubID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[EventAssignment]...';


GO
CREATE TABLE [dbo].[EventAssignment] (
    [assignmentID] INT      IDENTITY (1, 1) NOT NULL,
    [eventID]      INT      NOT NULL,
    [userID]       INT      NOT NULL,
    [eventRoleID]  INT      NOT NULL,
    [assignedAt]   DATETIME NOT NULL,
    [isDeleted]    BIT      NOT NULL,
    PRIMARY KEY CLUSTERED ([assignmentID] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventAssignment].[IX_EventAssignment_eventRoleID]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventAssignment_eventRoleID]
    ON [dbo].[EventAssignment]([eventRoleID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventAssignment].[UX_Event_Staffing]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Event_Staffing]
    ON [dbo].[EventAssignment]([eventID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventAssignment].[IX_EventAssignment_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventAssignment_userID]
    ON [dbo].[EventAssignment]([userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[EventContribution]...';


GO
CREATE TABLE [dbo].[EventContribution] (
    [contributionID]            INT             IDENTITY (1, 1) NOT NULL,
    [batchID]                   INT             NULL,
    [eventID]                   INT             NULL,
    [clubID]                    INT             NULL,
    [userID]                    INT             NULL,
    [registrationID]            INT             NULL,
    [attendanceRecordID]        INT             NULL,
    [assignmentID]              INT             NULL,
    [membershipID]              INT             NULL,
    [clubRoleIDSnapshot]        INT             NULL,
    [clubRoleSnapshot]          NVARCHAR (50)   NULL,
    [contributionType]          VARCHAR (40)    NULL,
    [leaderEvaluation]          VARCHAR (40)    NULL,
    [basePoints]                INT             NULL,
    [multiplier]                DECIMAL (4, 2)  NULL,
    [bonusPoints]               INT             NULL,
    [penaltyPoints]             INT             NULL,
    [finalPoints]               INT             NULL,
    [status]                    VARCHAR (30)    NULL,
    [individualRankingEligible] BIT             NOT NULL,
    [tier]                      NVARCHAR (20)   NULL,
    [rationale]                 NVARCHAR (2000) NULL,
    [finalizedAt]               DATETIME        NULL,
    [finalizedBy]               INT             NULL,
    [releasedToPerformance]     BIT             NOT NULL,
    [calculatedAt]              DATETIME        NULL,
    [updatedAt]                 DATETIME        NULL,
    [updatedBy]                 INT             NULL,
    [isDeleted]                 BIT             NOT NULL,
    PRIMARY KEY CLUSTERED ([contributionID] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventContribution].[IX_EventContribution_Event_User]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventContribution_Event_User]
    ON [dbo].[EventContribution]([eventID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventContribution].[IX_EventContribution_Batch_User]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventContribution_Batch_User]
    ON [dbo].[EventContribution]([batchID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[EventFeedback]...';


GO
CREATE TABLE [dbo].[EventFeedback] (
    [feedbackID]                INT            IDENTITY (1, 1) NOT NULL,
    [eventID]                   INT            NOT NULL,
    [registrationID]            INT            NULL,
    [guestRegistrationID]       INT            NULL,
    [contentRating]             INT            NOT NULL,
    [organizationRating]        INT            NOT NULL,
    [logisticsRating]           INT            NOT NULL,
    [overallRating]             INT            NOT NULL,
    [comment]                   NVARCHAR (MAX) NULL,
    [isIncludedInExternalScore] BIT            NOT NULL,
    [isDeleted]                 BIT            NOT NULL,
    [submittedAt]               DATETIME       NULL,
    [createdAt]                 DATETIME       NOT NULL,
    [updatedAt]                 DATETIME2 (7)  NULL,
    PRIMARY KEY CLUSTERED ([feedbackID] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventFeedback].[IX_EventFeedback_Event_Registration]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventFeedback_Event_Registration]
    ON [dbo].[EventFeedback]([eventID] ASC, [registrationID] ASC);


GO
PRINT N'Creating Index [dbo].[EventFeedback].[UX_EventFeedback_Event_Registration_Active]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventFeedback_Event_Registration_Active]
    ON [dbo].[EventFeedback]([eventID] ASC, [registrationID] ASC) WHERE ([registrationID] IS NOT NULL AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventFeedback].[IX_EventFeedback_Event_GuestRegistration]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventFeedback_Event_GuestRegistration]
    ON [dbo].[EventFeedback]([eventID] ASC, [guestRegistrationID] ASC);


GO
PRINT N'Creating Index [dbo].[EventFeedback].[UX_EventFeedback_Event_Registration_NotNull]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventFeedback_Event_Registration_NotNull]
    ON [dbo].[EventFeedback]([eventID] ASC, [registrationID] ASC) WHERE ([registrationID] IS NOT NULL AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventFeedback].[UX_EventFeedback_Event_GuestRegistration_NotNull]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventFeedback_Event_GuestRegistration_NotNull]
    ON [dbo].[EventFeedback]([eventID] ASC, [guestRegistrationID] ASC) WHERE ([guestRegistrationID] IS NOT NULL AND [isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[EventFeedbackInvitation]...';


GO
CREATE TABLE [dbo].[EventFeedbackInvitation] (
    [invitationID]        INT           IDENTITY (1, 1) NOT NULL,
    [eventID]             INT           NOT NULL,
    [registrationID]      INT           NULL,
    [guestRegistrationID] INT           NULL,
    [tokenHash]           VARCHAR (255) NOT NULL,
    [expiresAt]           DATETIME      NOT NULL,
    [status]              VARCHAR (30)  NOT NULL,
    [sentAt]              DATETIME      NULL,
    [usedAt]              DATETIME      NULL,
    [createdAt]           DATETIME      NOT NULL,
    [isDeleted]           BIT           NOT NULL,
    PRIMARY KEY CLUSTERED ([invitationID] ASC),
    CONSTRAINT [UQ_FeedbackInvitation_TokenHash] UNIQUE NONCLUSTERED ([tokenHash] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventFeedbackInvitation].[IX_FeedbackInvitation_TokenHash]...';


GO
CREATE NONCLUSTERED INDEX [IX_FeedbackInvitation_TokenHash]
    ON [dbo].[EventFeedbackInvitation]([tokenHash] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventFeedbackInvitation].[IX_FeedbackInvitation_Event_Status]...';


GO
CREATE NONCLUSTERED INDEX [IX_FeedbackInvitation_Event_Status]
    ON [dbo].[EventFeedbackInvitation]([eventID] ASC, [status] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventFeedbackInvitation].[UX_FeedbackInvitation_Event_Registration_NotNull]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_FeedbackInvitation_Event_Registration_NotNull]
    ON [dbo].[EventFeedbackInvitation]([eventID] ASC, [registrationID] ASC) WHERE ([registrationID] IS NOT NULL AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventFeedbackInvitation].[UX_FeedbackInvitation_Event_GuestRegistration_NotNull]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_FeedbackInvitation_Event_GuestRegistration_NotNull]
    ON [dbo].[EventFeedbackInvitation]([eventID] ASC, [guestRegistrationID] ASC) WHERE ([guestRegistrationID] IS NOT NULL AND [isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[EventNotificationDispatch]...';


GO
CREATE TABLE [dbo].[EventNotificationDispatch] (
    [dispatchID]       BIGINT        IDENTITY (1, 1) NOT NULL,
    [eventID]          INT           NOT NULL,
    [recipientKey]     VARCHAR (255) NOT NULL,
    [notificationType] VARCHAR (50)  NOT NULL,
    [sentAt]           DATETIME2 (7) NOT NULL,
    PRIMARY KEY CLUSTERED ([dispatchID] ASC),
    CONSTRAINT [UQ_EventNotificationDispatch] UNIQUE NONCLUSTERED ([eventID] ASC, [recipientKey] ASC, [notificationType] ASC)
);


GO
PRINT N'Creating Table [dbo].[EventRegistration]...';


GO
CREATE TABLE [dbo].[EventRegistration] (
    [registrationID]             INT             IDENTITY (1, 1) NOT NULL,
    [eventID]                    INT             NOT NULL,
    [userID]                     INT             NULL,
    [participantTypeSnapshotAt]  DATETIME        NULL,
    [registrationStatus]         VARCHAR (50)    NOT NULL,
    [registrationChannel]        VARCHAR (50)    NULL,
    [guestFullName]              NVARCHAR (150)  NULL,
    [guestEmail]                 VARCHAR (255)   NULL,
    [guestEmailNormalized]       VARCHAR (255)   NULL,
    [guestPhone]                 VARCHAR (20)    NULL,
    [guestPhoneNormalized]       VARCHAR (20)    NULL,
    [guestReferenceHash]         VARCHAR (255)   NULL,
    [schoolOrOrganization]       NVARCHAR (200)  NULL,
    [consentAccepted]            BIT             NULL,
    [discoverySource]            NVARCHAR (200)  NULL,
    [participantType]            VARCHAR (50)    NULL,
    [registeredAt]               DATETIME        NOT NULL,
    [status]                     VARCHAR (50)    NULL,
    [ticketCode]                 VARCHAR (50)    NULL,
    [ticketIssuedAt]             DATETIME        NULL,
    [ticketRevokedAt]            DATETIME        NULL,
    [registrationCode]           VARCHAR (50)    NULL,
    [waitlistPosition]           INT             NULL,
    [verifiedAt]                 DATETIME        NULL,
    [cancelledAt]                DATETIME        NULL,
    [createdAt]                  DATETIME        NOT NULL,
    [createdBy]                  INT             NULL,
    [updatedAt]                  DATETIME        NULL,
    [updatedBy]                  INT             NULL,
    [isDeleted]                  BIT             NOT NULL,
    [paymentStatus]              VARCHAR (20)    NOT NULL,
    [amountDue]                  DECIMAL (18, 2) NULL,
    [amountPaid]                 DECIMAL (18, 2) NULL,
    [paymentCurrency]            VARCHAR (3)     NULL,
    [paymentReference]           VARCHAR (64)    NULL,
    [paymentMethod]              VARCHAR (30)    NULL,
    [paidAt]                     DATETIME2 (7)   NULL,
    [paymentExpiresAt]           DATETIME2 (7)   NULL,
    [capacityExempt]             BIT             NOT NULL,
    [purchaserUserID]            INT             NULL,
    [ticketOrderCode]            VARCHAR (64)    NULL,
    [cancellationReason]         NVARCHAR (500)  NULL,
    [cancellationSource]         VARCHAR (30)    NULL,
    [refundAmount]               DECIMAL (18, 2) NULL,
    [refundRequestedAt]          DATETIME2 (7)   NULL,
    [refundProcessedAt]          DATETIME2 (7)   NULL,
    [refundProcessedBy]          INT             NULL,
    [refundTransactionReference] NVARCHAR (100)  NULL,
    [refundNote]                 NVARCHAR (500)  NULL,
    [refundBankName]             NVARCHAR (100)  NULL,
    [refundAccountNumber]        NVARCHAR (50)   NULL,
    [refundAccountHolder]        NVARCHAR (150)  NULL,
    [refundBankCode]             VARCHAR (20)    NULL,
    [refundRate]                 DECIMAL (5, 2)  NULL,
    [refundPolicySnapshot]       NVARCHAR (500)  NULL,
    [refundCalculationNote]      NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([registrationID] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_Status_Reg]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_Status_Reg]
    ON [dbo].[EventRegistration]([registrationStatus] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_RefundPending]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_RefundPending]
    ON [dbo].[EventRegistration]([paymentStatus] ASC, [refundRequestedAt] ASC) WHERE ([paymentStatus]='REFUND_PENDING' AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_RegistrationCode]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_RegistrationCode]
    ON [dbo].[EventRegistration]([registrationCode] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_userID]
    ON [dbo].[EventRegistration]([userID] ASC) WHERE ([isDeleted]=(0) AND [userID] IS NOT NULL);


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_Event_GuestEmailNormalized]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_Event_GuestEmailNormalized]
    ON [dbo].[EventRegistration]([eventID] ASC, [guestEmailNormalized] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_Event_User]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_Event_User]
    ON [dbo].[EventRegistration]([eventID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_GuestReferenceHash]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_GuestReferenceHash]
    ON [dbo].[EventRegistration]([guestReferenceHash] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventRegistration].[UX_EventRegistration_PaymentReference]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventRegistration_PaymentReference]
    ON [dbo].[EventRegistration]([paymentReference] ASC) WHERE ([paymentReference] IS NOT NULL);


GO
PRINT N'Creating Index [dbo].[EventRegistration].[IX_EventRegistration_Purchaser_Order]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventRegistration_Purchaser_Order]
    ON [dbo].[EventRegistration]([purchaserUserID] ASC, [ticketOrderCode] ASC, [eventID] ASC);


GO
PRINT N'Creating Index [dbo].[EventRegistration].[UX_EventRegistration_TicketCode_Active]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventRegistration_TicketCode_Active]
    ON [dbo].[EventRegistration]([ticketCode] ASC) WHERE ([isDeleted]=(0) AND [ticketCode] IS NOT NULL AND [ticketCode]<>'');


GO
PRINT N'Creating Table [dbo].[EventRegistrationPolicy]...';


GO
CREATE TABLE [dbo].[EventRegistrationPolicy] (
    [policyID]               INT          IDENTITY (1, 1) NOT NULL,
    [eventID]                INT          NOT NULL,
    [participantType]        VARCHAR (50) NOT NULL,
    [isEnabled]              BIT          NOT NULL,
    [quota]                  INT          NULL,
    [waitlistEnabled]        BIT          NOT NULL,
    [quotaReleaseAt]         DATETIME     NULL,
    [requiresApproval]       BIT          NOT NULL,
    [requiresManualApproval] BIT          NOT NULL,
    [createdAt]              DATETIME     NULL,
    [isDeleted]              BIT          NOT NULL,
    PRIMARY KEY CLUSTERED ([policyID] ASC),
    CONSTRAINT [UK_EventRegistrationPolicy_Event_ParticipantType] UNIQUE NONCLUSTERED ([eventID] ASC, [participantType] ASC)
);


GO
PRINT N'Creating Table [dbo].[EventReport]...';


GO
CREATE TABLE [dbo].[EventReport] (
    [reportID]                       INT             IDENTITY (1, 1) NOT NULL,
    [eventID]                        INT             NOT NULL,
    [reportUrl]                      VARCHAR (500)   NOT NULL,
    [summary]                        NVARCHAR (MAX)  NULL,
    [uploadedBy]                     INT             NOT NULL,
    [uploadedAt]                     DATETIME        NOT NULL,
    [status]                         VARCHAR (30)    NOT NULL,
    [approvedBy]                     INT             NULL,
    [approvedAt]                     DATETIME        NULL,
    [rejectedBy]                     INT             NULL,
    [rejectedAt]                     DATETIME        NULL,
    [rejectionReason]                NVARCHAR (MAX)  NULL,
    [isDeleted]                      BIT             NOT NULL,
    [cloudinaryPublicId]             NVARCHAR (500)  NULL,
    [originalFilename]               NVARCHAR (500)  NULL,
    [fileSize]                       BIGINT          NULL,
    [mimeType]                       NVARCHAR (100)  NULL,
    [registrationEvidenceUrl]        NVARCHAR (1000) NULL,
    [registrationEvidencePublicId]   NVARCHAR (500)  NULL,
    [registrationEvidenceHash]       CHAR (64)       NULL,
    [attendanceEvidenceUrl]          NVARCHAR (1000) NULL,
    [attendanceEvidencePublicId]     NVARCHAR (500)  NULL,
    [attendanceEvidenceHash]         CHAR (64)       NULL,
    [evidenceGeneratedAt]            DATETIME2 (7)   NULL,
    [evidenceRegistrationRowCount]   INT             NULL,
    [evidenceAttendanceRowCount]     INT             NULL,
    [snapshotGeneratedAt]            DATETIME2 (7)   NULL,
    [snapshotTotalRegistrations]     BIGINT          NULL,
    [snapshotConfirmedRegistrations] BIGINT          NULL,
    [snapshotCancelledRegistrations] BIGINT          NULL,
    [snapshotFptuRegistrations]      BIGINT          NULL,
    [snapshotGuestRegistrations]     BIGINT          NULL,
    [snapshotPendingPaymentCount]    BIGINT          NULL,
    [snapshotPaidTicketCount]        BIGINT          NULL,
    [snapshotRevenue]                DECIMAL (19, 2) NULL,
    [snapshotCurrency]               VARCHAR (3)     NULL,
    [snapshotAttendanceSessionCount] INT             NULL,
    [snapshotPresentParticipants]    BIGINT          NULL,
    [snapshotAbsentParticipants]     BIGINT          NULL,
    [snapshotWalkInParticipants]     BIGINT          NULL,
    [snapshotAttendanceRate]         DECIMAL (7, 2)  NULL,
    [snapshotFeedbackCount]          BIGINT          NULL,
    [snapshotAverageRating]          DECIMAL (4, 2)  NULL,
    [snapshotFeedbackResponseRate]   DECIMAL (7, 2)  NULL,
    [snapshotPlannedBudget]          DECIMAL (19, 2) NULL,
    [reportSource]                   VARCHAR (20)    NOT NULL,
    [autoGeneratedAt]                DATETIME2 (7)   NULL,
    [generatorVersion]               VARCHAR (20)    NULL,
    [templateVersion]                VARCHAR (20)    NULL,
    [reportDataHash]                 VARCHAR (64)    NULL,
    [reportSnapshotJson]             NVARCHAR (MAX)  NULL,
    [leaderCommentsJson]             NVARCHAR (MAX)  NULL,
    [pdfHash]                        VARCHAR (64)    NULL,
    [version]                        BIGINT          NOT NULL,
    PRIMARY KEY CLUSTERED ([reportID] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventReport].[UX_EventReport_Event_Active]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventReport_Event_Active]
    ON [dbo].[EventReport]([eventID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[EventReport].[IX_EventReport_eventID]...';


GO
CREATE NONCLUSTERED INDEX [IX_EventReport_eventID]
    ON [dbo].[EventReport]([eventID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[EventReportReminderLog]...';


GO
CREATE TABLE [dbo].[EventReportReminderLog] (
    [reminderID]      INT            IDENTITY (1, 1) NOT NULL,
    [eventID]         INT            NOT NULL,
    [reminderType]    VARCHAR (50)   NOT NULL,
    [sentAt]          DATETIME       NOT NULL,
    [recipientEmails] NVARCHAR (MAX) NULL,
    [isDeleted]       BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([reminderID] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventReportReminderLog].[UX_EventReportReminderLog_Event_Type]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventReportReminderLog_Event_Type]
    ON [dbo].[EventReportReminderLog]([eventID] ASC, [reminderType] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[EventRole]...';


GO
CREATE TABLE [dbo].[EventRole] (
    [eventRoleID] INT            IDENTITY (1, 1) NOT NULL,
    [roleName]    NVARCHAR (50)  NOT NULL,
    [description] NVARCHAR (200) NULL,
    [isDeleted]   BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([eventRoleID] ASC)
);


GO
PRINT N'Creating Index [dbo].[EventRole].[UX_EventRole_roleName]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EventRole_roleName]
    ON [dbo].[EventRole]([roleName] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[GuestEventRegistration]...';


GO
CREATE TABLE [dbo].[GuestEventRegistration] (
    [guestRegistrationID]            INT             IDENTITY (1, 1) NOT NULL,
    [eventID]                        INT             NOT NULL,
    [guestFullName]                  NVARCHAR (255)  NOT NULL,
    [guestEmail]                     VARCHAR (255)   NOT NULL,
    [guestEmailNormalized]           VARCHAR (255)   NOT NULL,
    [guestPhone]                     VARCHAR (50)    NOT NULL,
    [guestPhoneNormalized]           VARCHAR (50)    NOT NULL,
    [guestReferenceHash]             VARCHAR (255)   NOT NULL,
    [schoolOrOrganization]           NVARCHAR (255)  NULL,
    [consentAccepted]                BIT             NULL,
    [discoverySource]                NVARCHAR (50)   NULL,
    [participantType]                VARCHAR (50)    NOT NULL,
    [participantTypeSnapshotAt]      DATETIME        NULL,
    [registrationStatus]             VARCHAR (50)    NOT NULL,
    [registrationChannel]            VARCHAR (50)    NOT NULL,
    [status]                         VARCHAR (50)    NULL,
    [registeredAt]                   DATETIME        NULL,
    [registrationCode]               VARCHAR (100)   NULL,
    [waitlistPosition]               INT             NULL,
    [verifiedAt]                     DATETIME        NULL,
    [cancelledAt]                    DATETIME        NULL,
    [createdAt]                      DATETIME        NOT NULL,
    [createdBy]                      INT             NULL,
    [updatedAt]                      DATETIME        NULL,
    [updatedBy]                      INT             NULL,
    [isDeleted]                      BIT             NOT NULL,
    [ticketCode]                     VARCHAR (255)   NULL,
    [ticketIssuedAt]                 DATETIME2 (7)   NULL,
    [ticketRevokedAt]                DATETIME2 (7)   NULL,
    [paymentStatus]                  VARCHAR (32)    NULL,
    [amountDue]                      DECIMAL (18, 2) NULL,
    [amountPaid]                     DECIMAL (18, 2) NULL,
    [paymentCurrency]                VARCHAR (3)     NULL,
    [paymentReference]               VARCHAR (64)    NULL,
    [paymentMethod]                  VARCHAR (32)    NULL,
    [paidAt]                         DATETIME2 (7)   NULL,
    [paymentExpiresAt]               DATETIME2 (7)   NULL,
    [cancellationReason]             NVARCHAR (500)  NULL,
    [cancellationSource]             VARCHAR (30)    NULL,
    [paymentSubmittedAt]             DATETIME2 (7)   NULL,
    [paymentReviewedAt]              DATETIME2 (7)   NULL,
    [paymentReviewedBy]              INT             NULL,
    [paymentRejectionReason]         NVARCHAR (500)  NULL,
    [paymentInstructionSentAt]       DATETIME2 (7)   NULL,
    [paymentReminderSentAt]          DATETIME2 (7)   NULL,
    [paymentVerificationEmailSentAt] DATETIME2 (7)   NULL,
    [paymentConfirmedEmailSentAt]    DATETIME2 (7)   NULL,
    [paymentRejectedEmailSentAt]     DATETIME2 (7)   NULL,
    [paymentExpiredEmailSentAt]      DATETIME2 (7)   NULL,
    [refundAmount]                   DECIMAL (18, 2) NULL,
    [refundRequestedAt]              DATETIME2 (7)   NULL,
    [refundProcessedAt]              DATETIME2 (7)   NULL,
    [refundProcessedBy]              INT             NULL,
    [refundTransactionReference]     NVARCHAR (100)  NULL,
    [refundNote]                     NVARCHAR (500)  NULL,
    [refundBankName]                 NVARCHAR (100)  NULL,
    [refundAccountNumber]            NVARCHAR (50)   NULL,
    [refundAccountHolder]            NVARCHAR (150)  NULL,
    [refundBankCode]                 VARCHAR (20)    NULL,
    [refundRate]                     DECIMAL (5, 2)  NULL,
    [refundPolicySnapshot]           NVARCHAR (500)  NULL,
    [refundCalculationNote]          NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([guestRegistrationID] ASC)
);


GO
PRINT N'Creating Index [dbo].[GuestEventRegistration].[IX_GuestEventRegistration_GuestReferenceHash]...';


GO
CREATE NONCLUSTERED INDEX [IX_GuestEventRegistration_GuestReferenceHash]
    ON [dbo].[GuestEventRegistration]([guestReferenceHash] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[GuestEventRegistration].[IX_GuestEventRegistration_RefundPending]...';


GO
CREATE NONCLUSTERED INDEX [IX_GuestEventRegistration_RefundPending]
    ON [dbo].[GuestEventRegistration]([paymentStatus] ASC, [refundRequestedAt] ASC) WHERE ([paymentStatus]='REFUND_PENDING' AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[GuestEventRegistration].[IX_GuestEventRegistration_Event_GuestEmailNormalized]...';


GO
CREATE NONCLUSTERED INDEX [IX_GuestEventRegistration_Event_GuestEmailNormalized]
    ON [dbo].[GuestEventRegistration]([eventID] ASC, [guestEmailNormalized] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[GuestVerificationOtp]...';


GO
CREATE TABLE [dbo].[GuestVerificationOtp] (
    [otpID]               INT            IDENTITY (1, 1) NOT NULL,
    [eventRegistrationID] INT            NULL,
    [guestEmail]          VARCHAR (255)  NOT NULL,
    [otpHash]             NVARCHAR (255) NOT NULL,
    [expiresAt]           DATETIME       NOT NULL,
    [resendAvailableAt]   DATETIME       NULL,
    [usedAt]              DATETIME       NULL,
    [verifiedAt]          DATETIME       NULL,
    [attemptCount]        INT            NOT NULL,
    [maxAttempts]         INT            NOT NULL,
    [status]              VARCHAR (30)   NOT NULL,
    [createdAt]           DATETIME       NOT NULL,
    [updatedAt]           DATETIME       NULL,
    [createdBy]           INT            NULL,
    [guestRegistrationID] INT            NULL,
    [isDeleted]           BIT            NOT NULL,
    [purpose]             NVARCHAR (30)  NULL,
    [challengeHash]       NVARCHAR (64)  NULL,
    PRIMARY KEY CLUSTERED ([otpID] ASC)
);


GO
PRINT N'Creating Index [dbo].[GuestVerificationOtp].[IX_GuestVerificationOtp_ChallengeHash]...';


GO
CREATE NONCLUSTERED INDEX [IX_GuestVerificationOtp_ChallengeHash]
    ON [dbo].[GuestVerificationOtp]([challengeHash] ASC) WHERE ([challengeHash] IS NOT NULL);


GO
PRINT N'Creating Table [dbo].[InterviewerAssignment]...';


GO
CREATE TABLE [dbo].[InterviewerAssignment] (
    [assignmentID]  INT            IDENTITY (1, 1) NOT NULL,
    [interviewID]   INT            NOT NULL,
    [interviewerID] INT            NOT NULL,
    [evaluation]    NVARCHAR (MAX) NULL,
    [isDeleted]     BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([assignmentID] ASC)
);


GO
PRINT N'Creating Index [dbo].[InterviewerAssignment].[IX_InterviewerAssignment_interviewerID]...';


GO
CREATE NONCLUSTERED INDEX [IX_InterviewerAssignment_interviewerID]
    ON [dbo].[InterviewerAssignment]([interviewerID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[InterviewerAssignment].[UX_Interviewer_Schedule]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Interviewer_Schedule]
    ON [dbo].[InterviewerAssignment]([interviewID] ASC, [interviewerID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[InterviewSchedule]...';


GO
CREATE TABLE [dbo].[InterviewSchedule] (
    [interviewID]   INT            IDENTITY (1, 1) NOT NULL,
    [applicationID] INT            NOT NULL,
    [scheduledTime] DATETIME       NOT NULL,
    [location]      NVARCHAR (200) NOT NULL,
    [status]        VARCHAR (20)   NOT NULL,
    [result]        VARCHAR (20)   NULL,
    [notes]         NVARCHAR (MAX) NULL,
    [createdAt]     DATETIME       NOT NULL,
    [isDeleted]     BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([interviewID] ASC)
);


GO
PRINT N'Creating Index [dbo].[InterviewSchedule].[IX_InterviewSchedule_applicationID]...';


GO
CREATE NONCLUSTERED INDEX [IX_InterviewSchedule_applicationID]
    ON [dbo].[InterviewSchedule]([applicationID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[KnowledgeArchive]...';


GO
CREATE TABLE [dbo].[KnowledgeArchive] (
    [archiveID]       INT            IDENTITY (1, 1) NOT NULL,
    [clubID]          INT            NOT NULL,
    [title]           NVARCHAR (200) NOT NULL,
    [content]         NVARCHAR (MAX) NOT NULL,
    [fileUrl]         VARCHAR (500)  NULL,
    [uploadedBy]      INT            NOT NULL,
    [createdAt]       DATETIME       NOT NULL,
    [isDeleted]       BIT            NOT NULL,
    [visibilityScope] VARCHAR (20)   NOT NULL,
    [indexingStatus]  VARCHAR (20)   NOT NULL,
    [sourceFormat]    VARCHAR (10)   NOT NULL,
    PRIMARY KEY CLUSTERED ([archiveID] ASC)
);


GO
PRINT N'Creating Index [dbo].[KnowledgeArchive].[IX_KnowledgeArchive_uploadedBy]...';


GO
CREATE NONCLUSTERED INDEX [IX_KnowledgeArchive_uploadedBy]
    ON [dbo].[KnowledgeArchive]([uploadedBy] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[KnowledgeArchive].[IX_KnowledgeArchive_clubID]...';


GO
CREATE NONCLUSTERED INDEX [IX_KnowledgeArchive_clubID]
    ON [dbo].[KnowledgeArchive]([clubID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[KnowledgeChunk]...';


GO
CREATE TABLE [dbo].[KnowledgeChunk] (
    [chunkID]          INT            IDENTITY (1, 1) NOT NULL,
    [archiveID]        INT            NOT NULL,
    [chunkIndex]       INT            NOT NULL,
    [chunkText]        NVARCHAR (MAX) NOT NULL,
    [embeddingVector]  NVARCHAR (MAX) NOT NULL,
    [createdAt]        DATETIME2 (7)  NOT NULL,
    [isDeleted]        BIT            NOT NULL,
    [embeddingStoreId] VARCHAR (64)   NULL,
    CONSTRAINT [PK_KnowledgeChunk] PRIMARY KEY CLUSTERED ([chunkID] ASC)
);


GO
PRINT N'Creating Index [dbo].[KnowledgeChunk].[IX_KnowledgeChunk_ArchiveID]...';


GO
CREATE NONCLUSTERED INDEX [IX_KnowledgeChunk_ArchiveID]
    ON [dbo].[KnowledgeChunk]([archiveID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[MemberPerformance]...';


GO
CREATE TABLE [dbo].[MemberPerformance] (
    [performanceID]             INT            IDENTITY (1, 1) NOT NULL,
    [eventID]                   INT            NOT NULL,
    [userID]                    INT            NOT NULL,
    [clubID]                    INT            NOT NULL,
    [basePoints]                INT            NOT NULL,
    [bonusPoints]               INT            NOT NULL,
    [penaltyPoints]             INT            NOT NULL,
    [finalPoints]               AS             (([basePoints] + [bonusPoints]) - [penaltyPoints]) PERSISTED,
    [leaderEvaluation]          NVARCHAR (MAX) NULL,
    [sourceContributionID]      INT            NULL,
    [individualRankingEligible] BIT            NOT NULL,
    [updatedAt]                 DATETIME       NOT NULL,
    [isDeleted]                 BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([performanceID] ASC)
);


GO
PRINT N'Creating Index [dbo].[MemberPerformance].[IX_MemberPerformance_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_MemberPerformance_userID]
    ON [dbo].[MemberPerformance]([userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[MemberPerformance].[UX_Performance_SingleSheet]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Performance_SingleSheet]
    ON [dbo].[MemberPerformance]([eventID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[MemberPerformance].[IX_MemberPerformance_clubID]...';


GO
CREATE NONCLUSTERED INDEX [IX_MemberPerformance_clubID]
    ON [dbo].[MemberPerformance]([clubID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[MemberRankingSnapshot]...';


GO
CREATE TABLE [dbo].[MemberRankingSnapshot] (
    [snapshotID]              INT            IDENTITY (1, 1) NOT NULL,
    [semesterID]              INT            NOT NULL,
    [clubID]                  INT            NOT NULL,
    [userID]                  INT            NOT NULL,
    [fullName]                NVARCHAR (255) NULL,
    [email]                   NVARCHAR (255) NULL,
    [rank]                    INT            NOT NULL,
    [totalScore]              INT            NOT NULL,
    [contributionPoint]       INT            NOT NULL,
    [eventParticipationPoint] INT            NOT NULL,
    [performancePoint]        INT            NOT NULL,
    [finalizedAt]             DATETIME2 (7)  NOT NULL,
    [finalizedBy]             INT            NULL,
    [isDeleted]               BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([snapshotID] ASC)
);


GO
PRINT N'Creating Index [dbo].[MemberRankingSnapshot].[UX_MemberRankingSnapshot_ActiveUser]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_MemberRankingSnapshot_ActiveUser]
    ON [dbo].[MemberRankingSnapshot]([semesterID] ASC, [clubID] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[MemberRankingSnapshot].[IX_MemberRankingSnapshot_SemesterClubRank]...';


GO
CREATE NONCLUSTERED INDEX [IX_MemberRankingSnapshot_SemesterClubRank]
    ON [dbo].[MemberRankingSnapshot]([semesterID] ASC, [clubID] ASC, [rank] ASC, [userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[OTPVerification]...';


GO
CREATE TABLE [dbo].[OTPVerification] (
    [otpID]     INT            IDENTITY (1, 1) NOT NULL,
    [email]     NVARCHAR (255) NOT NULL,
    [otpCode]   NVARCHAR (6)   NOT NULL,
    [createdAt] DATETIME2 (7)  NOT NULL,
    [expiresAt] DATETIME2 (7)  NOT NULL,
    [isUsed]    BIT            NOT NULL,
    [attempts]  INT            NULL,
    PRIMARY KEY CLUSTERED ([otpID] ASC)
);


GO
PRINT N'Creating Table [dbo].[RecruitmentApplication]...';


GO
CREATE TABLE [dbo].[RecruitmentApplication] (
    [applicationID]  INT            IDENTITY (1, 1) NOT NULL,
    [clubID]         INT            NOT NULL,
    [userID]         INT            NOT NULL,
    [semesterID]     INT            NOT NULL,
    [cvUrl]          VARCHAR (500)  NULL,
    [introduction]   NVARCHAR (MAX) NULL,
    [answersJson]    NVARCHAR (MAX) NULL,
    [status]         VARCHAR (20)   NOT NULL,
    [interviewScore] DECIMAL (4, 2) NULL,
    [aiScore]        DECIMAL (5, 2) NULL,
    [aiFeedback]     NVARCHAR (MAX) NULL,
    [submittedAt]    DATETIME       NULL,
    [createdAt]      DATETIME       NOT NULL,
    [isDeleted]      BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([applicationID] ASC)
);


GO
PRINT N'Creating Index [dbo].[RecruitmentApplication].[UX_Recruit_OnePerPeriod]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Recruit_OnePerPeriod]
    ON [dbo].[RecruitmentApplication]([clubID] ASC, [userID] ASC, [semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[RecruitmentApplication].[IX_RecruitmentApplication_userID]...';


GO
CREATE NONCLUSTERED INDEX [IX_RecruitmentApplication_userID]
    ON [dbo].[RecruitmentApplication]([userID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[RecruitmentApplication].[IX_RecruitmentApplication_semesterID]...';


GO
CREATE NONCLUSTERED INDEX [IX_RecruitmentApplication_semesterID]
    ON [dbo].[RecruitmentApplication]([semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[RecruitmentCycle]...';


GO
CREATE TABLE [dbo].[RecruitmentCycle] (
    [cycleID]       INT            IDENTITY (1, 1) NOT NULL,
    [title]         NVARCHAR (255) NULL,
    [questionsJson] NVARCHAR (MAX) NULL,
    [status]        NVARCHAR (50)  NULL,
    [createdAt]     DATETIME2 (7)  NULL,
    [startDate]     DATE           NULL,
    [closedAt]      DATETIME2 (7)  NULL,
    [reminded]      BIT            NULL,
    [isDeleted]     BIT            NULL,
    [clubID]        INT            NULL,
    [parentCycleID] INT            NULL,
    [semesterID]    INT            NULL,
    [endDate]       DATE           NULL,
    PRIMARY KEY CLUSTERED ([cycleID] ASC)
);


GO
PRINT N'Creating Index [dbo].[RecruitmentCycle].[IX_RecruitmentCycle_Parent_Club]...';


GO
CREATE NONCLUSTERED INDEX [IX_RecruitmentCycle_Parent_Club]
    ON [dbo].[RecruitmentCycle]([parentCycleID] ASC, [clubID] ASC, [status] ASC, [isDeleted] ASC);


GO
PRINT N'Creating Index [dbo].[RecruitmentCycle].[IX_RecruitmentCycle_Club_Status]...';


GO
CREATE NONCLUSTERED INDEX [IX_RecruitmentCycle_Club_Status]
    ON [dbo].[RecruitmentCycle]([clubID] ASC, [status] ASC, [isDeleted] ASC);


GO
PRINT N'Creating Table [dbo].[RecruitmentReminder]...';


GO
CREATE TABLE [dbo].[RecruitmentReminder] (
    [reminderID] INT            IDENTITY (1, 1) NOT NULL,
    [cycleID]    INT            NULL,
    [sentAt]     DATETIME2 (7)  NULL,
    [channel]    NVARCHAR (50)  NULL,
    [status]     NVARCHAR (50)  NULL,
    [message]    NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([reminderID] ASC)
);


GO
PRINT N'Creating Table [dbo].[SchedulerLog]...';


GO
CREATE TABLE [dbo].[SchedulerLog] (
    [logID]         INT           IDENTITY (1, 1) NOT NULL,
    [jobName]       VARCHAR (255) NOT NULL,
    [executionDate] DATE          NOT NULL,
    [executedAt]    DATETIME      NOT NULL,
    [status]        VARCHAR (50)  NOT NULL,
    PRIMARY KEY CLUSTERED ([logID] ASC),
    CONSTRAINT [UQ_SchedulerLog_Job_Date] UNIQUE NONCLUSTERED ([jobName] ASC, [executionDate] ASC)
);


GO
PRINT N'Creating Table [dbo].[Semester]...';


GO
CREATE TABLE [dbo].[Semester] (
    [semesterID]   INT          IDENTITY (1, 1) NOT NULL,
    [semesterCode] VARCHAR (10) NOT NULL,
    [startDate]    DATE         NOT NULL,
    [endDate]      DATE         NOT NULL,
    [isActive]     BIT          NOT NULL,
    [isDeleted]    BIT          NOT NULL,
    PRIMARY KEY CLUSTERED ([semesterID] ASC)
);


GO
PRINT N'Creating Index [dbo].[Semester].[UX_Semester_OneActive]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Semester_OneActive]
    ON [dbo].[Semester]([isActive] ASC) WHERE ([isActive]=(1) AND [isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[Semester].[UX_Semester_semesterCode]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Semester_semesterCode]
    ON [dbo].[Semester]([semesterCode] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[SystemConfig]...';


GO
CREATE TABLE [dbo].[SystemConfig] (
    [configID]    INT            IDENTITY (1, 1) NOT NULL,
    [configKey]   VARCHAR (50)   NOT NULL,
    [configValue] NVARCHAR (MAX) NOT NULL,
    [updatedAt]   DATETIME       NOT NULL,
    [updatedBy]   INT            NULL,
    PRIMARY KEY CLUSTERED ([configID] ASC),
    UNIQUE NONCLUSTERED ([configKey] ASC)
);


GO
PRINT N'Creating Index [dbo].[SystemConfig].[IX_SystemConfig_updatedBy]...';


GO
CREATE NONCLUSTERED INDEX [IX_SystemConfig_updatedBy]
    ON [dbo].[SystemConfig]([updatedBy] ASC);


GO
PRINT N'Creating Table [dbo].[SystemRole]...';


GO
CREATE TABLE [dbo].[SystemRole] (
    [roleID]      INT            IDENTITY (1, 1) NOT NULL,
    [roleName]    VARCHAR (30)   NOT NULL,
    [description] NVARCHAR (200) NULL,
    [isDeleted]   BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([roleID] ASC)
);


GO
PRINT N'Creating Index [dbo].[SystemRole].[UX_SystemRole_roleName]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_SystemRole_roleName]
    ON [dbo].[SystemRole]([roleName] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[tblNotificationRecipients]...';


GO
CREATE TABLE [dbo].[tblNotificationRecipients] (
    [recipientID]    INT           IDENTITY (1, 1) NOT NULL,
    [notificationID] INT           NOT NULL,
    [userID]         INT           NOT NULL,
    [isRead]         BIT           NOT NULL,
    [readAt]         DATETIME2 (7) NULL,
    [createdAt]      DATETIME2 (7) NOT NULL,
    CONSTRAINT [PK_tblNotificationRecipients] PRIMARY KEY CLUSTERED ([recipientID] ASC),
    CONSTRAINT [UQ_tblNotificationRecipients_Notification_User] UNIQUE NONCLUSTERED ([notificationID] ASC, [userID] ASC)
);


GO
PRINT N'Creating Index [dbo].[tblNotificationRecipients].[IX_NotificationRecipients_User_Read]...';


GO
CREATE NONCLUSTERED INDEX [IX_NotificationRecipients_User_Read]
    ON [dbo].[tblNotificationRecipients]([userID] ASC, [isRead] ASC, [notificationID] ASC);


GO
PRINT N'Creating Table [dbo].[tblNotifications]...';


GO
CREATE TABLE [dbo].[tblNotifications] (
    [notificationID]   INT            IDENTITY (1, 1) NOT NULL,
    [clubID]           INT            NULL,
    [title]            NVARCHAR (255) NULL,
    [content]          NVARCHAR (MAX) NOT NULL,
    [notificationType] VARCHAR (50)   NULL,
    [createdBy]        INT            NOT NULL,
    [createdAt]        DATETIME2 (7)  NOT NULL,
    [isDeleted]        BIT            NOT NULL,
    [actionUrl]        NVARCHAR (500) NULL,
    [actionLabel]      NVARCHAR (100) NULL,
    CONSTRAINT [PK_tblNotifications] PRIMARY KEY CLUSTERED ([notificationID] ASC)
);


GO
PRINT N'Creating Index [dbo].[tblNotifications].[IX_Notifications_Club_CreatedAt]...';


GO
CREATE NONCLUSTERED INDEX [IX_Notifications_Club_CreatedAt]
    ON [dbo].[tblNotifications]([clubID] ASC, [createdAt] DESC);


GO
PRINT N'Creating Table [dbo].[UserAccount]...';


GO
CREATE TABLE [dbo].[UserAccount] (
    [userID]             INT            IDENTITY (1, 1) NOT NULL,
    [roleID]             INT            NOT NULL,
    [email]              VARCHAR (100)  NOT NULL,
    [password]           VARCHAR (100)  NULL,
    [fullName]           NVARCHAR (100) NOT NULL,
    [studentId]          VARCHAR (20)   NULL,
    [phoneNumber]        VARCHAR (20)   NULL,
    [major]              NVARCHAR (100) NULL,
    [accountStatus]      VARCHAR (20)   NOT NULL,
    [createdAt]          DATETIME       NOT NULL,
    [isDeleted]          BIT            NOT NULL,
    [tokenInvalidatedAt] DATETIME2 (7)  NULL,
    PRIMARY KEY CLUSTERED ([userID] ASC)
);


GO
PRINT N'Creating Index [dbo].[UserAccount].[UX_UserAccount_email]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_UserAccount_email]
    ON [dbo].[UserAccount]([email] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[UserAccount].[IX_UserAccount_roleID]...';


GO
CREATE NONCLUSTERED INDEX [IX_UserAccount_roleID]
    ON [dbo].[UserAccount]([roleID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Table [dbo].[VnPayPaymentIntent]...';


GO
CREATE TABLE [dbo].[VnPayPaymentIntent] (
    [vnpayPaymentIntentID]  BIGINT          IDENTITY (1, 1) NOT NULL,
    [transactionReference]  VARCHAR (40)    NOT NULL,
    [paymentReference]      VARCHAR (64)    NOT NULL,
    [registrationID]        INT             NULL,
    [guestRegistrationID]   INT             NULL,
    [amount]                DECIMAL (18, 2) NOT NULL,
    [currency]              VARCHAR (3)     NOT NULL,
    [status]                VARCHAR (20)    NOT NULL,
    [createdAt]             DATETIME2 (7)   NOT NULL,
    [expiresAt]             DATETIME2 (7)   NOT NULL,
    [completedAt]           DATETIME2 (7)   NULL,
    [providerTransactionId] VARCHAR (100)   NULL,
    PRIMARY KEY CLUSTERED ([vnpayPaymentIntentID] ASC)
);


GO
PRINT N'Creating Index [dbo].[VnPayPaymentIntent].[UX_VnPayPaymentIntent_TxnRef]...';


GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_VnPayPaymentIntent_TxnRef]
    ON [dbo].[VnPayPaymentIntent]([transactionReference] ASC);


GO
PRINT N'Creating Index [dbo].[VnPayPaymentIntent].[IX_VnPayPaymentIntent_PaymentReference]...';


GO
CREATE NONCLUSTERED INDEX [IX_VnPayPaymentIntent_PaymentReference]
    ON [dbo].[VnPayPaymentIntent]([paymentReference] ASC);


GO
PRINT N'Creating Table [dbo].[WithdrawLog]...';


GO
CREATE TABLE [dbo].[WithdrawLog] (
    [withdrawLogID]  INT            IDENTITY (1, 1) NOT NULL,
    [applicationID]  INT            NOT NULL,
    [studentID]      INT            NOT NULL,
    [clubID]         INT            NOT NULL,
    [semesterID]     INT            NOT NULL,
    [withdrawReason] NVARCHAR (500) NULL,
    [withdrawnAt]    DATETIME       NOT NULL,
    [isDeleted]      BIT            NOT NULL,
    PRIMARY KEY CLUSTERED ([withdrawLogID] ASC)
);


GO
PRINT N'Creating Index [dbo].[WithdrawLog].[IX_WithdrawLog_ClubSemester]...';


GO
CREATE NONCLUSTERED INDEX [IX_WithdrawLog_ClubSemester]
    ON [dbo].[WithdrawLog]([clubID] ASC, [semesterID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Index [dbo].[WithdrawLog].[IX_WithdrawLog_User]...';


GO
CREATE NONCLUSTERED INDEX [IX_WithdrawLog_User]
    ON [dbo].[WithdrawLog]([studentID] ASC) WHERE ([isDeleted]=(0));


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AIChatAuditLog]...';


GO
ALTER TABLE [dbo].[AIChatAuditLog]
    ADD DEFAULT ((0)) FOR [tokensUsed];


GO
PRINT N'Creating Default Constraint [dbo].[DF_AIChatAuditLog_Status]...';


GO
ALTER TABLE [dbo].[AIChatAuditLog]
    ADD CONSTRAINT [DF_AIChatAuditLog_Status] DEFAULT ('Success') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AIChatAuditLog]...';


GO
ALTER TABLE [dbo].[AIChatAuditLog]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AllowedEmailWhitelist]...';


GO
ALTER TABLE [dbo].[AllowedEmailWhitelist]
    ADD DEFAULT (getdate()) FOR [addedAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AllowedEmailWhitelist]...';


GO
ALTER TABLE [dbo].[AllowedEmailWhitelist]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceRecord]...';


GO
ALTER TABLE [dbo].[AttendanceRecord]
    ADD DEFAULT (getdate()) FOR [markedAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceRecord]...';


GO
ALTER TABLE [dbo].[AttendanceRecord]
    ADD DEFAULT ((0)) FOR [isVerifiedByAI];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceRecord]...';


GO
ALTER TABLE [dbo].[AttendanceRecord]
    ADD DEFAULT ('Absent') FOR [attendanceStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceRecord]...';


GO
ALTER TABLE [dbo].[AttendanceRecord]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceRecord]...';


GO
ALTER TABLE [dbo].[AttendanceRecord]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceSession]...';


GO
ALTER TABLE [dbo].[AttendanceSession]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceSession]...';


GO
ALTER TABLE [dbo].[AttendanceSession]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AttendanceSession]...';


GO
ALTER TABLE [dbo].[AttendanceSession]
    ADD DEFAULT ('PENDING') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[AuditLog]...';


GO
ALTER TABLE [dbo].[AuditLog]
    ADD DEFAULT (getdate()) FOR [executedAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Club]...';


GO
ALTER TABLE [dbo].[Club]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Club]...';


GO
ALTER TABLE [dbo].[Club]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Club]...';


GO
ALTER TABLE [dbo].[Club]
    ADD DEFAULT ('Active') FOR [clubStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubBlacklist]...';


GO
ALTER TABLE [dbo].[ClubBlacklist]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubBlacklist]...';


GO
ALTER TABLE [dbo].[ClubBlacklist]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_ClubEvaluation_CreatedAt]...';


GO
ALTER TABLE [dbo].[ClubEvaluation]
    ADD CONSTRAINT [DF_ClubEvaluation_CreatedAt] DEFAULT (sysdatetime()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_ClubEvaluation_IsDeleted]...';


GO
ALTER TABLE [dbo].[ClubEvaluation]
    ADD CONSTRAINT [DF_ClubEvaluation_IsDeleted] DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubKPI]...';


GO
ALTER TABLE [dbo].[ClubKPI]
    ADD DEFAULT (getdate()) FOR [updatedAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubKPI]...';


GO
ALTER TABLE [dbo].[ClubKPI]
    ADD DEFAULT ((0)) FOR [totalEventsHeld];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubKPI]...';


GO
ALTER TABLE [dbo].[ClubKPI]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubKPI]...';


GO
ALTER TABLE [dbo].[ClubKPI]
    ADD DEFAULT ((0.00)) FOR [kpiScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubKPI]...';


GO
ALTER TABLE [dbo].[ClubKPI]
    ADD DEFAULT ((0)) FOR [totalMembers];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubMembership]...';


GO
ALTER TABLE [dbo].[ClubMembership]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubMembership]...';


GO
ALTER TABLE [dbo].[ClubMembership]
    ADD DEFAULT (getdate()) FOR [joinedDate];


GO
PRINT N'Creating Default Constraint [dbo].[DF_ClubPost_IsDeleted]...';


GO
ALTER TABLE [dbo].[ClubPost]
    ADD CONSTRAINT [DF_ClubPost_IsDeleted] DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint [dbo].[DF_ClubPost_CreatedAt]...';


GO
ALTER TABLE [dbo].[ClubPost]
    ADD CONSTRAINT [DF_ClubPost_CreatedAt] DEFAULT (sysdatetime()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubRegistration]...';


GO
ALTER TABLE [dbo].[ClubRegistration]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubRegistration]...';


GO
ALTER TABLE [dbo].[ClubRegistration]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubRegistration]...';


GO
ALTER TABLE [dbo].[ClubRegistration]
    ADD DEFAULT ('PENDING') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubRegistrationMember]...';


GO
ALTER TABLE [dbo].[ClubRegistrationMember]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ClubRole]...';


GO
ALTER TABLE [dbo].[ClubRole]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Competition]...';


GO
ALTER TABLE [dbo].[Competition]
    ADD DEFAULT ('Draft') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Competition]...';


GO
ALTER TABLE [dbo].[Competition]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Competition]...';


GO
ALTER TABLE [dbo].[Competition]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[competition_award]...';


GO
ALTER TABLE [dbo].[competition_award]
    ADD DEFAULT ((0)) FOR [points_bonus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[competition_award]...';


GO
ALTER TABLE [dbo].[competition_award]
    ADD DEFAULT ((0)) FOR [is_deleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[competition_award]...';


GO
ALTER TABLE [dbo].[competition_award]
    ADD DEFAULT (getdate()) FOR [created_at];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[competition_penalty]...';


GO
ALTER TABLE [dbo].[competition_penalty]
    ADD DEFAULT (getdate()) FOR [created_at];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[competition_penalty]...';


GO
ALTER TABLE [dbo].[competition_penalty]
    ADD DEFAULT ((0)) FOR [points_deduction];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[competition_penalty]...';


GO
ALTER TABLE [dbo].[competition_penalty]
    ADD DEFAULT ((0)) FOR [is_deleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[CompetitionScore]...';


GO
ALTER TABLE [dbo].[CompetitionScore]
    ADD DEFAULT ((0)) FOR [totalScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[CompetitionScore]...';


GO
ALTER TABLE [dbo].[CompetitionScore]
    ADD DEFAULT ((0)) FOR [participationScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[CompetitionScore]...';


GO
ALTER TABLE [dbo].[CompetitionScore]
    ADD DEFAULT ((0)) FOR [complianceScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[CompetitionScore]...';


GO
ALTER TABLE [dbo].[CompetitionScore]
    ADD DEFAULT ((0)) FOR [feedbackScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[CompetitionScore]...';


GO
ALTER TABLE [dbo].[CompetitionScore]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[CompetitionScore]...';


GO
ALTER TABLE [dbo].[CompetitionScore]
    ADD DEFAULT ((0)) FOR [activityScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[CompetitionScore]...';


GO
ALTER TABLE [dbo].[CompetitionScore]
    ADD DEFAULT ((0)) FOR [engagementScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ContributionAppeal]...';


GO
ALTER TABLE [dbo].[ContributionAppeal]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ContributionAppeal]...';


GO
ALTER TABLE [dbo].[ContributionAppeal]
    ADD DEFAULT (getdate()) FOR [requestedAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ContributionAppeal]...';


GO
ALTER TABLE [dbo].[ContributionAppeal]
    ADD DEFAULT ('PENDING') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ContributionBatch]...';


GO
ALTER TABLE [dbo].[ContributionBatch]
    ADD DEFAULT ('SCORING') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ContributionBatch]...';


GO
ALTER TABLE [dbo].[ContributionBatch]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[ContributionBatch]...';


GO
ALTER TABLE [dbo].[ContributionBatch]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[DisciplineLog]...';


GO
ALTER TABLE [dbo].[DisciplineLog]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[DisciplineLog]...';


GO
ALTER TABLE [dbo].[DisciplineLog]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[DisciplineLog]...';


GO
ALTER TABLE [dbo].[DisciplineLog]
    ADD DEFAULT ('Active') FOR [disciplineStatus];


GO
PRINT N'Creating Default Constraint [dbo].[DF_Event_submissionAttemptCount]...';


GO
ALTER TABLE [dbo].[Event]
    ADD CONSTRAINT [DF_Event_submissionAttemptCount] DEFAULT ((0)) FOR [submissionAttemptCount];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ((0)) FOR [budget];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ((0)) FOR [allowWalkIn];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ((0)) FOR [isInternal];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ((1)) FOR [feedbackEnabled];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ((0)) FOR [isScoreLocked];


GO
PRINT N'Creating Default Constraint [dbo].[DF_Event_IsPaidEvent]...';


GO
ALTER TABLE [dbo].[Event]
    ADD CONSTRAINT [DF_Event_IsPaidEvent] DEFAULT ((0)) FOR [isPaidEvent];


GO
PRINT N'Creating Default Constraint [dbo].[DF_Event_TicketCurrency]...';


GO
ALTER TABLE [dbo].[Event]
    ADD CONSTRAINT [DF_Event_TicketCurrency] DEFAULT ('VND') FOR [ticketCurrency];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ('Draft') FOR [eventStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT ((0)) FOR [isResubmitted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Event]...';


GO
ALTER TABLE [dbo].[Event]
    ADD DEFAULT (N'FPTU Campus') FOR [location];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventAssignment]...';


GO
ALTER TABLE [dbo].[EventAssignment]
    ADD DEFAULT (getdate()) FOR [assignedAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventAssignment]...';


GO
ALTER TABLE [dbo].[EventAssignment]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventContribution]...';


GO
ALTER TABLE [dbo].[EventContribution]
    ADD DEFAULT ((1)) FOR [individualRankingEligible];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventContribution]...';


GO
ALTER TABLE [dbo].[EventContribution]
    ADD DEFAULT ((0)) FOR [bonusPoints];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventContribution]...';


GO
ALTER TABLE [dbo].[EventContribution]
    ADD DEFAULT ((1.0)) FOR [multiplier];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventContribution]...';


GO
ALTER TABLE [dbo].[EventContribution]
    ADD DEFAULT ((0)) FOR [penaltyPoints];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventContribution]...';


GO
ALTER TABLE [dbo].[EventContribution]
    ADD DEFAULT ((0)) FOR [releasedToPerformance];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventContribution]...';


GO
ALTER TABLE [dbo].[EventContribution]
    ADD DEFAULT ((0)) FOR [finalPoints];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventContribution]...';


GO
ALTER TABLE [dbo].[EventContribution]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventFeedback]...';


GO
ALTER TABLE [dbo].[EventFeedback]
    ADD DEFAULT ((0)) FOR [isIncludedInExternalScore];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventFeedback]...';


GO
ALTER TABLE [dbo].[EventFeedback]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventFeedback]...';


GO
ALTER TABLE [dbo].[EventFeedback]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventFeedbackInvitation]...';


GO
ALTER TABLE [dbo].[EventFeedbackInvitation]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventFeedbackInvitation]...';


GO
ALTER TABLE [dbo].[EventFeedbackInvitation]
    ADD DEFAULT ('ACTIVE') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventFeedbackInvitation]...';


GO
ALTER TABLE [dbo].[EventFeedbackInvitation]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistration]...';


GO
ALTER TABLE [dbo].[EventRegistration]
    ADD DEFAULT (getdate()) FOR [registeredAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_EventRegistration_PaymentStatus]...';


GO
ALTER TABLE [dbo].[EventRegistration]
    ADD CONSTRAINT [DF_EventRegistration_PaymentStatus] DEFAULT ('NOT_REQUIRED') FOR [paymentStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistration]...';


GO
ALTER TABLE [dbo].[EventRegistration]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_EventRegistration_CapacityExempt]...';


GO
ALTER TABLE [dbo].[EventRegistration]
    ADD CONSTRAINT [DF_EventRegistration_CapacityExempt] DEFAULT ((0)) FOR [capacityExempt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistration]...';


GO
ALTER TABLE [dbo].[EventRegistration]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistration]...';


GO
ALTER TABLE [dbo].[EventRegistration]
    ADD DEFAULT ('PENDING_VERIFICATION') FOR [registrationStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistrationPolicy]...';


GO
ALTER TABLE [dbo].[EventRegistrationPolicy]
    ADD DEFAULT ((0)) FOR [requiresManualApproval];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistrationPolicy]...';


GO
ALTER TABLE [dbo].[EventRegistrationPolicy]
    ADD DEFAULT ((1)) FOR [isEnabled];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistrationPolicy]...';


GO
ALTER TABLE [dbo].[EventRegistrationPolicy]
    ADD DEFAULT ((0)) FOR [waitlistEnabled];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistrationPolicy]...';


GO
ALTER TABLE [dbo].[EventRegistrationPolicy]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRegistrationPolicy]...';


GO
ALTER TABLE [dbo].[EventRegistrationPolicy]
    ADD DEFAULT ((0)) FOR [requiresApproval];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventReport]...';


GO
ALTER TABLE [dbo].[EventReport]
    ADD DEFAULT (getdate()) FOR [uploadedAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_EventReport_version]...';


GO
ALTER TABLE [dbo].[EventReport]
    ADD CONSTRAINT [DF_EventReport_version] DEFAULT ((0)) FOR [version];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventReport]...';


GO
ALTER TABLE [dbo].[EventReport]
    ADD DEFAULT ('UPLOADED') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventReport]...';


GO
ALTER TABLE [dbo].[EventReport]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint [dbo].[DF_EventReport_reportSource]...';


GO
ALTER TABLE [dbo].[EventReport]
    ADD CONSTRAINT [DF_EventReport_reportSource] DEFAULT ('MANUAL_UPLOAD') FOR [reportSource];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventReportReminderLog]...';


GO
ALTER TABLE [dbo].[EventReportReminderLog]
    ADD DEFAULT (getdate()) FOR [sentAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventReportReminderLog]...';


GO
ALTER TABLE [dbo].[EventReportReminderLog]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[EventRole]...';


GO
ALTER TABLE [dbo].[EventRole]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestEventRegistration]...';


GO
ALTER TABLE [dbo].[GuestEventRegistration]
    ADD DEFAULT ('ONLINE') FOR [registrationChannel];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestEventRegistration]...';


GO
ALTER TABLE [dbo].[GuestEventRegistration]
    ADD DEFAULT ('PENDING_VERIFICATION') FOR [registrationStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestEventRegistration]...';


GO
ALTER TABLE [dbo].[GuestEventRegistration]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestEventRegistration]...';


GO
ALTER TABLE [dbo].[GuestEventRegistration]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestEventRegistration]...';


GO
ALTER TABLE [dbo].[GuestEventRegistration]
    ADD DEFAULT ('GUEST') FOR [participantType];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestVerificationOtp]...';


GO
ALTER TABLE [dbo].[GuestVerificationOtp]
    ADD DEFAULT ((0)) FOR [attemptCount];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestVerificationOtp]...';


GO
ALTER TABLE [dbo].[GuestVerificationOtp]
    ADD DEFAULT ((5)) FOR [maxAttempts];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestVerificationOtp]...';


GO
ALTER TABLE [dbo].[GuestVerificationOtp]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestVerificationOtp]...';


GO
ALTER TABLE [dbo].[GuestVerificationOtp]
    ADD DEFAULT ('ACTIVE') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[GuestVerificationOtp]...';


GO
ALTER TABLE [dbo].[GuestVerificationOtp]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[InterviewerAssignment]...';


GO
ALTER TABLE [dbo].[InterviewerAssignment]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[InterviewSchedule]...';


GO
ALTER TABLE [dbo].[InterviewSchedule]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[InterviewSchedule]...';


GO
ALTER TABLE [dbo].[InterviewSchedule]
    ADD DEFAULT ('Scheduled') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[InterviewSchedule]...';


GO
ALTER TABLE [dbo].[InterviewSchedule]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint [dbo].[DF_KnowledgeArchive_VisibilityScope]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive]
    ADD CONSTRAINT [DF_KnowledgeArchive_VisibilityScope] DEFAULT ('ClubInternal') FOR [visibilityScope];


GO
PRINT N'Creating Default Constraint [dbo].[DF_KnowledgeArchive_IndexingStatus]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive]
    ADD CONSTRAINT [DF_KnowledgeArchive_IndexingStatus] DEFAULT ('Pending') FOR [indexingStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[KnowledgeArchive]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[KnowledgeArchive]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_KnowledgeArchive_SourceFormat]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive]
    ADD CONSTRAINT [DF_KnowledgeArchive_SourceFormat] DEFAULT ('MD') FOR [sourceFormat];


GO
PRINT N'Creating Default Constraint [dbo].[DF_KnowledgeChunk_CreatedAt]...';


GO
ALTER TABLE [dbo].[KnowledgeChunk]
    ADD CONSTRAINT [DF_KnowledgeChunk_CreatedAt] DEFAULT (sysdatetime()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_KnowledgeChunk_IsDeleted]...';


GO
ALTER TABLE [dbo].[KnowledgeChunk]
    ADD CONSTRAINT [DF_KnowledgeChunk_IsDeleted] DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[MemberPerformance]...';


GO
ALTER TABLE [dbo].[MemberPerformance]
    ADD DEFAULT ((0)) FOR [bonusPoints];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[MemberPerformance]...';


GO
ALTER TABLE [dbo].[MemberPerformance]
    ADD DEFAULT ((0)) FOR [basePoints];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[MemberPerformance]...';


GO
ALTER TABLE [dbo].[MemberPerformance]
    ADD DEFAULT ((0)) FOR [penaltyPoints];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[MemberPerformance]...';


GO
ALTER TABLE [dbo].[MemberPerformance]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[MemberPerformance]...';


GO
ALTER TABLE [dbo].[MemberPerformance]
    ADD DEFAULT ((1)) FOR [individualRankingEligible];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[MemberPerformance]...';


GO
ALTER TABLE [dbo].[MemberPerformance]
    ADD DEFAULT (getdate()) FOR [updatedAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_MemberRankingSnapshot_isDeleted]...';


GO
ALTER TABLE [dbo].[MemberRankingSnapshot]
    ADD CONSTRAINT [DF_MemberRankingSnapshot_isDeleted] DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[RecruitmentApplication]...';


GO
ALTER TABLE [dbo].[RecruitmentApplication]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[RecruitmentApplication]...';


GO
ALTER TABLE [dbo].[RecruitmentApplication]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[RecruitmentApplication]...';


GO
ALTER TABLE [dbo].[RecruitmentApplication]
    ADD DEFAULT ('Draft') FOR [status];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[RecruitmentCycle]...';


GO
ALTER TABLE [dbo].[RecruitmentCycle]
    ADD DEFAULT ((0)) FOR [reminded];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[RecruitmentCycle]...';


GO
ALTER TABLE [dbo].[RecruitmentCycle]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Semester]...';


GO
ALTER TABLE [dbo].[Semester]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[Semester]...';


GO
ALTER TABLE [dbo].[Semester]
    ADD DEFAULT ((0)) FOR [isActive];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[SystemConfig]...';


GO
ALTER TABLE [dbo].[SystemConfig]
    ADD DEFAULT (getdate()) FOR [updatedAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[SystemRole]...';


GO
ALTER TABLE [dbo].[SystemRole]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint [dbo].[DF_tblNotificationRecipients_createdAt]...';


GO
ALTER TABLE [dbo].[tblNotificationRecipients]
    ADD CONSTRAINT [DF_tblNotificationRecipients_createdAt] DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_tblNotificationRecipients_isRead]...';


GO
ALTER TABLE [dbo].[tblNotificationRecipients]
    ADD CONSTRAINT [DF_tblNotificationRecipients_isRead] DEFAULT ((0)) FOR [isRead];


GO
PRINT N'Creating Default Constraint [dbo].[DF_tblNotifications_createdAt]...';


GO
ALTER TABLE [dbo].[tblNotifications]
    ADD CONSTRAINT [DF_tblNotifications_createdAt] DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint [dbo].[DF_tblNotifications_isDeleted]...';


GO
ALTER TABLE [dbo].[tblNotifications]
    ADD CONSTRAINT [DF_tblNotifications_isDeleted] DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[UserAccount]...';


GO
ALTER TABLE [dbo].[UserAccount]
    ADD DEFAULT ('Active') FOR [accountStatus];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[UserAccount]...';


GO
ALTER TABLE [dbo].[UserAccount]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[UserAccount]...';


GO
ALTER TABLE [dbo].[UserAccount]
    ADD DEFAULT (getdate()) FOR [createdAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[WithdrawLog]...';


GO
ALTER TABLE [dbo].[WithdrawLog]
    ADD DEFAULT (getdate()) FOR [withdrawnAt];


GO
PRINT N'Creating Default Constraint unnamed constraint on [dbo].[WithdrawLog]...';


GO
ALTER TABLE [dbo].[WithdrawLog]
    ADD DEFAULT ((0)) FOR [isDeleted];


GO
PRINT N'Creating Foreign Key [dbo].[FK_AIChat_User]...';


GO
ALTER TABLE [dbo].[AIChatAuditLog] WITH NOCHECK
    ADD CONSTRAINT [FK_AIChat_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Record_Registration]...';


GO
ALTER TABLE [dbo].[AttendanceRecord] WITH NOCHECK
    ADD CONSTRAINT [FK_Record_Registration] FOREIGN KEY ([registrationID]) REFERENCES [dbo].[EventRegistration] ([registrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Record_Session]...';


GO
ALTER TABLE [dbo].[AttendanceRecord] WITH NOCHECK
    ADD CONSTRAINT [FK_Record_Session] FOREIGN KEY ([sessionID]) REFERENCES [dbo].[AttendanceSession] ([sessionID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Record_User]...';


GO
ALTER TABLE [dbo].[AttendanceRecord] WITH NOCHECK
    ADD CONSTRAINT [FK_Record_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Record_GuestRegistration]...';


GO
ALTER TABLE [dbo].[AttendanceRecord] WITH NOCHECK
    ADD CONSTRAINT [FK_Record_GuestRegistration] FOREIGN KEY ([guestRegistrationID]) REFERENCES [dbo].[GuestEventRegistration] ([guestRegistrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Session_Event]...';


GO
ALTER TABLE [dbo].[AttendanceSession] WITH NOCHECK
    ADD CONSTRAINT [FK_Session_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Audit_Actor]...';


GO
ALTER TABLE [dbo].[AuditLog] WITH NOCHECK
    ADD CONSTRAINT [FK_Audit_Actor] FOREIGN KEY ([actorID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Blacklist_User]...';


GO
ALTER TABLE [dbo].[ClubBlacklist] WITH NOCHECK
    ADD CONSTRAINT [FK_Blacklist_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Blacklist_Club]...';


GO
ALTER TABLE [dbo].[ClubBlacklist] WITH NOCHECK
    ADD CONSTRAINT [FK_Blacklist_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ClubEvaluation_Semester]...';


GO
ALTER TABLE [dbo].[ClubEvaluation] WITH NOCHECK
    ADD CONSTRAINT [FK_ClubEvaluation_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ClubEvaluation_EvaluatedBy]...';


GO
ALTER TABLE [dbo].[ClubEvaluation] WITH NOCHECK
    ADD CONSTRAINT [FK_ClubEvaluation_EvaluatedBy] FOREIGN KEY ([evaluatedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ClubEvaluation_Club]...';


GO
ALTER TABLE [dbo].[ClubEvaluation] WITH NOCHECK
    ADD CONSTRAINT [FK_ClubEvaluation_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ClubKPI_Semester]...';


GO
ALTER TABLE [dbo].[ClubKPI] WITH NOCHECK
    ADD CONSTRAINT [FK_ClubKPI_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ClubKPI_Club]...';


GO
ALTER TABLE [dbo].[ClubKPI] WITH NOCHECK
    ADD CONSTRAINT [FK_ClubKPI_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Membership_Semester]...';


GO
ALTER TABLE [dbo].[ClubMembership] WITH NOCHECK
    ADD CONSTRAINT [FK_Membership_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Membership_Club]...';


GO
ALTER TABLE [dbo].[ClubMembership] WITH NOCHECK
    ADD CONSTRAINT [FK_Membership_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Membership_User]...';


GO
ALTER TABLE [dbo].[ClubMembership] WITH NOCHECK
    ADD CONSTRAINT [FK_Membership_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Membership_ClubRole]...';


GO
ALTER TABLE [dbo].[ClubMembership] WITH NOCHECK
    ADD CONSTRAINT [FK_Membership_ClubRole] FOREIGN KEY ([clubRoleID]) REFERENCES [dbo].[ClubRole] ([clubRoleID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ClubRegistration_User]...';


GO
ALTER TABLE [dbo].[ClubRegistration] WITH NOCHECK
    ADD CONSTRAINT [FK_ClubRegistration_User] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_RegMember_Registration]...';


GO
ALTER TABLE [dbo].[ClubRegistrationMember] WITH NOCHECK
    ADD CONSTRAINT [FK_RegMember_Registration] FOREIGN KEY ([registrationID]) REFERENCES [dbo].[ClubRegistration] ([registrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Competition_Semester]...';


GO
ALTER TABLE [dbo].[Competition] WITH NOCHECK
    ADD CONSTRAINT [FK_Competition_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Competition_Club]...';


GO
ALTER TABLE [dbo].[Competition] WITH NOCHECK
    ADD CONSTRAINT [FK_Competition_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_CompetitionAward_Competition]...';


GO
ALTER TABLE [dbo].[competition_award] WITH NOCHECK
    ADD CONSTRAINT [FK_CompetitionAward_Competition] FOREIGN KEY ([competition_id]) REFERENCES [dbo].[Competition] ([competitionID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_CompetitionPenalty_Competition]...';


GO
ALTER TABLE [dbo].[competition_penalty] WITH NOCHECK
    ADD CONSTRAINT [FK_CompetitionPenalty_Competition] FOREIGN KEY ([competition_id]) REFERENCES [dbo].[Competition] ([competitionID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_CompetitionPenalty_User]...';


GO
ALTER TABLE [dbo].[competition_penalty] WITH NOCHECK
    ADD CONSTRAINT [FK_CompetitionPenalty_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_CompetitionScore_User]...';


GO
ALTER TABLE [dbo].[CompetitionScore] WITH NOCHECK
    ADD CONSTRAINT [FK_CompetitionScore_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_CompetitionScore_Competition]...';


GO
ALTER TABLE [dbo].[CompetitionScore] WITH NOCHECK
    ADD CONSTRAINT [FK_CompetitionScore_Competition] FOREIGN KEY ([competitionID]) REFERENCES [dbo].[Competition] ([competitionID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ContributionAppeal_Batch]...';


GO
ALTER TABLE [dbo].[ContributionAppeal] WITH NOCHECK
    ADD CONSTRAINT [FK_ContributionAppeal_Batch] FOREIGN KEY ([batchID]) REFERENCES [dbo].[ContributionBatch] ([batchID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ContributionAppeal_Event]...';


GO
ALTER TABLE [dbo].[ContributionAppeal] WITH NOCHECK
    ADD CONSTRAINT [FK_ContributionAppeal_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ContributionAppeal_Contribution]...';


GO
ALTER TABLE [dbo].[ContributionAppeal] WITH NOCHECK
    ADD CONSTRAINT [FK_ContributionAppeal_Contribution] FOREIGN KEY ([contributionID]) REFERENCES [dbo].[EventContribution] ([contributionID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_ContributionAppeal_User]...';


GO
ALTER TABLE [dbo].[ContributionAppeal] WITH NOCHECK
    ADD CONSTRAINT [FK_ContributionAppeal_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Discipline_Semester]...';


GO
ALTER TABLE [dbo].[DisciplineLog] WITH NOCHECK
    ADD CONSTRAINT [FK_Discipline_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Discipline_User]...';


GO
ALTER TABLE [dbo].[DisciplineLog] WITH NOCHECK
    ADD CONSTRAINT [FK_Discipline_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Event_Semester]...';


GO
ALTER TABLE [dbo].[Event] WITH NOCHECK
    ADD CONSTRAINT [FK_Event_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Event_ApprovedBy]...';


GO
ALTER TABLE [dbo].[Event] WITH NOCHECK
    ADD CONSTRAINT [FK_Event_ApprovedBy] FOREIGN KEY ([approvedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Event_Club]...';


GO
ALTER TABLE [dbo].[Event] WITH NOCHECK
    ADD CONSTRAINT [FK_Event_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Assign_Event]...';


GO
ALTER TABLE [dbo].[EventAssignment] WITH NOCHECK
    ADD CONSTRAINT [FK_Assign_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Assign_EventRole]...';


GO
ALTER TABLE [dbo].[EventAssignment] WITH NOCHECK
    ADD CONSTRAINT [FK_Assign_EventRole] FOREIGN KEY ([eventRoleID]) REFERENCES [dbo].[EventRole] ([eventRoleID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Assign_User]...';


GO
ALTER TABLE [dbo].[EventAssignment] WITH NOCHECK
    ADD CONSTRAINT [FK_Assign_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_User]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_Club]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_Assignment]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_Assignment] FOREIGN KEY ([assignmentID]) REFERENCES [dbo].[EventAssignment] ([assignmentID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_ClubRole]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_ClubRole] FOREIGN KEY ([clubRoleIDSnapshot]) REFERENCES [dbo].[ClubRole] ([clubRoleID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_Attendance]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_Attendance] FOREIGN KEY ([attendanceRecordID]) REFERENCES [dbo].[AttendanceRecord] ([recordID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_Event]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_Membership]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_Membership] FOREIGN KEY ([membershipID]) REFERENCES [dbo].[ClubMembership] ([membershipID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_Registration]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_Registration] FOREIGN KEY ([registrationID]) REFERENCES [dbo].[EventRegistration] ([registrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventContribution_Batch]...';


GO
ALTER TABLE [dbo].[EventContribution] WITH NOCHECK
    ADD CONSTRAINT [FK_EventContribution_Batch] FOREIGN KEY ([batchID]) REFERENCES [dbo].[ContributionBatch] ([batchID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Feedback_GuestRegistration]...';


GO
ALTER TABLE [dbo].[EventFeedback] WITH NOCHECK
    ADD CONSTRAINT [FK_Feedback_GuestRegistration] FOREIGN KEY ([guestRegistrationID]) REFERENCES [dbo].[GuestEventRegistration] ([guestRegistrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Feedback_Event]...';


GO
ALTER TABLE [dbo].[EventFeedback] WITH NOCHECK
    ADD CONSTRAINT [FK_Feedback_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Feedback_Registration]...';


GO
ALTER TABLE [dbo].[EventFeedback] WITH NOCHECK
    ADD CONSTRAINT [FK_Feedback_Registration] FOREIGN KEY ([registrationID]) REFERENCES [dbo].[EventRegistration] ([registrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_FeedbackInvitation_Registration]...';


GO
ALTER TABLE [dbo].[EventFeedbackInvitation] WITH NOCHECK
    ADD CONSTRAINT [FK_FeedbackInvitation_Registration] FOREIGN KEY ([registrationID]) REFERENCES [dbo].[EventRegistration] ([registrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_FeedbackInvitation_GuestRegistration]...';


GO
ALTER TABLE [dbo].[EventFeedbackInvitation] WITH NOCHECK
    ADD CONSTRAINT [FK_FeedbackInvitation_GuestRegistration] FOREIGN KEY ([guestRegistrationID]) REFERENCES [dbo].[GuestEventRegistration] ([guestRegistrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_FeedbackInvitation_Event]...';


GO
ALTER TABLE [dbo].[EventFeedbackInvitation] WITH NOCHECK
    ADD CONSTRAINT [FK_FeedbackInvitation_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Registration_Event]...';


GO
ALTER TABLE [dbo].[EventRegistration] WITH NOCHECK
    ADD CONSTRAINT [FK_Registration_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Registration_User]...';


GO
ALTER TABLE [dbo].[EventRegistration] WITH NOCHECK
    ADD CONSTRAINT [FK_Registration_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventRegistrationPolicy_Event]...';


GO
ALTER TABLE [dbo].[EventRegistrationPolicy] WITH NOCHECK
    ADD CONSTRAINT [FK_EventRegistrationPolicy_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventReport_ApprovedBy]...';


GO
ALTER TABLE [dbo].[EventReport] WITH NOCHECK
    ADD CONSTRAINT [FK_EventReport_ApprovedBy] FOREIGN KEY ([approvedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventReport_User]...';


GO
ALTER TABLE [dbo].[EventReport] WITH NOCHECK
    ADD CONSTRAINT [FK_EventReport_User] FOREIGN KEY ([uploadedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventReport_Event]...';


GO
ALTER TABLE [dbo].[EventReport] WITH NOCHECK
    ADD CONSTRAINT [FK_EventReport_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventReport_RejectedBy]...';


GO
ALTER TABLE [dbo].[EventReport] WITH NOCHECK
    ADD CONSTRAINT [FK_EventReport_RejectedBy] FOREIGN KEY ([rejectedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_EventReportReminderLog_Event]...';


GO
ALTER TABLE [dbo].[EventReportReminderLog] WITH NOCHECK
    ADD CONSTRAINT [FK_EventReportReminderLog_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_GuestRegistration_Event]...';


GO
ALTER TABLE [dbo].[GuestEventRegistration] WITH NOCHECK
    ADD CONSTRAINT [FK_GuestRegistration_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_GuestOtp_GuestRegistration]...';


GO
ALTER TABLE [dbo].[GuestVerificationOtp] WITH NOCHECK
    ADD CONSTRAINT [FK_GuestOtp_GuestRegistration] FOREIGN KEY ([guestRegistrationID]) REFERENCES [dbo].[GuestEventRegistration] ([guestRegistrationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Interviewer_Account]...';


GO
ALTER TABLE [dbo].[InterviewerAssignment] WITH NOCHECK
    ADD CONSTRAINT [FK_Interviewer_Account] FOREIGN KEY ([interviewerID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Interviewer_Schedule]...';


GO
ALTER TABLE [dbo].[InterviewerAssignment] WITH NOCHECK
    ADD CONSTRAINT [FK_Interviewer_Schedule] FOREIGN KEY ([interviewID]) REFERENCES [dbo].[InterviewSchedule] ([interviewID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Interview_Recruit]...';


GO
ALTER TABLE [dbo].[InterviewSchedule] WITH NOCHECK
    ADD CONSTRAINT [FK_Interview_Recruit] FOREIGN KEY ([applicationID]) REFERENCES [dbo].[RecruitmentApplication] ([applicationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Archive_Club]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive] WITH NOCHECK
    ADD CONSTRAINT [FK_Archive_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Archive_User]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive] WITH NOCHECK
    ADD CONSTRAINT [FK_Archive_User] FOREIGN KEY ([uploadedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_KnowledgeChunk_Archive]...';


GO
ALTER TABLE [dbo].[KnowledgeChunk] WITH NOCHECK
    ADD CONSTRAINT [FK_KnowledgeChunk_Archive] FOREIGN KEY ([archiveID]) REFERENCES [dbo].[KnowledgeArchive] ([archiveID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Perf_Club]...';


GO
ALTER TABLE [dbo].[MemberPerformance] WITH NOCHECK
    ADD CONSTRAINT [FK_Perf_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Perf_Event]...';


GO
ALTER TABLE [dbo].[MemberPerformance] WITH NOCHECK
    ADD CONSTRAINT [FK_Perf_Event] FOREIGN KEY ([eventID]) REFERENCES [dbo].[Event] ([eventID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Perf_User]...';


GO
ALTER TABLE [dbo].[MemberPerformance] WITH NOCHECK
    ADD CONSTRAINT [FK_Perf_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_MemberRankingSnapshot_Club]...';


GO
ALTER TABLE [dbo].[MemberRankingSnapshot] WITH NOCHECK
    ADD CONSTRAINT [FK_MemberRankingSnapshot_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_MemberRankingSnapshot_Semester]...';


GO
ALTER TABLE [dbo].[MemberRankingSnapshot] WITH NOCHECK
    ADD CONSTRAINT [FK_MemberRankingSnapshot_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_MemberRankingSnapshot_FinalizedBy]...';


GO
ALTER TABLE [dbo].[MemberRankingSnapshot] WITH NOCHECK
    ADD CONSTRAINT [FK_MemberRankingSnapshot_FinalizedBy] FOREIGN KEY ([finalizedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_MemberRankingSnapshot_User]...';


GO
ALTER TABLE [dbo].[MemberRankingSnapshot] WITH NOCHECK
    ADD CONSTRAINT [FK_MemberRankingSnapshot_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Recruit_Semester]...';


GO
ALTER TABLE [dbo].[RecruitmentApplication] WITH NOCHECK
    ADD CONSTRAINT [FK_Recruit_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Recruit_User]...';


GO
ALTER TABLE [dbo].[RecruitmentApplication] WITH NOCHECK
    ADD CONSTRAINT [FK_Recruit_User] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Recruit_Club]...';


GO
ALTER TABLE [dbo].[RecruitmentApplication] WITH NOCHECK
    ADD CONSTRAINT [FK_Recruit_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_RecruitmentCycle_Club]...';


GO
ALTER TABLE [dbo].[RecruitmentCycle] WITH NOCHECK
    ADD CONSTRAINT [FK_RecruitmentCycle_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_RecruitmentCycle_Parent]...';


GO
ALTER TABLE [dbo].[RecruitmentCycle] WITH NOCHECK
    ADD CONSTRAINT [FK_RecruitmentCycle_Parent] FOREIGN KEY ([parentCycleID]) REFERENCES [dbo].[RecruitmentCycle] ([cycleID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_RecruitmentCycle_Semester]...';


GO
ALTER TABLE [dbo].[RecruitmentCycle] WITH NOCHECK
    ADD CONSTRAINT [FK_RecruitmentCycle_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_RecruitmentReminder_Cycle]...';


GO
ALTER TABLE [dbo].[RecruitmentReminder] WITH NOCHECK
    ADD CONSTRAINT [FK_RecruitmentReminder_Cycle] FOREIGN KEY ([cycleID]) REFERENCES [dbo].[RecruitmentCycle] ([cycleID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Config_User]...';


GO
ALTER TABLE [dbo].[SystemConfig] WITH NOCHECK
    ADD CONSTRAINT [FK_Config_User] FOREIGN KEY ([updatedBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_tblNotificationRecipients_Notification]...';


GO
ALTER TABLE [dbo].[tblNotificationRecipients] WITH NOCHECK
    ADD CONSTRAINT [FK_tblNotificationRecipients_Notification] FOREIGN KEY ([notificationID]) REFERENCES [dbo].[tblNotifications] ([notificationID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_tblNotificationRecipients_UserAccount]...';


GO
ALTER TABLE [dbo].[tblNotificationRecipients] WITH NOCHECK
    ADD CONSTRAINT [FK_tblNotificationRecipients_UserAccount] FOREIGN KEY ([userID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_tblNotifications_Club]...';


GO
ALTER TABLE [dbo].[tblNotifications] WITH NOCHECK
    ADD CONSTRAINT [FK_tblNotifications_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_tblNotifications_UserAccount]...';


GO
ALTER TABLE [dbo].[tblNotifications] WITH NOCHECK
    ADD CONSTRAINT [FK_tblNotifications_UserAccount] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_User_SystemRole]...';


GO
ALTER TABLE [dbo].[UserAccount] WITH NOCHECK
    ADD CONSTRAINT [FK_User_SystemRole] FOREIGN KEY ([roleID]) REFERENCES [dbo].[SystemRole] ([roleID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Withdraw_Club]...';


GO
ALTER TABLE [dbo].[WithdrawLog] WITH NOCHECK
    ADD CONSTRAINT [FK_Withdraw_Club] FOREIGN KEY ([clubID]) REFERENCES [dbo].[Club] ([clubID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Withdraw_Semester]...';


GO
ALTER TABLE [dbo].[WithdrawLog] WITH NOCHECK
    ADD CONSTRAINT [FK_Withdraw_Semester] FOREIGN KEY ([semesterID]) REFERENCES [dbo].[Semester] ([semesterID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Withdraw_User]...';


GO
ALTER TABLE [dbo].[WithdrawLog] WITH NOCHECK
    ADD CONSTRAINT [FK_Withdraw_User] FOREIGN KEY ([studentID]) REFERENCES [dbo].[UserAccount] ([userID]);


GO
PRINT N'Creating Foreign Key [dbo].[FK_Withdraw_Application]...';


GO
ALTER TABLE [dbo].[WithdrawLog] WITH NOCHECK
    ADD CONSTRAINT [FK_Withdraw_Application] FOREIGN KEY ([applicationID]) REFERENCES [dbo].[RecruitmentApplication] ([applicationID]);


GO
PRINT N'Creating Check Constraint [dbo].[CK_AIChatAuditLog_Status]...';


GO
ALTER TABLE [dbo].[AIChatAuditLog] WITH NOCHECK
    ADD CONSTRAINT [CK_AIChatAuditLog_Status] CHECK ([status]='Fallback' OR [status]='Success');


GO
PRINT N'Creating Check Constraint [dbo].[CK_Whitelist_Email]...';


GO
ALTER TABLE [dbo].[AllowedEmailWhitelist] WITH NOCHECK
    ADD CONSTRAINT [CK_Whitelist_Email] CHECK (NOT [email] like '%@fpt.edu.vn' AND NOT [email] like '%@fe.edu.vn');


GO
PRINT N'Creating Check Constraint [dbo].[CK_ClubKPI_Score]...';


GO
ALTER TABLE [dbo].[ClubKPI] WITH NOCHECK
    ADD CONSTRAINT [CK_ClubKPI_Score] CHECK ([kpiScore]>=(0));


GO
PRINT N'Creating Check Constraint [dbo].[CK_Discipline_Status]...';


GO
ALTER TABLE [dbo].[DisciplineLog] WITH NOCHECK
    ADD CONSTRAINT [CK_Discipline_Status] CHECK ([disciplineStatus]='Expired' OR [disciplineStatus]='Active');


GO
PRINT N'Creating Check Constraint [dbo].[CK_EventStatus]...';


GO
ALTER TABLE [dbo].[Event] WITH NOCHECK
    ADD CONSTRAINT [CK_EventStatus] CHECK ([eventStatus]='CONTRIBUTIONFINALIZED' OR [eventStatus]='CONTRIBUTION_FINALIZED' OR [eventStatus]='CONTRIBUTIONSCORING' OR [eventStatus]='CONTRIBUTION_SCORING' OR [eventStatus]='CONTRIBUTIONAPPROVED' OR [eventStatus]='CONTRIBUTION_APPROVED' OR [eventStatus]='CONTRIBUTIONPENDINGAPPROVAL' OR [eventStatus]='CONTRIBUTION_PENDING_APPROVAL' OR [eventStatus]='CONTRIBUTIONDRAFT' OR [eventStatus]='CONTRIBUTION_DRAFT' OR [eventStatus]='CHECKINOPEN' OR [eventStatus]='CHECKIN_OPEN' OR [eventStatus]='CONTRIBUTIONCALCULATED' OR [eventStatus]='CONTRIBUTION_CALCULATED' OR [eventStatus]='REPORTREJECTED' OR [eventStatus]='REPORT_REJECTED' OR [eventStatus]='REPORTAPPROVED' OR [eventStatus]='REPORT_APPROVED' OR [eventStatus]='REPORTPENDINGAPPROVAL' OR [eventStatus]='REPORT_PENDING_APPROVAL' OR [eventStatus]='REPORTUPLOADED' OR [eventStatus]='REPORT_UPLOADED' OR [eventStatus]='REPORTED' OR [eventStatus]='CLOSED' OR [eventStatus]='COMPLETED' OR [eventStatus]='ONGOING' OR [eventStatus]='REGISTRATIONCLOSED' OR [eventStatus]='REGISTRATION_CLOSED' OR [eventStatus]='REGISTRATIONOPEN' OR [eventStatus]='REGISTRATION_OPEN' OR [eventStatus]='UPCOMING' OR [eventStatus]='CANCELED' OR [eventStatus]='CANCELLED' OR [eventStatus]='WITHDRAWN' OR [eventStatus]='REJECTED' OR [eventStatus]='APPROVED' OR [eventStatus]='PENDINGAPPROVAL' OR [eventStatus]='PENDING_APPROVAL' OR [eventStatus]='PENDING' OR [eventStatus]='DRAFT' OR [eventStatus]='ContributionFinalized' OR [eventStatus]='ContributionScoring' OR [eventStatus]='ContributionApproved' OR [eventStatus]='ContributionPendingApproval' OR [eventStatus]='ContributionDraft' OR [eventStatus]='ContributionCalculated' OR [eventStatus]='ReportRejected' OR [eventStatus]='ReportApproved' OR [eventStatus]='ReportPendingApproval' OR [eventStatus]='ReportUploaded' OR [eventStatus]='Reported' OR [eventStatus]='Closed' OR [eventStatus]='Completed' OR [eventStatus]='Ongoing' OR [eventStatus]='RegistrationClosed' OR [eventStatus]='RegistrationOpen' OR [eventStatus]='Upcoming' OR [eventStatus]='Canceled' OR [eventStatus]='Cancelled' OR [eventStatus]='Withdrawn' OR [eventStatus]='Rejected' OR [eventStatus]='Approved' OR [eventStatus]='PendingApproval' OR [eventStatus]='Pending' OR [eventStatus]='Draft');


GO
PRINT N'Creating Check Constraint [dbo].[CK_Event_Budget]...';


GO
ALTER TABLE [dbo].[Event] WITH NOCHECK
    ADD CONSTRAINT [CK_Event_Budget] CHECK ([budget]>=(0));


GO
PRINT N'Creating Check Constraint [dbo].[CK_Event_Duration]...';


GO
ALTER TABLE [dbo].[Event] WITH NOCHECK
    ADD CONSTRAINT [CK_Event_Duration] CHECK ([endDate]>=[startDate]);


GO
PRINT N'Creating Check Constraint [dbo].[CK_EventRegistration_PaymentStatus]...';


GO
ALTER TABLE [dbo].[EventRegistration] WITH NOCHECK
    ADD CONSTRAINT [CK_EventRegistration_PaymentStatus] CHECK ([paymentStatus]='REFUNDED' OR [paymentStatus]='REFUND_PENDING' OR [paymentStatus]='EXPIRED' OR [paymentStatus]='FAILED' OR [paymentStatus]='PAID' OR [paymentStatus]='AWAITING_VERIFICATION' OR [paymentStatus]='PENDING' OR [paymentStatus]='AWAITING_ELIGIBILITY' OR [paymentStatus]='NOT_REQUIRED');


GO
PRINT N'Creating Check Constraint [dbo].[CK_EventRegistration_UserChannelConsistency]...';


GO
ALTER TABLE [dbo].[EventRegistration] WITH NOCHECK
    ADD CONSTRAINT [CK_EventRegistration_UserChannelConsistency] CHECK ([registrationChannel]='FPTU' AND [userID] IS NOT NULL OR [registrationChannel]='ONLINE' AND [userID] IS NULL OR [registrationChannel]='WALK_IN');


GO
PRINT N'Creating Check Constraint [dbo].[CK_GuestEventRegistration_PaymentStatus]...';


GO
ALTER TABLE [dbo].[GuestEventRegistration] WITH NOCHECK
    ADD CONSTRAINT [CK_GuestEventRegistration_PaymentStatus] CHECK ([paymentStatus]='REFUNDED' OR [paymentStatus]='REFUND_PENDING' OR [paymentStatus]='EXPIRED' OR [paymentStatus]='FAILED' OR [paymentStatus]='PAID' OR [paymentStatus]='AWAITING_VERIFICATION' OR [paymentStatus]='PENDING' OR [paymentStatus]='AWAITING_ELIGIBILITY' OR [paymentStatus]='NOT_REQUIRED');


GO
PRINT N'Creating Check Constraint [dbo].[CK_Interview_Status]...';


GO
ALTER TABLE [dbo].[InterviewSchedule] WITH NOCHECK
    ADD CONSTRAINT [CK_Interview_Status] CHECK ([status]='Cancelled' OR [status]='Completed' OR [status]='Scheduled');


GO
PRINT N'Creating Check Constraint [dbo].[CK_Interview_Result]...';


GO
ALTER TABLE [dbo].[InterviewSchedule] WITH NOCHECK
    ADD CONSTRAINT [CK_Interview_Result] CHECK ([result]='Failed' OR [result]='Passed');


GO
PRINT N'Creating Check Constraint [dbo].[CK_KnowledgeArchive_VisibilityScope]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive] WITH NOCHECK
    ADD CONSTRAINT [CK_KnowledgeArchive_VisibilityScope] CHECK ([visibilityScope]='ClubInternal' OR [visibilityScope]='Public');


GO
PRINT N'Creating Check Constraint [dbo].[CK_KnowledgeArchive_SourceFormat]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive] WITH NOCHECK
    ADD CONSTRAINT [CK_KnowledgeArchive_SourceFormat] CHECK ([sourceFormat]='PDF' OR [sourceFormat]='TXT' OR [sourceFormat]='MD');


GO
PRINT N'Creating Check Constraint [dbo].[CK_KnowledgeArchive_IndexingStatus]...';


GO
ALTER TABLE [dbo].[KnowledgeArchive] WITH NOCHECK
    ADD CONSTRAINT [CK_KnowledgeArchive_IndexingStatus] CHECK ([indexingStatus]='Failed' OR [indexingStatus]='Success' OR [indexingStatus]='Processing' OR [indexingStatus]='Pending');


GO
PRINT N'Creating Check Constraint [dbo].[CK_Perf_FinalLimit]...';


GO
ALTER TABLE [dbo].[MemberPerformance] WITH NOCHECK
    ADD CONSTRAINT [CK_Perf_FinalLimit] CHECK ((([basePoints]+[bonusPoints])-[penaltyPoints])>=(-1000));


GO
PRINT N'Creating Check Constraint [dbo].[CK_Recruit_Status]...';


GO
ALTER TABLE [dbo].[RecruitmentApplication] WITH NOCHECK
    ADD CONSTRAINT [CK_Recruit_Status] CHECK ([status]='FAILED' OR [status]='PASSED' OR [status]='REJECTED' OR [status]='ACCEPTED' OR [status]='Withdrawn' OR [status]='Rejected' OR [status]='Approved' OR [status]='Interviewing' OR [status]='Reviewing' OR [status]='Submitted' OR [status]='Draft');


GO
PRINT N'Creating Check Constraint [dbo].[CK_Semester_Dates]...';


GO
ALTER TABLE [dbo].[Semester] WITH NOCHECK
    ADD CONSTRAINT [CK_Semester_Dates] CHECK ([endDate]>=[startDate]);


GO
PRINT N'Creating Check Constraint [dbo].[CK_VnPayPaymentIntent_Target]...';


GO
ALTER TABLE [dbo].[VnPayPaymentIntent] WITH NOCHECK
    ADD CONSTRAINT [CK_VnPayPaymentIntent_Target] CHECK ([registrationID] IS NOT NULL AND [guestRegistrationID] IS NULL OR [registrationID] IS NULL AND [guestRegistrationID] IS NOT NULL);


GO
PRINT N'Checking existing data against newly created constraints';


GO


GO
ALTER TABLE [dbo].[AIChatAuditLog] WITH CHECK CHECK CONSTRAINT [FK_AIChat_User];

ALTER TABLE [dbo].[AttendanceRecord] WITH CHECK CHECK CONSTRAINT [FK_Record_Registration];

ALTER TABLE [dbo].[AttendanceRecord] WITH CHECK CHECK CONSTRAINT [FK_Record_Session];

ALTER TABLE [dbo].[AttendanceRecord] WITH CHECK CHECK CONSTRAINT [FK_Record_User];

ALTER TABLE [dbo].[AttendanceRecord] WITH CHECK CHECK CONSTRAINT [FK_Record_GuestRegistration];

ALTER TABLE [dbo].[AttendanceSession] WITH CHECK CHECK CONSTRAINT [FK_Session_Event];

ALTER TABLE [dbo].[AuditLog] WITH CHECK CHECK CONSTRAINT [FK_Audit_Actor];

ALTER TABLE [dbo].[ClubBlacklist] WITH CHECK CHECK CONSTRAINT [FK_Blacklist_User];

ALTER TABLE [dbo].[ClubBlacklist] WITH CHECK CHECK CONSTRAINT [FK_Blacklist_Club];

ALTER TABLE [dbo].[ClubEvaluation] WITH CHECK CHECK CONSTRAINT [FK_ClubEvaluation_Semester];

ALTER TABLE [dbo].[ClubEvaluation] WITH CHECK CHECK CONSTRAINT [FK_ClubEvaluation_EvaluatedBy];

ALTER TABLE [dbo].[ClubEvaluation] WITH CHECK CHECK CONSTRAINT [FK_ClubEvaluation_Club];

ALTER TABLE [dbo].[ClubKPI] WITH CHECK CHECK CONSTRAINT [FK_ClubKPI_Semester];

ALTER TABLE [dbo].[ClubKPI] WITH CHECK CHECK CONSTRAINT [FK_ClubKPI_Club];

ALTER TABLE [dbo].[ClubMembership] WITH CHECK CHECK CONSTRAINT [FK_Membership_Semester];

ALTER TABLE [dbo].[ClubMembership] WITH CHECK CHECK CONSTRAINT [FK_Membership_Club];

ALTER TABLE [dbo].[ClubMembership] WITH CHECK CHECK CONSTRAINT [FK_Membership_User];

ALTER TABLE [dbo].[ClubMembership] WITH CHECK CHECK CONSTRAINT [FK_Membership_ClubRole];

ALTER TABLE [dbo].[ClubRegistration] WITH CHECK CHECK CONSTRAINT [FK_ClubRegistration_User];

ALTER TABLE [dbo].[ClubRegistrationMember] WITH CHECK CHECK CONSTRAINT [FK_RegMember_Registration];

ALTER TABLE [dbo].[Competition] WITH CHECK CHECK CONSTRAINT [FK_Competition_Semester];

ALTER TABLE [dbo].[Competition] WITH CHECK CHECK CONSTRAINT [FK_Competition_Club];

ALTER TABLE [dbo].[competition_award] WITH CHECK CHECK CONSTRAINT [FK_CompetitionAward_Competition];

ALTER TABLE [dbo].[competition_penalty] WITH CHECK CHECK CONSTRAINT [FK_CompetitionPenalty_Competition];

ALTER TABLE [dbo].[competition_penalty] WITH CHECK CHECK CONSTRAINT [FK_CompetitionPenalty_User];

ALTER TABLE [dbo].[CompetitionScore] WITH CHECK CHECK CONSTRAINT [FK_CompetitionScore_User];

ALTER TABLE [dbo].[CompetitionScore] WITH CHECK CHECK CONSTRAINT [FK_CompetitionScore_Competition];

ALTER TABLE [dbo].[ContributionAppeal] WITH CHECK CHECK CONSTRAINT [FK_ContributionAppeal_Batch];

ALTER TABLE [dbo].[ContributionAppeal] WITH CHECK CHECK CONSTRAINT [FK_ContributionAppeal_Event];

ALTER TABLE [dbo].[ContributionAppeal] WITH CHECK CHECK CONSTRAINT [FK_ContributionAppeal_Contribution];

ALTER TABLE [dbo].[ContributionAppeal] WITH CHECK CHECK CONSTRAINT [FK_ContributionAppeal_User];

ALTER TABLE [dbo].[DisciplineLog] WITH CHECK CHECK CONSTRAINT [FK_Discipline_Semester];

ALTER TABLE [dbo].[DisciplineLog] WITH CHECK CHECK CONSTRAINT [FK_Discipline_User];

ALTER TABLE [dbo].[Event] WITH CHECK CHECK CONSTRAINT [FK_Event_Semester];

ALTER TABLE [dbo].[Event] WITH CHECK CHECK CONSTRAINT [FK_Event_ApprovedBy];

ALTER TABLE [dbo].[Event] WITH CHECK CHECK CONSTRAINT [FK_Event_Club];

ALTER TABLE [dbo].[EventAssignment] WITH CHECK CHECK CONSTRAINT [FK_Assign_Event];

ALTER TABLE [dbo].[EventAssignment] WITH CHECK CHECK CONSTRAINT [FK_Assign_EventRole];

ALTER TABLE [dbo].[EventAssignment] WITH CHECK CHECK CONSTRAINT [FK_Assign_User];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_User];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_Club];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_Assignment];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_ClubRole];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_Attendance];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_Event];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_Membership];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_Registration];

ALTER TABLE [dbo].[EventContribution] WITH CHECK CHECK CONSTRAINT [FK_EventContribution_Batch];

ALTER TABLE [dbo].[EventFeedback] WITH CHECK CHECK CONSTRAINT [FK_Feedback_GuestRegistration];

ALTER TABLE [dbo].[EventFeedback] WITH CHECK CHECK CONSTRAINT [FK_Feedback_Event];

ALTER TABLE [dbo].[EventFeedback] WITH CHECK CHECK CONSTRAINT [FK_Feedback_Registration];

ALTER TABLE [dbo].[EventFeedbackInvitation] WITH CHECK CHECK CONSTRAINT [FK_FeedbackInvitation_Registration];

ALTER TABLE [dbo].[EventFeedbackInvitation] WITH CHECK CHECK CONSTRAINT [FK_FeedbackInvitation_GuestRegistration];

ALTER TABLE [dbo].[EventFeedbackInvitation] WITH CHECK CHECK CONSTRAINT [FK_FeedbackInvitation_Event];

ALTER TABLE [dbo].[EventRegistration] WITH CHECK CHECK CONSTRAINT [FK_Registration_Event];

ALTER TABLE [dbo].[EventRegistration] WITH CHECK CHECK CONSTRAINT [FK_Registration_User];

ALTER TABLE [dbo].[EventRegistrationPolicy] WITH CHECK CHECK CONSTRAINT [FK_EventRegistrationPolicy_Event];

ALTER TABLE [dbo].[EventReport] WITH CHECK CHECK CONSTRAINT [FK_EventReport_ApprovedBy];

ALTER TABLE [dbo].[EventReport] WITH CHECK CHECK CONSTRAINT [FK_EventReport_User];

ALTER TABLE [dbo].[EventReport] WITH CHECK CHECK CONSTRAINT [FK_EventReport_Event];

ALTER TABLE [dbo].[EventReport] WITH CHECK CHECK CONSTRAINT [FK_EventReport_RejectedBy];

ALTER TABLE [dbo].[EventReportReminderLog] WITH CHECK CHECK CONSTRAINT [FK_EventReportReminderLog_Event];

ALTER TABLE [dbo].[GuestEventRegistration] WITH CHECK CHECK CONSTRAINT [FK_GuestRegistration_Event];

ALTER TABLE [dbo].[GuestVerificationOtp] WITH CHECK CHECK CONSTRAINT [FK_GuestOtp_GuestRegistration];

ALTER TABLE [dbo].[InterviewerAssignment] WITH CHECK CHECK CONSTRAINT [FK_Interviewer_Account];

ALTER TABLE [dbo].[InterviewerAssignment] WITH CHECK CHECK CONSTRAINT [FK_Interviewer_Schedule];

ALTER TABLE [dbo].[InterviewSchedule] WITH CHECK CHECK CONSTRAINT [FK_Interview_Recruit];

ALTER TABLE [dbo].[KnowledgeArchive] WITH CHECK CHECK CONSTRAINT [FK_Archive_Club];

ALTER TABLE [dbo].[KnowledgeArchive] WITH CHECK CHECK CONSTRAINT [FK_Archive_User];

ALTER TABLE [dbo].[KnowledgeChunk] WITH CHECK CHECK CONSTRAINT [FK_KnowledgeChunk_Archive];

ALTER TABLE [dbo].[MemberPerformance] WITH CHECK CHECK CONSTRAINT [FK_Perf_Club];

ALTER TABLE [dbo].[MemberPerformance] WITH CHECK CHECK CONSTRAINT [FK_Perf_Event];

ALTER TABLE [dbo].[MemberPerformance] WITH CHECK CHECK CONSTRAINT [FK_Perf_User];

ALTER TABLE [dbo].[MemberRankingSnapshot] WITH CHECK CHECK CONSTRAINT [FK_MemberRankingSnapshot_Club];

ALTER TABLE [dbo].[MemberRankingSnapshot] WITH CHECK CHECK CONSTRAINT [FK_MemberRankingSnapshot_Semester];

ALTER TABLE [dbo].[MemberRankingSnapshot] WITH CHECK CHECK CONSTRAINT [FK_MemberRankingSnapshot_FinalizedBy];

ALTER TABLE [dbo].[MemberRankingSnapshot] WITH CHECK CHECK CONSTRAINT [FK_MemberRankingSnapshot_User];

ALTER TABLE [dbo].[RecruitmentApplication] WITH CHECK CHECK CONSTRAINT [FK_Recruit_Semester];

ALTER TABLE [dbo].[RecruitmentApplication] WITH CHECK CHECK CONSTRAINT [FK_Recruit_User];

ALTER TABLE [dbo].[RecruitmentApplication] WITH CHECK CHECK CONSTRAINT [FK_Recruit_Club];

ALTER TABLE [dbo].[RecruitmentCycle] WITH CHECK CHECK CONSTRAINT [FK_RecruitmentCycle_Club];

ALTER TABLE [dbo].[RecruitmentCycle] WITH CHECK CHECK CONSTRAINT [FK_RecruitmentCycle_Parent];

ALTER TABLE [dbo].[RecruitmentCycle] WITH CHECK CHECK CONSTRAINT [FK_RecruitmentCycle_Semester];

ALTER TABLE [dbo].[RecruitmentReminder] WITH CHECK CHECK CONSTRAINT [FK_RecruitmentReminder_Cycle];

ALTER TABLE [dbo].[SystemConfig] WITH CHECK CHECK CONSTRAINT [FK_Config_User];

ALTER TABLE [dbo].[tblNotificationRecipients] WITH CHECK CHECK CONSTRAINT [FK_tblNotificationRecipients_Notification];

ALTER TABLE [dbo].[tblNotificationRecipients] WITH CHECK CHECK CONSTRAINT [FK_tblNotificationRecipients_UserAccount];

ALTER TABLE [dbo].[tblNotifications] WITH CHECK CHECK CONSTRAINT [FK_tblNotifications_Club];

ALTER TABLE [dbo].[tblNotifications] WITH CHECK CHECK CONSTRAINT [FK_tblNotifications_UserAccount];

ALTER TABLE [dbo].[UserAccount] WITH CHECK CHECK CONSTRAINT [FK_User_SystemRole];

ALTER TABLE [dbo].[WithdrawLog] WITH CHECK CHECK CONSTRAINT [FK_Withdraw_Club];

ALTER TABLE [dbo].[WithdrawLog] WITH CHECK CHECK CONSTRAINT [FK_Withdraw_Semester];

ALTER TABLE [dbo].[WithdrawLog] WITH CHECK CHECK CONSTRAINT [FK_Withdraw_User];

ALTER TABLE [dbo].[WithdrawLog] WITH CHECK CHECK CONSTRAINT [FK_Withdraw_Application];

ALTER TABLE [dbo].[AIChatAuditLog] WITH CHECK CHECK CONSTRAINT [CK_AIChatAuditLog_Status];

ALTER TABLE [dbo].[AllowedEmailWhitelist] WITH CHECK CHECK CONSTRAINT [CK_Whitelist_Email];

ALTER TABLE [dbo].[ClubKPI] WITH CHECK CHECK CONSTRAINT [CK_ClubKPI_Score];

ALTER TABLE [dbo].[DisciplineLog] WITH CHECK CHECK CONSTRAINT [CK_Discipline_Status];

ALTER TABLE [dbo].[Event] WITH CHECK CHECK CONSTRAINT [CK_EventStatus];

ALTER TABLE [dbo].[Event] WITH CHECK CHECK CONSTRAINT [CK_Event_Budget];

ALTER TABLE [dbo].[Event] WITH CHECK CHECK CONSTRAINT [CK_Event_Duration];

ALTER TABLE [dbo].[EventRegistration] WITH CHECK CHECK CONSTRAINT [CK_EventRegistration_PaymentStatus];

ALTER TABLE [dbo].[EventRegistration] WITH CHECK CHECK CONSTRAINT [CK_EventRegistration_UserChannelConsistency];

ALTER TABLE [dbo].[GuestEventRegistration] WITH CHECK CHECK CONSTRAINT [CK_GuestEventRegistration_PaymentStatus];

ALTER TABLE [dbo].[InterviewSchedule] WITH CHECK CHECK CONSTRAINT [CK_Interview_Status];

ALTER TABLE [dbo].[InterviewSchedule] WITH CHECK CHECK CONSTRAINT [CK_Interview_Result];

ALTER TABLE [dbo].[KnowledgeArchive] WITH CHECK CHECK CONSTRAINT [CK_KnowledgeArchive_VisibilityScope];

ALTER TABLE [dbo].[KnowledgeArchive] WITH CHECK CHECK CONSTRAINT [CK_KnowledgeArchive_SourceFormat];

ALTER TABLE [dbo].[KnowledgeArchive] WITH CHECK CHECK CONSTRAINT [CK_KnowledgeArchive_IndexingStatus];

ALTER TABLE [dbo].[MemberPerformance] WITH CHECK CHECK CONSTRAINT [CK_Perf_FinalLimit];

ALTER TABLE [dbo].[RecruitmentApplication] WITH CHECK CHECK CONSTRAINT [CK_Recruit_Status];

ALTER TABLE [dbo].[Semester] WITH CHECK CHECK CONSTRAINT [CK_Semester_Dates];

ALTER TABLE [dbo].[VnPayPaymentIntent] WITH CHECK CHECK CONSTRAINT [CK_VnPayPaymentIntent_Target];


GO


GO
