# BE-2 Implementation Assessment

## Repo Baseline

- Backend: Spring Boot 3.3.0, Java 21, Spring Data JPA, Spring Security, SQL Server.
- Frontend: React + Vite.
- Migration convention: no Flyway/Liquibase dependency is present. The repo currently uses Hibernate `ddl-auto: update` in `backend/src/main/resources/application.yml`.
- Error response: `GlobalExceptionHandler` currently returns `{success,timestamp,status,error,message}` rather than the target `{code,message,fieldErrors,requestId}` shape.
- Security: JWT via `JwtAuthenticationFilter`, `UserPrincipal`, route rules in `SecurityConfig`, and method security enabled.

## Existing Relevant Code

- `Event`: string `eventStatus`; current code uses legacy values such as `RegistrationOpen`, `Ongoing`, `Completed`, `Closed`.
- `EventRegistration`: supports FPTU and Guest fields, but lacks guest reference hash, channel/source, participant snapshot, verification timestamp, and waitlist snapshot fields.
- `AttendanceSession`: exists with `sessionName`, `checkInTime`, `evidenceProofUrl`; lacks `DRAFT/OPEN/CLOSED` state and open/close actors.
- `AttendanceRecord`: exists but links by `userID`, not `registrationID`; has AI/face evidence fields.
- `AuditLog`: exists with actor/action/table/old/new/reason; lacks requestId.
- Notification entities and `EventNotificationListener` exist for event lifecycle, not registration state notification.
- `OTPVerification`/`OTPService` exist for account OTP, not Guest registration OTP.
- There is no existing `EventFeedback` or feedback competition input service.

## Existing No-QR Violations

- `AttendanceController` originally exposed `POST /api/v1/attendance/checkin` and accepted `qrToken`; this pass migrates BE-2 to a session-scoped registration lookup endpoint.
- `AttendanceServiceImpl` parses attendance QR JWT tokens and writes attendance by `userID`.
- `AttendanceTokenService` and `AttendanceTokenServiceImpl` generate/parse attendance QR tokens.
- `SecurityConfig` originally permitted anonymous `POST /api/v1/attendance/checkin`; this pass removed that permit-all rule.
- `EventController` / `EventServiceImpl` also contain event-level check-in by student identifier. `EventServiceImpl` is already dirty in the working tree and overlaps BE-1 event core, so this pass documents it instead of overwriting it.
- Frontend still has `EventCheckInScanner.jsx`, QR text/icon, and ticket-oriented pages/routes.

## Out Of Scope For This Prompt

- Do not create or change Contribution, Appeal, MemberPerformance, or Event Close logic.
- Existing files in that area are treated as owned by the current implementation/team and are left untouched.

## Added / Standardized In This Pass

- Entities/repositories for:
  - `GuestVerificationOtp`
  - `EventFeedback`
  - `EventFeedbackInvitation`
- Existing entities extended for v4.1 data:
  - `EventRegistration`
  - `AttendanceSession`
  - `AttendanceRecord`
- `FeedbackSummaryService` contract and implementation for BE-3 to consume aggregate, PII-free competition input.

## Assumptions

- Because the repo currently uses `ddl-auto: update`, entity mapping is used as the current schema-change convention. Explicit SQL Server migrations should be added once the team chooses Flyway/Liquibase/manual DDL.
- During incremental migration, legacy `Registered`/`REGISTERED` registration status is treated as confirmed-compatible only where needed to avoid breaking existing flows.
- Attendance status is constrained in new BE-2 code to `PRESENT` and `ABSENT`; no `LATE` or late-threshold logic is introduced.

## BE-1 / BE-3 Integration Points

- BE-1: final event lifecycle, permission service, participant classifier, registration allocation, capacity/waitlist, audit core, global error format.
- BE-3: scheduler runtime/idempotency, feedback invitation scheduler trigger, club competition scoring. BE-3 should call `FeedbackSummaryService#getCompetitionInput(Integer eventId)`.

## Prompt Mapping

- Phase 0: this assessment and `docs/no-qr-cleanup.md`.
- Phase 1: JPA entity extensions, scoped new entities, enums, repositories, state machines, and tests.
