# BE-2 API Contract

## Attendance Check-in

Endpoint: `POST /api/v1/attendance-sessions/{sessionId}/check-ins`

- Role/permission: authenticated check-in staff, Leader, or ICPDP; final assignment policy belongs to BE-1 permission service.
- Request:

```json
{
  "registrationId": 123,
  "verificationMethod": "PHONE_LAST4",
  "verificationValue": "4321",
  "guestFullName": "Guest Name",
  "note": "optional"
}
```

- Response:

```json
{
  "eventId": 10,
  "registrationId": 123,
  "userId": 42,
  "status": "PRESENT",
  "message": "Check-in successful."
}
```

- Error codes:
  - `ATTENDANCE_SESSION_NOT_OPEN`
  - `REGISTRATION_NOT_CONFIRMED`
  - `ATTENDANCE_ALREADY_CHECKED_IN`
  - `GUEST_PHONE_LAST4_MISMATCH`
  - `GUEST_FULL_NAME_MISMATCH`
  - `EVENT_CLOSED`

- State transition: creates one `AttendanceRecord` with `attendanceStatus = PRESENT`.
- Audit behavior: sensitive action; should write AuditLog once BE-1 audit service is wired.
- PII: response must not include full Guest email/phone.

## Feedback

Endpoint: `GET /api/v1/events/{eventId}/feedback/eligibility`

- Role/permission: authenticated FPTU participant.
- Response: whether current user can submit feedback and the `registrationId` FE should send back.

Endpoint: `POST /api/events/{eventId}/feedbacks`
Alias: `POST /api/v1/events/{eventId}/feedback`, `POST /api/v1/events/{eventId}/feedbacks`

- Role/permission: authenticated FPTU participant.
- Eligibility: registration belongs to current user, attendance is `PRESENT`, feedback window enabled/open, no duplicate feedback.
- Request:

```json
{
  "registrationId": 123,
  "overallRating": 5,
  "comment": "optional"
}
```

Endpoint: `GET /api/v1/feedback/guest/{feedbackToken}`

- Role/permission: public token flow.
- Response: whether token is valid plus `eventId` and `registrationId` for submit.

Endpoint: `POST /api/guest-feedback/{feedbackToken}`
Alias: `POST /api/v1/feedback/guest/{feedbackToken}`

- Role/permission: public token flow.
- Token rule: token hash only in DB, feedback-only use, not valid for check-in/status/cancel.

Endpoint: `GET /api/events/{eventId}/feedback-summary`
Alias: `GET /api/v1/events/{eventId}/feedback/summary`, `GET /api/v1/events/{eventId}/feedback-summary`

- Role/permission: Leader/ICPDP.
- Response: aggregate summary only; no PII or raw identified feedback.

## Planned Guest OTP

- `POST /api/events/{eventId}/guest-registrations`
- `POST /api/guest-registrations/{guestReference}/verify-otp`
- `POST /api/guest-registrations/{guestReference}/resend-otp`
- `GET /api/guest-registrations/{guestReference}`
- `POST /api/guest-registrations/{guestReference}/cancel`
