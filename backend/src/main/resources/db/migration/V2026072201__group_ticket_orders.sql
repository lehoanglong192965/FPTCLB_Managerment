IF OBJECT_ID('dbo.EventRegistration', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.EventRegistration', 'purchaserUserID') IS NULL
        ALTER TABLE dbo.EventRegistration ADD purchaserUserID INT NULL;

    IF COL_LENGTH('dbo.EventRegistration', 'ticketOrderCode') IS NULL
        ALTER TABLE dbo.EventRegistration ADD ticketOrderCode VARCHAR(64) NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_EventRegistration_Purchaser_Order'
          AND object_id = OBJECT_ID('dbo.EventRegistration')
    )
        CREATE INDEX IX_EventRegistration_Purchaser_Order
            ON dbo.EventRegistration(purchaserUserID, ticketOrderCode, eventID);

    EXEC sys.sp_executesql N'
        UPDATE dbo.EventRegistration
           SET purchaserUserID = userID,
               ticketOrderCode = COALESCE(ticketOrderCode, ''LEGACY-'' + CONVERT(VARCHAR(20), registrationID))
         WHERE isDeleted = 0
           AND userID IS NOT NULL
           AND purchaserUserID IS NULL;';

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
