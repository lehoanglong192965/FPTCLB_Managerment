/*
 * Every active event assignment is an organizer, not a public participant.
 * Backfill current data so assigned members receive a free QR ticket and do
 * not consume the public capacity. Application code maintains this rule for
 * future assignment changes.
 */
IF OBJECT_ID('dbo.EventRegistration', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.EventAssignment', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.EventRegistration', 'capacityExempt') IS NOT NULL
BEGIN
    UPDATE registration
       SET registration.participantType = CASE
                                               WHEN assignment.eventRoleID = 1 THEN 'CORE_TEAM'
                                               ELSE 'SUPPORT_ORGANIZER'
                                           END,
           registration.participantTypeSnapshotAt = SYSDATETIME(),
           registration.registrationStatus = 'CONFIRMED',
           registration.status = 'CONFIRMED',
           registration.registrationChannel = 'FPTU',
           registration.paymentStatus = CASE
                                            WHEN registration.paymentStatus = 'PAID' THEN 'PAID'
                                            ELSE 'NOT_REQUIRED'
                                        END,
           registration.amountDue = CASE WHEN registration.paymentStatus = 'PAID' THEN registration.amountDue ELSE 0 END,
           registration.amountPaid = CASE WHEN registration.paymentStatus = 'PAID' THEN registration.amountPaid ELSE 0 END,
           registration.paymentExpiresAt = NULL,
           registration.capacityExempt = 1,
           registration.ticketCode = COALESCE(registration.ticketCode, CONVERT(VARCHAR(36), NEWID())),
           registration.ticketIssuedAt = COALESCE(registration.ticketIssuedAt, SYSDATETIME()),
           registration.ticketRevokedAt = NULL,
           registration.cancelledAt = NULL,
           registration.isDeleted = 0,
           registration.updatedAt = SYSDATETIME()
    FROM dbo.EventRegistration registration
    JOIN dbo.EventAssignment assignment
      ON assignment.eventID = registration.eventID
     AND assignment.userID = registration.userID
     AND assignment.isDeleted = 0;

    INSERT INTO dbo.EventRegistration (
        eventID, userID, participantTypeSnapshotAt, registrationStatus,
        registrationChannel, participantType, registeredAt, status,
        ticketCode, ticketIssuedAt, paymentStatus, amountDue, amountPaid,
        paymentCurrency, paymentExpiresAt, capacityExempt,
        createdAt, createdBy, updatedAt, updatedBy, isDeleted
    )
    SELECT assignment.eventID,
           assignment.userID,
           SYSDATETIME(),
           'CONFIRMED',
           'FPTU',
           CASE WHEN assignment.eventRoleID = 1 THEN 'CORE_TEAM' ELSE 'SUPPORT_ORGANIZER' END,
           SYSDATETIME(),
           'CONFIRMED',
           CONVERT(VARCHAR(36), NEWID()),
           SYSDATETIME(),
           'NOT_REQUIRED',
           0,
           0,
           COALESCE(event.ticketCurrency, 'VND'),
           NULL,
           1,
           SYSDATETIME(),
           assignment.userID,
           SYSDATETIME(),
           assignment.userID,
           0
    FROM dbo.EventAssignment assignment
    JOIN dbo.Event event ON event.eventID = assignment.eventID AND event.isDeleted = 0
    WHERE assignment.isDeleted = 0
      AND event.eventStatus NOT IN ('DRAFT', 'PENDING', 'PENDING_APPROVAL', 'REJECTED', 'CANCELLED')
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.EventRegistration existing
          WHERE existing.eventID = assignment.eventID
            AND existing.userID = assignment.userID
      );
END;
