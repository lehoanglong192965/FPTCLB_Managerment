IF OBJECT_ID('dbo.EventRegistration', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.EventRegistration', 'capacityExempt') IS NULL
BEGIN
    ALTER TABLE dbo.EventRegistration
        ADD capacityExempt BIT NOT NULL
            CONSTRAINT DF_EventRegistration_CapacityExempt DEFAULT 0;
END;

/* Existing active tickets of the host club board must not consume public seats. */
IF COL_LENGTH('dbo.EventRegistration', 'capacityExempt') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
    UPDATE registration
       SET registration.capacityExempt = 1,
           registration.paymentStatus = ''NOT_REQUIRED'',
           registration.amountDue = 0,
           registration.paymentExpiresAt = NULL
    FROM dbo.EventRegistration registration
    JOIN dbo.Event event ON event.eventID = registration.eventID
    JOIN dbo.ClubMembership membership
      ON membership.clubID = event.clubID
     AND membership.semesterID = event.semesterID
     AND membership.userID = registration.userID
     AND membership.clubRoleID IN (1, 2)
     AND membership.isDeleted = 0
    WHERE registration.isDeleted = 0
      AND registration.registrationStatus IN (''CONFIRMED'', ''REGISTERED'', ''WAITLISTED'', ''PENDING_APPROVAL'');';
END;
