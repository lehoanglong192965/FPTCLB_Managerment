# Schema Snapshot

Snapshot of the current backend-facing schema, inferred from JPA entities and repositories in `backend/src/main/java`.

## Event

- PK: `eventID`
- Columns: `clubID`, `semesterID`, `eventCode`, `eventName`, `description`, `location`, `budget`, `maxParticipants`, `totalCapacity`, `allowWalkIn`, `registrationOpenAt`, `registrationCloseAt`, `checkInOpenAt`, `checkInCloseAt`, `startDate`, `endDate`, `eventStatus`, `pdpFeedback`, `approvedBy`, `approvedAt`, `rejectionReason`, `isResubmitted`, `isInternal`, `isScoreLocked`, `createdAt`, `createdBy`, `bannerUrl`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: check constraints for non-negative capacity and registration/check-in window ordering
- Notes:
  - Status values are stored as free-form strings.
  - Existing code currently uses mixed-case values like `Draft`, `PendingApproval`, `Approved`, `RegistrationOpen`, `RegistrationClosed`, `Ongoing`, `Completed`, `Closed`, `ReportUploaded`, `ContributionCalculated`.
  - `totalCapacity` mirrors `maxParticipants` during backfill; `allowWalkIn` defaults to `false`.

## EventRegistration

- PK: `registrationID`
- Columns: `eventID`, `userID`, `participantTypeSnapshotAt`, `registrationStatus`, `registrationChannel`, `guestFullName`, `guestEmail`, `guestPhone`, `participantType`, `registeredAt`, `status`, `ticketCode`, `ticketIssuedAt`, `ticketRevokedAt`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: filtered unique indexes for active FPTU user registrations and guest-email registrations
- Notes:
  - Repository queries rely on `eventID`, `userID`, `guestEmail`, `status`, and `isDeleted`.
  - `participantType` is now stored on the row so registration lists can filter by type.
  - New registration states are tracked in `status` as `CONFIRMED`, `PENDING_APPROVAL`, `WAITLISTED`, `REJECTED`, and `CANCELLED`; legacy `REGISTERED` is still treated as confirmed for capacity counting.
  - `registrationStatus` mirrors `status`, `registrationChannel` distinguishes `FPTU`, `GUEST`, and `WALK_IN`, and `participantTypeSnapshotAt` preserves the participant classification at registration time.

## EventRegistrationPolicy

- PK: `policyID`
- Columns: `eventID`, `participantType`, `isEnabled`, `quota`, `waitlistEnabled`, `quotaReleaseAt`, `requiresApproval`, `requiresManualApproval`, `createdAt`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: unique `(eventID, participantType)`
- Notes:
  - Each event has exactly 3 rows, one for each participant type.
  - `requiresApproval = 1` routes matching registrations to `PENDING_APPROVAL` and delays seat consumption until approval.
  - `requiresManualApproval` is the v2 flag used by service logic; `requiresApproval` remains as a compatibility alias.

## AttendanceSession

- PK: `sessionID`
- Columns: `eventID`, `sessionName`, `checkInTime`, `evidenceProofUrl`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: none declared in JPA

## AttendanceRecord

- PK: `recordID`
- Columns: `sessionID`, `userID`, `registrationID`, `participantTypeSnapshotAt`, `attendanceStatus`, `checkInMethod`, `checkedInBy`, `checkedInAt`, `manualReason`, `capturedImgUrl`, `aiMatchConfidence`, `isVerifiedByAI`, `markedAt`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: unique `UK_AttendanceRecord_Session_Registration(sessionID, registrationID)`

## GuestVerificationOtp

- PK: `otpID`
- Columns: `eventRegistrationID`, `guestEmail`, `otpHash`, `expiresAt`, `usedAt`, `attemptCount`, `createdAt`, `createdBy`, `isDeleted`
- FK: `eventRegistrationID -> EventRegistration.registrationID`
- Index/constraint: hash-only storage; attempt count non-negative

## AuditLog

- PK: `auditLogID`
- Columns: existing audit metadata plus `beforeJson`, `afterJson`, `reason`
- FK: none declared in JPA
- Index/constraint: none declared in JPA

## ClubMembership

- PK: `membershipID`
- Columns: `clubID`, `userID`, `semesterID`, `clubRoleID`, `joinedDate`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: unique `(userID, clubID, semesterID)`

## EventAssignment

- PK: `assignmentID`
- Columns: `eventID`, `userID`, `eventRoleID`, `assignedAt`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: none declared in JPA

## MemberPerformance

- PK: `performanceID`
- Columns: `eventID`, `userID`, `clubID`, `basePoints`, `bonusPoints`, `penaltyPoints`, `finalPoints`, `leaderEvaluation`, `updatedAt`, `isDeleted`
- FK: none declared in JPA
- Index/constraint: none declared in JPA

## Conflicts To Fix Before Strict Migration

1. `ddl-auto` should move to `validate` only after the migration set is in place everywhere the app runs.
2. The codebase still has legacy service paths that use old event-status strings, even though the v2 enum now accepts both old and new spellings.
3. `EventServiceImpl` still contains legacy check-in helpers that should be retired after the QR flow fully migrates to `AttendanceServiceImpl`.
4. `EventRegistrationPolicy` must be seeded for existing events and created automatically for new events.
5. Backfill report for legacy registrations is intentionally non-destructive because there is no dedicated Host/Non-host column in the current schema.
