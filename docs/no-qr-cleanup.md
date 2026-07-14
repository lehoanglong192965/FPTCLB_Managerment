# No-QR Cleanup Audit

## Backend

### File / Class: `AttendanceController`

- Current behavior: exposes `POST /api/v1/attendance/checkin` using `qrToken`.
- Why it violates no-QR rule: v4.1 requires staff lookup by `registrationID`, not QR.
- Action: migrate.
- Impact: replace with session-scoped check-in using `POST /api/v1/attendance-sessions/{sessionId}/check-ins`.

### File / Class: `AttendanceCheckInRequest`

- Current behavior: requires `qrToken`.
- Why it violates no-QR rule: token-driven check-in bypasses registration lookup and identity verification.
- Action: migrate.
- Impact: request should carry `registrationId`, `verificationMethod`, optional `verificationValue`, guest full name, and note.

### File / Class: `AttendanceServiceImpl`

- Current behavior: parses QR JWT, checks Redis nonce, creates attendance by `userID`.
- Why it violates no-QR rule: attendance must link `registrationID`, and Guest check-in requires name + phone last4 verification.
- Action: migrate.
- Impact: create `PRESENT` attendance by `(sessionID, registrationID)` only when session is `OPEN` and registration is confirmed.

### File / Class: `AttendanceTokenService`, `AttendanceTokenServiceImpl`

- Current behavior: generates/parses attendance QR JWT.
- Why it violates no-QR rule: QR/ticket token must not be used for check-in.
- Action: deprecate.
- Impact: leave only until all callers are removed, then delete.

### File / Class: `SecurityConfig`

- Current behavior: originally permitted anonymous `POST /api/v1/attendance/checkin`; this pass removes the permit-all rule.
- Why it violates no-QR rule: staff check-in must be authenticated and permission checked.
- Action: migrate.
- Impact: remove anonymous permit for legacy route.

### File / Class: `EventController` / `EventServiceImpl`

- Current behavior: event-level check-in by student identifier exists.
- Why it violates no-QR rule: check-in must be scoped to attendance session and confirmed registration.
- Action: migrate.
- Impact: documented as BE-1/BE-2 overlap. `EventServiceImpl` is already dirty in the working tree, so it is not overwritten in this pass.

### File / Class: `AttendanceRecord`

- Current behavior: attendance is linked by `userID`.
- Why it violates no-QR rule: v4.1 requires attendance by `registrationID`.
- Action: migrate.
- Impact: add `registrationID` and unique `(sessionID, registrationID)`.

## Frontend

### File / Class: `frontend/src/pages/club-leader/EventCheckInScanner.jsx`

- Current behavior: QR/scanner-oriented check-in UI.
- Why it violates no-QR rule: QR scanning is forbidden.
- Action: migrate.
- Impact: replace with registration search/check-in console.

### File / Class: `frontend/src/pages/club-leader/CheckInPage.jsx`

- Current behavior: renders `EventCheckInScanner`.
- Why it violates no-QR rule: routes staff to QR scanner flow.
- Action: migrate.
- Impact: should render no-QR attendance console.

### File / Class: ticket-related member pages/routes

- Current behavior: ticket wording and `ticketStatus` appear in `MemberMyTickets`, `EventCard`, layout menu, and mocks.
- Why it violates no-QR rule: ticket model can imply token/QR attendance.
- Action: deprecate.
- Impact: rename toward registration/status after FE contract is updated.

## Dependencies

- No dedicated QR scanner dependency was found in backend `pom.xml`.
- JWT remains valid for authentication, but not for attendance QR.

## Database

- `AttendanceRecord.userID` should remain temporarily for compatibility, but v4.1 writes must use `registrationID`.
- `AttendanceSession` needs explicit `DRAFT/OPEN/CLOSED` state.
