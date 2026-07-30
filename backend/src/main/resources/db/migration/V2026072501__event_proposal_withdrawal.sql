ALTER TABLE dbo.Event ADD
    withdrawalReason NVARCHAR(MAX) NULL,
    withdrawnBy INT NULL,
    withdrawnAt DATETIME2 NULL;

DECLARE @constraintName SYSNAME;
DECLARE @sql NVARCHAR(MAX);

SELECT TOP (1) @constraintName = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.Event')
  AND cc.definition LIKE N'%eventStatus%';

IF @constraintName IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE dbo.Event DROP CONSTRAINT ' + QUOTENAME(@constraintName) + N';';
    EXEC sp_executesql @sql;
END;

ALTER TABLE dbo.Event WITH CHECK ADD CONSTRAINT CK_EventStatus CHECK (
    eventStatus IN (
        'Draft', 'Pending', 'PendingApproval', 'Approved', 'Rejected', 'Withdrawn', 'Cancelled', 'Canceled',
        'Upcoming', 'RegistrationOpen', 'RegistrationClosed', 'Ongoing', 'Completed', 'Closed',
        'Reported', 'ReportUploaded', 'ReportPendingApproval', 'ReportApproved', 'ReportRejected',
        'ContributionCalculated', 'ContributionDraft', 'ContributionPendingApproval',
        'ContributionApproved', 'ContributionScoring', 'ContributionFinalized',
        'DRAFT', 'PENDING', 'PENDING_APPROVAL', 'PENDINGAPPROVAL', 'APPROVED', 'REJECTED', 'WITHDRAWN',
        'CANCELLED', 'CANCELED', 'UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATIONOPEN',
        'REGISTRATION_CLOSED', 'REGISTRATIONCLOSED', 'ONGOING', 'COMPLETED', 'CLOSED',
        'REPORTED', 'REPORT_UPLOADED', 'REPORTUPLOADED', 'REPORT_PENDING_APPROVAL',
        'REPORTPENDINGAPPROVAL', 'REPORT_APPROVED', 'REPORTAPPROVED', 'REPORT_REJECTED',
        'REPORTREJECTED', 'CONTRIBUTION_CALCULATED', 'CONTRIBUTIONCALCULATED',
        'CHECKIN_OPEN', 'CHECKINOPEN', 'CONTRIBUTION_DRAFT', 'CONTRIBUTIONDRAFT',
        'CONTRIBUTION_PENDING_APPROVAL', 'CONTRIBUTIONPENDINGAPPROVAL',
        'CONTRIBUTION_APPROVED', 'CONTRIBUTIONAPPROVED', 'CONTRIBUTION_SCORING',
        'CONTRIBUTIONSCORING', 'CONTRIBUTION_FINALIZED', 'CONTRIBUTIONFINALIZED'
    )
);
