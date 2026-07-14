# BE-2 Test Matrix

| Business rule | Unit test | Integration test | Endpoint |
|---|---|---|---|
| Registration transitions are validated by service | `RegistrationStateMachineServiceTest` | Guest OTP verify later | Guest OTP |
| Attendance session has its own DRAFT/OPEN/CLOSED states | `AttendanceSessionStateMachineServiceTest` | Session open/close later | Attendance session |
| Attendance status only uses PRESENT/ABSENT | `AttendanceStatusTest` | Check-in/close-session later | Attendance |
| Check-in uses registrationID and creates PRESENT | Pending service test | Check-in integration later | `POST /api/v1/attendance-sessions/{sessionId}/check-ins` |
| ABSENT cannot feedback | `FeedbackEligibilityServiceTest` later | Feedback integration later | Feedback |
| Duplicate feedback blocked by event + registration | Repository mapping test later | Feedback integration later | Feedback |
| Feedback assessment below sample threshold is INSUFFICIENT_SAMPLE | `FeedbackSummaryServiceTest` | Feedback summary later | Feedback summary |
| GOOD requires average and positive rate thresholds | `FeedbackSummaryServiceTest` | Feedback summary later | Feedback summary |
| FeedbackCompetitionInput contains no PII | `FeedbackSummaryServiceTest` | BE-3 contract test later | Internal service |
