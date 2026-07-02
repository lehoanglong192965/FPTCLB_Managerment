# BE-2 Progress Report

## Phase 0 - Repo Assessment + No-QR Audit

### Completed
- Created scoped implementation assessment.
- Created no-QR cleanup audit.
- Confirmed Contribution, Appeal, MemberPerformance, Event Close, and Report changes are out of scope per user request.

### Files Added
- `docs/be2-implementation-assessment.md`
- `docs/no-qr-cleanup.md`

### APIs Added/Changed
- Planned no-QR check-in endpoint: `POST /api/v1/attendance-sessions/{sessionId}/check-ins`.

### Migration
- No migration tool found; current convention is Hibernate `ddl-auto: update`.

### Tests Run
- Command: `git diff --check`
- Result: passed with CRLF warnings only.

### Dependencies / Integration Points
- BE-1: permission, event lifecycle, allocation, audit, error response.
- BE-3: feedback competition input consumer and scheduler runtime.

### Assumptions / TODO
- Do not overwrite current dirty contribution/member-ranking work.
- Do not introduce `LATE`.

### Known Risks
- Existing dirty files overlap event/attendance behavior and need team reconciliation.

## Phase 1 - Guest / Attendance / Feedback Foundation

### Completed
- Added scoped enums for registration, attendance, OTP, feedback invitation, participant type, and feedback assessment.
- Added `GuestVerificationOtp`, `EventFeedback`, and `EventFeedbackInvitation` entities.
- Extended `EventRegistration`, `AttendanceSession`, `AttendanceRecord`, and `Event` for BE-2 fields.
- Added repositories for Guest OTP and feedback entities plus registration/attendance lookup methods.
- Added state machines for Registration and AttendanceSession.
- Added PII-free `FeedbackCompetitionInput` and `FeedbackSummaryService` for BE-3 internal use.
- Migrated BE-2 attendance check-in API away from QR token to session + registration lookup. Successful check-in always creates `PRESENT`.
- Removed anonymous permit-all rule for the legacy QR attendance route.

### Files Added
- `backend/src/main/java/com/fptu/fcms/enums/*`
- `backend/src/main/java/com/fptu/fcms/entity/GuestVerificationOtp.java`
- `backend/src/main/java/com/fptu/fcms/entity/EventFeedback.java`
- `backend/src/main/java/com/fptu/fcms/entity/EventFeedbackInvitation.java`
- `backend/src/main/java/com/fptu/fcms/repository/GuestVerificationOtpRepository.java`
- `backend/src/main/java/com/fptu/fcms/repository/EventFeedbackRepository.java`
- `backend/src/main/java/com/fptu/fcms/repository/EventFeedbackInvitationRepository.java`
- `backend/src/main/java/com/fptu/fcms/dto/response/FeedbackCompetitionInput.java`
- `backend/src/main/java/com/fptu/fcms/service/FeedbackSummaryService.java`
- `backend/src/main/java/com/fptu/fcms/service/impl/FeedbackSummaryServiceImpl.java`
- `backend/src/main/java/com/fptu/fcms/service/statemachine/*`
- `docs/be2-api-contract.md`
- `docs/be2-feedback-competition-contract.md`
- `docs/be2-test-matrix.md`

### Files Modified
- `backend/src/main/java/com/fptu/fcms/config/SecurityConfig.java`
- `backend/src/main/java/com/fptu/fcms/controller/AttendanceController.java`
- `backend/src/main/java/com/fptu/fcms/dto/request/AttendanceCheckInRequest.java`
- `backend/src/main/java/com/fptu/fcms/dto/response/AttendanceCheckInResponse.java`
- `backend/src/main/java/com/fptu/fcms/entity/AttendanceRecord.java`
- `backend/src/main/java/com/fptu/fcms/entity/AttendanceSession.java`
- `backend/src/main/java/com/fptu/fcms/entity/Event.java`
- `backend/src/main/java/com/fptu/fcms/entity/EventRegistration.java`
- `backend/src/main/java/com/fptu/fcms/repository/AttendanceRecordRepository.java`
- `backend/src/main/java/com/fptu/fcms/repository/AttendanceSessionRepository.java`
- `backend/src/main/java/com/fptu/fcms/repository/EventRegistrationRepository.java`
- `backend/src/main/java/com/fptu/fcms/service/AttendanceService.java`
- `backend/src/main/java/com/fptu/fcms/service/impl/AttendanceServiceImpl.java`

### APIs Added/Changed
- `POST /api/events/{eventId}/guest-registrations`
- `POST /api/guest-registrations/{guestReference}/verify-otp`
- `POST /api/guest-registrations/{guestReference}/resend-otp`
- `GET /api/guest-registrations/{guestReference}`
- `POST /api/guest-registrations/{guestReference}/cancel`
- `POST /api/v1/events/{eventId}/attendance-sessions`
- `PUT /api/v1/attendance-sessions/{sessionId}`
- `POST /api/v1/attendance-sessions/{sessionId}/open`
- `POST /api/v1/attendance-sessions/{sessionId}/close`
- `GET /api/v1/attendance-sessions/{sessionId}/registrations/search`
- `GET /api/v1/attendance-sessions/{sessionId}/registrations/{registrationId}/preview`
- `POST /api/v1/attendance-sessions/{sessionId}/check-ins`
- `GET /api/v1/events/{eventId}/attendance-summary`
- `PATCH /api/v1/attendance-records/{attendanceRecordId}`
- `POST /api/events/{eventId}/feedbacks`
- `POST /api/guest-feedback/{feedbackToken}`
- `GET /api/events/{eventId}/feedback-summary`

### Migration
- Entity mapping added under current repo convention (`ddl-auto: update`).
- TODO: convert these mappings to explicit SQL Server migrations when the project chooses a migration convention.

### Tests Run
- Command: `./mvnw.cmd test`
- Result: blocked before compile. Environment uses Java 8 JRE and has no `javac`; project requires Java 21.
- Command: `java -version`
- Result: `java version "1.8.0_371"`.
- Command: `javac -version`
- Result: `javac` not found.
- Command: `git diff --check`
- Result: passed with CRLF warnings only.

### Dependencies / Integration Points
- BE-1: permission/audit/global error format and final event lifecycle policy.
- BE-3: `FeedbackSummaryService#getCompetitionInput(Integer eventId)` and `FeedbackAssessmentStatus` contract.

### Assumptions / TODO
- Legacy `Registered`/`REGISTERED` registrations are temporarily accepted by check-in as confirmed-compatible during migration.
- Existing `AttendanceTokenService` remains as deprecated legacy until all callers are removed.
- Existing `EventServiceImpl` still contains event-level check-in by student identifier and is currently dirty; it should be reconciled in a focused pass.
- `DefaultRegistrationAllocationPort` is a temporary adapter until BE-1 `RegistrationAllocationService` is available.

### Known Risks
- Build/test must be rerun on a JDK 21 environment.
- Schema constraints should be reviewed against the SQL Server database before shared deployment.
- Existing frontend still has QR/ticket UI and needs FE migration.