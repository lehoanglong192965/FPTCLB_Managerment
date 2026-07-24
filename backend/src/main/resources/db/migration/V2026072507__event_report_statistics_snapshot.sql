IF COL_LENGTH('dbo.EventReport', 'snapshotGeneratedAt') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotGeneratedAt DATETIME2 NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotTotalRegistrations') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotTotalRegistrations BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotConfirmedRegistrations') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotConfirmedRegistrations BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotCancelledRegistrations') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotCancelledRegistrations BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotFptuRegistrations') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotFptuRegistrations BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotGuestRegistrations') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotGuestRegistrations BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotPendingPaymentCount') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotPendingPaymentCount BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotPaidTicketCount') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotPaidTicketCount BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotRevenue') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotRevenue DECIMAL(19,2) NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotCurrency') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotCurrency VARCHAR(3) NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotAttendanceSessionCount') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotAttendanceSessionCount INT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotPresentParticipants') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotPresentParticipants BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotAbsentParticipants') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotAbsentParticipants BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotWalkInParticipants') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotWalkInParticipants BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotAttendanceRate') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotAttendanceRate DECIMAL(7,2) NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotFeedbackCount') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotFeedbackCount BIGINT NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotAverageRating') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotAverageRating DECIMAL(4,2) NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotFeedbackResponseRate') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotFeedbackResponseRate DECIMAL(7,2) NULL;
IF COL_LENGTH('dbo.EventReport', 'snapshotPlannedBudget') IS NULL
    ALTER TABLE dbo.EventReport ADD snapshotPlannedBudget DECIMAL(19,2) NULL;
