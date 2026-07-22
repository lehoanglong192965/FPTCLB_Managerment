IF OBJECT_ID('dbo.EventRegistration', 'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_EventRegistration_UserChannelConsistency'
          AND parent_object_id = OBJECT_ID('dbo.EventRegistration')
    )
        ALTER TABLE dbo.EventRegistration DROP CONSTRAINT CK_EventRegistration_UserChannelConsistency;

    ALTER TABLE dbo.EventRegistration ADD CONSTRAINT CK_EventRegistration_UserChannelConsistency
        CHECK (
            (registrationChannel = 'FPTU' AND userID IS NOT NULL)
            OR (registrationChannel = 'ONLINE' AND userID IS NULL)
            OR (registrationChannel = 'WALK_IN')
        );
END;
