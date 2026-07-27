-- Repair confirmed member tickets created without a QR code. Only free or
-- successfully paid active registrations are eligible for a check-in ticket.
UPDATE registration
SET registration.ticketCode = CONVERT(VARCHAR(36), NEWID()),
    registration.ticketIssuedAt = COALESCE(registration.ticketIssuedAt, GETDATE()),
    registration.ticketRevokedAt = NULL
FROM dbo.EventRegistration registration
INNER JOIN dbo.Event event ON event.eventID = registration.eventID
WHERE ISNULL(registration.isDeleted, 0) = 0
  AND COALESCE(registration.registrationStatus, registration.status) IN ('CONFIRMED', 'REGISTERED')
  AND (registration.ticketCode IS NULL OR LTRIM(RTRIM(registration.ticketCode)) = '')
  AND registration.ticketRevokedAt IS NULL
  AND COALESCE(event.eventStatus, '') NOT IN ('CANCELLED', 'REJECTED')
  AND (
      registration.paymentStatus IN ('NOT_REQUIRED', 'PAID')
      OR (registration.paymentStatus IS NULL AND ISNULL(event.isPaidEvent, 0) = 0)
  );

