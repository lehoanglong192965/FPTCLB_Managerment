/* Existing unpaid registrations of the host club's Leader/ViceLeader become
 * free. Registrations already marked PAID are intentionally left untouched. */
IF OBJECT_ID('dbo.EventRegistration', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.EventRegistration', 'paymentStatus') IS NOT NULL
BEGIN
    UPDATE registration
       SET registration.paymentStatus = 'NOT_REQUIRED',
           registration.amountDue = 0,
           registration.amountPaid = 0,
           registration.paymentReference = NULL,
           registration.paymentExpiresAt = NULL,
           registration.ticketCode = CASE
               WHEN registration.registrationStatus IN ('CONFIRMED', 'REGISTERED')
                    AND NULLIF(registration.ticketCode, '') IS NULL
                   THEN CONVERT(VARCHAR(36), NEWID())
               ELSE registration.ticketCode
           END,
           registration.ticketIssuedAt = CASE
               WHEN registration.registrationStatus IN ('CONFIRMED', 'REGISTERED')
                    AND registration.ticketIssuedAt IS NULL
                   THEN GETDATE()
               ELSE registration.ticketIssuedAt
           END,
           registration.updatedAt = GETDATE()
    FROM dbo.EventRegistration registration
    JOIN dbo.Event event ON event.eventID = registration.eventID
    JOIN dbo.ClubMembership membership
      ON membership.clubID = event.clubID
     AND membership.semesterID = event.semesterID
     AND membership.userID = registration.userID
     AND membership.isDeleted = 0
    JOIN dbo.ClubRole role
      ON role.clubRoleID = membership.clubRoleID
     AND role.roleName IN ('Leader', 'ViceLeader')
     AND role.isDeleted = 0
    WHERE event.isPaidEvent = 1
      AND registration.isDeleted = 0
      AND registration.paymentStatus IN ('PENDING', 'AWAITING_ELIGIBILITY', 'EXPIRED');
END;
