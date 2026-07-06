# Code snippets theo file "Dung huong.docx"

Nguon doc chia luong event/registration thanh 14 muc. Duoi day la code tuong ung theo tung muc, gom theo FE service, FE page, BE controller va BE service.

## 0. Base URL va 2 endpoint dau doc

`frontend/src/services/api/axiosClient.js:78`

```js
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});
```

`frontend/src/services/api/events/eventService.js:5,58`

```js
getApprovedEvents: () => axiosClient.get("/v1/events/approved"),
register: (eventId) => axiosClient.post(`/events/${eventId}/registrations/me`),
```

Suy ra:

```txt
axiosClient.get("/v1/events/approved")
=> GET http://localhost:8080/api/v1/events/approved

axiosClient.post("/events/{id}/registrations/me")
=> POST http://localhost:8080/api/events/{id}/registrations/me
```

## 1. Xem Event Public

FE service, `eventService.js:5`

```js
getApprovedEvents: () => axiosClient.get("/v1/events/approved"),
```

FE pages goi service:

```jsx
// EventsSection.jsx:30
const evRes = await safeGet(() => eventService.getApprovedEvents());

// EventListPage.jsx:51
safeGet(() => eventService.getApprovedEvents()),

// MemberEvents.jsx:27
eventService.getApprovedEvents().catch(() => []),

// IcpdpEventApproval.jsx:266
eventService.getApprovedEvents().catch(() => []),
```

BE controller, `EventController.java:47`

```java
@GetMapping("/approved")
public ResponseEntity<List<Event>> getApprovedEvents() {
    return ResponseEntity.ok(eventService.getApprovedEvents());
}
```

BE service, `EventServiceImpl.java:346`

```java
public List<Event> getApprovedEvents() {
    return eventRepository.findByEventStatusInAndIsDeletedFalse(
            List.of(STATUS_APPROVED, STATUS_REGISTRATION_OPEN, STATUS_REGISTRATION_CLOSED, STATUS_ONGOING));
}
```

## 2. Xem Chi Tiet Event

FE service, `eventService.js:6`

```js
getEventById: (eventId) => axiosClient.get(`/v1/events/${eventId}`),
```

FE pages:

```jsx
// EventDetailPage.jsx:42
eventService.getEventById(eventId),

// ClubEventsMgmt.jsx:299
const detail = await eventService.getEventById(ev.eventID);

// ReportSubmitPage.jsx:27
eventService.getEventById(eventId),
```

BE controller:

```java
// EventController.java:68
@GetMapping("/{eventId}")
public ResponseEntity<EventDetailResponse> getEventById(@PathVariable Integer eventId) {
    return ResponseEntity.ok(eventService.getPublicEventDetail(eventId));
}

// EventController.java:73
@GetMapping("/{eventId}/manage")
public ResponseEntity<EventDetailResponse> getManagedEventById(...) {
    return ResponseEntity.ok(eventService.getManagedEventDetail(eventId, currentUser));
}
```

BE service:

```java
// EventServiceImpl.java:365
public EventDetailResponse getPublicEventDetail(Integer eventId) {
    Event event = getActiveEventOrThrow(eventId);
    return toEventDetailResponse(event, null, false);
}

// EventServiceImpl.java:372
public EventDetailResponse getManagedEventDetail(Integer eventId, UserPrincipal currentUser) {
    Event event = getActiveEventOrThrow(eventId);
    return toEventDetailResponse(event, currentUser, true);
}
```

## 3. Tao / Sua / Submit Event

FE service:

```js
// eventService.js:11-13
propose: (payload) => axiosClient.post("/v1/events", payload),
update: (eventId, payload) => axiosClient.put(`/v1/events/${eventId}`, payload),
submit: (eventId) => axiosClient.patch(`/v1/events/${eventId}/submit`),
```

FE pages:

```jsx
// CreateEventPage.jsx:505
await eventService.propose({ clubID, semesterID, eventCode, eventName, ... });

// EventProposalForm.jsx:509
await eventService.propose({ clubID, semesterID, eventCode, eventName, ... });

// ClubEventsMgmt.jsx:340,752
await eventService.update(selectedEv.eventID, payload);
await eventService.submit(selectedEv.eventID);
```

BE controller:

```java
// EventController.java:107
@PostMapping
public ResponseEntity<Map<String, String>> createEventProposal(...) {
    eventService.createEventProposal(request, currentUser);
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Event proposal created successfully."));
}

// EventController.java:116
@PutMapping("/{eventId}")
public ResponseEntity<Map<String, String>> updateEvent(...) {
    eventService.updateEvent(eventId, request);
    return ResponseEntity.ok(Map.of("message", "Event updated successfully."));
}

// EventController.java:125
@PatchMapping("/{eventId}/submit")
public ResponseEntity<Map<String, String>> submitEventProposal(...) {
    eventService.submitEventProposal(eventId, currentUser);
    return ResponseEntity.ok(Map.of("message", "Event proposal submitted successfully."));
}
```

BE service:

```java
// EventServiceImpl.java:133
public void createEventProposal(CreateEventProposalRequest request, UserPrincipal currentUser) {
    validateCreateRequest(request);
    validateUserIsClubLeader(request.getClubID(), currentUser);
    Event event = new Event();
    event.setClubID(request.getClubID());
    event.setEventName(request.getEventName().trim());
    event.setEventStatus(STATUS_DRAFT);
    eventRepository.save(event);
}

// EventServiceImpl.java:197
public void submitEventProposal(Integer eventId, UserPrincipal currentUser) {
    Event event = getActiveEventOrThrow(eventId);
    assertCanModifyDraft(event, currentUser);
    validateEventBeforeSubmission(event);
    event.setEventStatus(STATUS_PENDING_APPROVAL);
    eventRepository.save(event);
}

// EventServiceImpl.java:638
public void updateEvent(Integer eventId, UpdateEventRequest request) {
    Event event = getActiveEventOrThrow(eventId);
    if (!STATUS_DRAFT.equals(event.getEventStatus())) {
        throw new IllegalArgumentException("Chi co the chinh sua su kien o trang thai Nhap.");
    }
    if (request.getEventName() != null) event.setEventName(request.getEventName());
    if (request.getBudget() != null) event.setBudget(request.getBudget());
    eventRepository.save(event);
}
```

## 4. ICPDP Duyet / Tu Choi Event

FE service:

```js
// eventService.js:51-55
getPendingForIcpdp: () => axiosClient.get("/icpdp/events/pending"),
getEventByIdForIcpdp: (eventId) => axiosClient.get(`/icpdp/events/${eventId}`),
approveForIcpdp: (eventId) => axiosClient.patch(`/icpdp/events/${eventId}/approve`),
rejectForIcpdp: (eventId, reason) =>
  axiosClient.patch(`/icpdp/events/${eventId}/reject`, { reason }),
```

FE page:

```jsx
// IcpdpEventApproval.jsx:265,331,342
eventService.getPendingForIcpdp().catch(() => []),
await eventService.approveForIcpdp(id);
await eventService.rejectForIcpdp(id, reason);
```

BE controller, `ICPDPEventController.java`

```java
@RequestMapping({"/api/icpdp/events", "/api/v1/icpdp/events"})

@GetMapping("/pending")
public ResponseEntity<List<Event>> getPendingEvents() {
    return ResponseEntity.ok(eventService.getPendingEvents());
}

@PatchMapping("/{eventId}/approve")
public ResponseEntity<Map<String, String>> approveEvent(@PathVariable Integer eventId) {
    eventService.approveEvent(eventId);
    return ResponseEntity.ok(Map.of("message", "Su kien da duoc phe duyet."));
}

@PatchMapping("/{eventId}/reject")
public ResponseEntity<Map<String, String>> rejectEvent(...) {
    eventService.rejectEvent(eventId, request.getReason());
    return ResponseEntity.ok(Map.of("message", "Su kien da bi tu choi."));
}
```

BE service:

```java
// EventServiceImpl.java:694
public void approveEvent(Integer eventId) {
    Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found."));
    stateMachineService.ensureCanApprove(event);
    event.setEventStatus(STATUS_APPROVED);
    event.setApprovedAt(LocalDateTime.now());
    eventRepository.save(event);
}

// EventServiceImpl.java:710
public void rejectEvent(Integer eventId, String reason) {
    Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found."));
    stateMachineService.ensureCanReject(event);
    event.setEventStatus(STATUS_REJECTED);
    event.setRejectionReason(reason);
    eventRepository.save(event);
}
```

## 5. Mo / Dong Dang Ky Event

FE service:

```js
// eventService.js:17-18
openRegistration: (eventId) => axiosClient.patch(`/v1/events/${eventId}/open-registration`),
closeRegistration: (eventId) => axiosClient.patch(`/v1/events/${eventId}/close-registration`),
```

FE page:

```jsx
// ClubEventsMgmt.jsx:785,814
await eventService.openRegistration(selectedEv.eventID);
await eventService.closeRegistration(selectedEv.eventID);
```

BE controller:

```java
// EventController.java:134
@RequestMapping(value = {"/{eventId}/registration/open", "/{eventId}/open-registration"}, method = {RequestMethod.POST, RequestMethod.PATCH})
public ResponseEntity<Map<String, String>> openRegistration(...) {
    eventService.openRegistration(eventId, currentUser);
    return ResponseEntity.ok(Map.of("message", "Registration opened successfully."));
}

// EventController.java:144
@RequestMapping(value = {"/{eventId}/registration/close", "/{eventId}/close-registration"}, method = {RequestMethod.POST, RequestMethod.PATCH})
public ResponseEntity<Map<String, String>> closeRegistration(...) {
    eventService.closeRegistration(eventId, currentUser);
    return ResponseEntity.ok(Map.of("message", "Registration closed successfully."));
}
```

BE service:

```java
// EventServiceImpl.java:614
public void openRegistration(Integer eventId, UserPrincipal currentUser) {
    Event event = getActiveEventOrThrow(eventId);
    stateMachineService.ensureCanOpenRegistration(event);
    event.setEventStatus(STATUS_REGISTRATION_OPEN);
    eventRepository.save(event);
}

// EventServiceImpl.java:671
public void closeRegistration(Integer eventId, UserPrincipal currentUser) {
    Event event = getActiveEventOrThrow(eventId);
    stateMachineService.ensureCanCloseRegistration(event);
    event.setEventStatus(STATUS_REGISTRATION_CLOSED);
    eventRepository.save(event);
}
```

## 6. Member Dang Ky Event

FE button:

```jsx
// EventRegistrationBtn.jsx:24
eventService.getMyEventStatus(eventId)
  .then(res => {
    const data = res.data || res;
    setIsRegistered(!!data.registered);
    setIsAssigned(!!data.assigned);
  });

// EventRegistrationBtn.jsx:127
await eventService.register(eventId);
```

FE service:

```js
// eventService.js:7,58
getMyEventStatus: (eventId) => axiosClient.get(`/v1/events/${eventId}/my-status`),
register: (eventId) => axiosClient.post(`/events/${eventId}/registrations/me`),
```

BE controller:

```java
// EventController.java:82
@GetMapping("/{eventId}/my-status")
public ResponseEntity<Map<String, Boolean>> getMyStatus(...) {
    boolean registered = eventRegistrationService.isUserRegistered(eventId, currentUser.getUserId());
    boolean assigned = eventService.isUserAssigned(eventId, currentUser.getUserId());
    return ResponseEntity.ok(Map.of("registered", registered, "assigned", assigned));
}

// EventRegistrationApiController.java:39
@PostMapping({"/api/events/{eventId}/registrations/me"})
public ResponseEntity<Map<String, String>> registerMe(...) {
    eventRegistrationService.registerEvent(eventId, currentUser.getUserId());
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registration submitted."));
}
```

BE service interface + impl:

```java
// EventRegistrationService.java:12
void registerEvent(Integer eventID, Integer userID);

// EventRegistrationServiceImpl.java:85
public void registerEvent(Integer eventID, Integer userID) {
    Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventID)
            .orElseThrow(() -> new IllegalArgumentException("Su kien khong ton tai."));
    ensureRegistrationWindowOpen(event);
    RegistrationAllocationResult allocation = allocationService.allocateInitial(
            eventID, event.getMaxParticipants(), requiresApproval);
    EventRegistration registration = new EventRegistration();
    registration.setEventID(eventID);
    registration.setUserID(userID);
    registration.setRegistrationStatus(allocation.status());
    registrationRepo.save(registration);
}
```

Allocation/status:

```java
// RegistrationAllocationServiceImpl.java:24
public RegistrationAllocationResult allocateInitial(Integer eventId, Integer maxParticipants, boolean requiresApproval) {
    if (requiresApproval) {
        return new RegistrationAllocationResult(RegistrationLifecycle.STATUS_PENDING_APPROVAL, false);
    }
    return hasAvailableSeat(eventId, maxParticipants)
            ? new RegistrationAllocationResult(RegistrationLifecycle.STATUS_CONFIRMED, true)
            : new RegistrationAllocationResult(RegistrationLifecycle.STATUS_WAITLISTED, false);
}

// RegistrationLifecycle.java:10-14
public static final RegistrationStatus STATUS_CONFIRMED = RegistrationStatus.CONFIRMED;
public static final RegistrationStatus STATUS_PENDING_APPROVAL = RegistrationStatus.PENDING_APPROVAL;
public static final RegistrationStatus STATUS_WAITLISTED = RegistrationStatus.WAITLISTED;
public static final RegistrationStatus STATUS_REJECTED = RegistrationStatus.REJECTED;
public static final RegistrationStatus STATUS_CANCELLED = RegistrationStatus.CANCELLED;
```

Repository/entity:

```java
// EventRegistrationRepository.java:16-23
boolean existsByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
Optional<EventRegistration> findByEventIDAndUserIDAndIsDeletedFalse(Integer eventID, Integer userID);
long countByEventIDAndRegistrationStatusInAndIsDeletedFalse(Integer eventID, Collection<RegistrationStatus> statuses);
List<EventRegistration> findByEventIDAndRegistrationStatusAndIsDeletedFalseOrderByRegisteredAtAsc(Integer eventID, RegistrationStatus status);

// EventRegistration.java:44-58
private Integer registrationID;
private Integer eventID;
private Integer userID;
private RegistrationStatus registrationStatus;
```

## 7. My Registrations

FE service + pages:

```js
// eventService.js:61
getMyRegistrations: () => axiosClient.get("/registrations/me/events"),
```

```jsx
// EventListPage.jsx:53
user ? eventService.getMyRegistrations().catch(() => []) : Promise.resolve([]),

// MemberEvents.jsx:29
user ? eventService.getMyRegistrations().catch(() => []) : Promise.resolve([]),

// MemberMyTickets.jsx:23
eventService.getMyRegistrations()
```

BE controller + service:

```java
// EventRegistrationApiController.java:49
@GetMapping({"/api/registrations/me/events"})
public ResponseEntity<List<Event>> getMyRegistrations(@AuthenticationPrincipal UserPrincipal currentUser) {
    return ResponseEntity.ok(eventRegistrationService.getEventsByUserRegistered(currentUser.getUserId()));
}
```

## 8. Leader Quan Ly Registrations

FE page:

```jsx
// RegistrationMgmtPage.jsx:85
const res = await eventService.listRegistrations(eventId, {});

// RegistrationMgmtPage.jsx:112,127,140
await eventService.approveRegistration(eventId, reg.registrationId ?? reg.id);
await eventService.rejectRegistration(eventId, id, reason);
await eventService.cancelRegistration(reg.registrationId ?? reg.id);
```

FE service:

```js
// eventService.js:67-76
listRegistrations: (eventId, params = {}) =>
  axiosClient.get(`/events/${eventId}/registrations`, { params }),
listPendingRegistrations: (eventId, params = {}) =>
  axiosClient.get(`/events/${eventId}/registrations/pending`, { params }),
approveRegistration: (eventId, registrationId) =>
  axiosClient.post(`/events/${eventId}/registrations/${registrationId}/approve`),
rejectRegistration: (eventId, registrationId, reason) =>
  axiosClient.post(`/events/${eventId}/registrations/${registrationId}/reject`, { reason }),
cancelRegistration: (registrationId) =>
  axiosClient.post(`/registrations/${registrationId}/cancel`),
```

BE controller:

```java
// EventRegistrationApiController.java:90,116,140,151,163
@GetMapping({"/api/events/{eventId}/registrations"})
@GetMapping({"/api/events/{eventId}/registrations/pending"})
@PostMapping({"/api/events/{eventId}/registrations/{registrationId}/approve", "/api/v1/events/{eventId}/registrations/{registrationId}/approve"})
@PostMapping({"/api/events/{eventId}/registrations/{registrationId}/reject"})
@PostMapping({"/api/registrations/{registrationId}/cancel"})
```

BE service:

```java
// EventRegistrationServiceImpl.java:223
public void approveRegistration(Integer eventId, Integer registrationId, UserPrincipal currentUser) {
    RegistrationAllocationResult allocation = allocationService.allocateOnApproval(eventId, event.getMaxParticipants());
    registration.setRegistrationStatus(allocation.status());
    registrationRepo.save(registration);
}

// EventRegistrationServiceImpl.java:250
public void rejectRegistration(Integer eventId, Integer registrationId, RegistrationRejectRequest request, UserPrincipal currentUser) {
    registration.setRegistrationStatus(RegistrationLifecycle.STATUS_REJECTED);
    registrationRepo.save(registration);
}

// EventRegistrationServiceImpl.java:276
public void cancelRegistration(Integer registrationId, UserPrincipal currentUser) {
    EventRegistration registration = registrationRepo.findById(registrationId)
            .orElseThrow(() -> new IllegalArgumentException("Registration not found."));
    cancelRegistrationInternal(registration, currentUser == null ? null : currentUser.getUserId(), false);
}
```

## 9. Guest Registration co 2 duong

Duong cu trong `eventService`:

```js
// eventService.js:59
registerGuest: (eventId, payload) => axiosClient.post(`/events/${eventId}/registrations/guest`, payload),
```

BE delegate sang `GuestRegistrationService`:

```java
// EventRegistrationApiController.java:56
@PostMapping({"/api/events/{eventId}/registrations/guest"})
public ResponseEntity<GuestRegistrationResponse> registerGuest(...) {
    return ResponseEntity.status(HttpStatus.CREATED).body(
            guestRegistrationService.createGuestRegistration(eventId, toGuestRegistrationRequest(request))
    );
}
```

Duong dang dung that o page guest:

```js
// guestService.js:9
register: (eventId, { fullName, email, phone, schoolOrOrganization, discoverySource = 'EVENT_PAGE', consent = true }) =>
  axiosClient.post(`/events/${eventId}/guest-registrations`, {
    fullName, email, phone, schoolOrOrganization, discoverySource, consent,
  }),
```

```jsx
// GuestRegisterPage.jsx:36
const res = await guestService.register(Number(eventId), {
  fullName: form.fullName.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  consent: true,
  discoverySource: 'EVENT_PAGE',
});
```

BE controller + service:

```java
// GuestRegistrationController.java:21,27
@RequestMapping("/api")
@PostMapping("/events/{eventId}/guest-registrations")
public ResponseEntity<GuestRegistrationResponse> register(...) {
    return ResponseEntity.status(HttpStatus.CREATED).body(guestRegistrationService.createGuestRegistration(eventId, request));
}
```

OTP/status/cancel:

```js
// guestService.js:16-29
verifyOtp: (guestReference, { otp }) =>
  axiosClient.post(`/guest-registrations/${guestReference}/verify-otp`, { otp }),
resendOtp: (guestReference) =>
  axiosClient.post(`/guest-registrations/${guestReference}/resend-otp`),
getStatus: (guestReference) =>
  axiosClient.get(`/guest-registrations/${guestReference}`),
cancel: (guestReference) =>
  axiosClient.post(`/guest-registrations/${guestReference}/cancel`),
```

```java
// GuestRegistrationController.java:35-54
@PostMapping("/guest-registrations/{guestReference}/verify-otp")
@PostMapping("/guest-registrations/{guestReference}/resend-otp")
@GetMapping("/guest-registrations/{guestReference}")
@PostMapping("/guest-registrations/{guestReference}/cancel")
```

## 10. Walk-in

Duong cu tra 410:

```js
// eventService.js:60
registerWalkIn: (eventId, payload) => axiosClient.post(`/events/${eventId}/registrations/walk-in`, payload),
```

```java
// EventRegistrationApiController.java:77
@PostMapping({"/api/events/{eventId}/registrations/walk-in"})
public ResponseEntity<Map<String, String>> registerWalkIn(...) {
    return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
            "message",
            "Walk-in guest registration now uses /api/attendance-sessions/{sessionId}/walk-ins/guest."
    ));
}
```

Luong dung hien tai:

```js
// walkInService.js:9,14,21
registerFptuWalkIn: (sessionId, { studentIdOrEmail }) =>
  axiosClient.post(`/v1/attendance-sessions/${sessionId}/walk-ins/fptu`, { studentIdOrEmail }),
registerGuestWalkIn: (sessionId, payload) =>
  axiosClient.post(`/v1/attendance-sessions/${sessionId}/walk-ins/guest`, payload),
emergencyOverride: (sessionId, payload) =>
  axiosClient.post(`/v1/attendance-sessions/${sessionId}/walk-ins/guest/emergency-override`, payload),
```

```jsx
// WalkInPage.jsx:49,64
await walkInService.registerFptuWalkIn(sessionId, { studentIdOrEmail: studentIdOrEmail.trim() });
await walkInService.registerGuestWalkIn(sessionId, { fullName, email, phone, consent: true, discoverySource: 'WALK_IN' });
```

```java
// WalkInController.java:23,29,39,48
@RequestMapping({"/api/v1/attendance-sessions/{sessionId}/walk-ins", "/api/attendance-sessions/{sessionId}/walk-ins"})
@PostMapping("/fptu")
@PostMapping("/guest")
@PostMapping("/guest/emergency-override")
```

## 11. Attendance Event

FE service:

```js
// attendanceService.js
createSession: (eventId, payload) => axiosClient.post(`/v1/events/${eventId}/attendance-sessions`, payload),
getSessions: async (eventId) => axiosClient.get(`/v1/events/${eventId}/attendance-session`),
openSession: (sessionId) => axiosClient.post(`/v1/attendance-sessions/${sessionId}/open`),
closeSession: (sessionId) => axiosClient.post(`/v1/attendance-sessions/${sessionId}/close`),
searchParticipants: (sessionId, keyword) =>
  axiosClient.get(`/v1/attendance-sessions/${sessionId}/registrations/search`, { params: { keyword } }),
previewRegistration: (sessionId, registrationId) =>
  axiosClient.get(`/v1/attendance-sessions/${sessionId}/registrations/${registrationId}/preview`),
checkIn: (sessionId, payload) => axiosClient.post(`/v1/attendance-sessions/${sessionId}/check-ins`, payload),
getEventAttendanceSummary: (eventId) => axiosClient.get(`/v1/events/${eventId}/attendance-summary`),
correctAttendance: (attendanceRecordId, payload) => axiosClient.patch(`/v1/attendance-records/${attendanceRecordId}`, payload),
```

BE controllers:

```java
// AttendanceSessionController.java
@RequestMapping({"/api/v1", "/api"})
@PostMapping("/events/{eventId}/attendance-sessions")
@GetMapping("/events/{eventId}/attendance-session")
@PostMapping("/attendance-sessions/{sessionId}/open")
@PostMapping("/attendance-sessions/{sessionId}/close")
@GetMapping("/attendance-sessions/{sessionId}/registrations/search")
@GetMapping("/attendance-sessions/{sessionId}/registrations/{registrationId}/preview")
@GetMapping("/events/{eventId}/attendance-summary")
@PatchMapping("/attendance-records/{attendanceRecordId}")

// AttendanceController.java
@RequestMapping({"/api/v1/attendance-sessions", "/api/attendance-sessions"})
@PostMapping("/{sessionId}/check-ins")
```

BE service:

```java
// AttendanceSessionServiceImpl.java
public AttendanceSessionResponse open(Integer sessionId, Integer actorId) { ... }
public AttendanceSessionResponse close(Integer sessionId, Integer actorId) { ... }
public List<AttendanceRegistrationSearchResponse> searchRegistrations(Integer sessionId, String keyword) { ... }
public AttendanceRegistrationSearchResponse preview(Integer sessionId, Integer registrationId) { ... }
public AttendanceSummaryResponse summary(Integer eventId) { ... }
public AttendanceRegistrationSearchResponse correct(Integer recordId, AttendanceCorrectionRequest request, Integer actorId) { ... }
```

## 12. Report Event

FE submit/review:

```js
// reportService.js:9,14
getByEventId: (eventId) => axiosClient.get(`/v1/reports/event/${eventId}`),
submit: (eventId, { file, summary }) => {
  const form = new FormData();
  form.append('eventID', eventId);
  form.append('summary', summary ?? '');
  form.append('file', file);
  return axiosClient.post('/v1/reports', form, { headers: { 'Content-Type': 'multipart/form-data' } });
},

// eventService.js:40
uploadReport: (eventId, summary, file) => { ... return axiosClient.post("/v1/reports", form, ...); }
```

```jsx
// IcpdpReportReview.jsx:195,223,239
const res = await reportService.getByEventId(eventId);
await reportService.approve(eventId);
await reportService.reject(eventId, { reason });
```

BE upload/get:

```java
// ReportController.java:24,31,40
@RequestMapping("/api/v1/reports")
@PostMapping(consumes = "multipart/form-data")
@GetMapping("/event/{eventId}")
```

```java
// ReportUploadServiceImpl.java:52
public Map<String, String> uploadEventReport(CreateEventReportRequest request, Integer uploadedBy) {
    EventReport report = new EventReport();
    report.setEventID(event.getEventID());
    report.setReportUrl("/api/uploads/" + fileName);
    report.setSummary(request.getSummary());
    report.setStatus(EventReportStatus.UPLOADED);
    eventReportRepository.save(report);
}
```

BE approve/reject report:

```java
// ContributionBatchController.java:32,41
@PatchMapping({"/events/{eventId}/approve-report", "/events/{eventId}/report/approve"})
public ResponseEntity<ContributionBatchResponse> approveReport(...) {
    return ResponseEntity.ok(contributionBatchService.approveReportAndCreateBatch(eventId, userId(principal)));
}

@PatchMapping("/events/{eventId}/report/reject")
public ResponseEntity<Void> rejectReport(...) {
    contributionBatchService.rejectReport(eventId, request.getReason(), userId(principal));
    return ResponseEntity.noContent().build();
}
```

## 13. Contribution Event

FE service:

```js
// contributionService.js
getDraft: (eventId) => axiosClient.get(`/v1/events/${eventId}/contributions`),
update: (eventId, contributions) => axiosClient.post(`/v1/events/${eventId}/contributions`, contributions),
getBatch: (eventId) => axiosClient.get(`/v1/events/${eventId}/contribution-batch`),
openAppealWindow: (eventId) => axiosClient.post(`/v1/events/${eventId}/contribution-batch/open-appeal`),
finalize: (eventId) => axiosClient.post(`/v1/events/${eventId}/contribution-batch/finalize`),
submitAppeal: (batchId, { reason }) => axiosClient.post(`/v1/contribution-batches/${batchId}/appeals`, { reason }),
getAppeals: (batchId) => axiosClient.get(`/v1/contribution-batches/${batchId}/appeals`),
resolveAppeal: (appealId, payload) => axiosClient.patch(`/v1/contribution-appeals/${appealId}/resolve`, payload),
```

FE pages:

```jsx
// ContributionManagementPage.jsx:191,248,261
contributionService.getDraft(eventId),
await contributionService.update(eventId, payload);
const res = await contributionService.openAppealWindow(eventId);

// MemberAppealPage.jsx:28,43
contributionService.getBatch(eventId);
const res = await contributionService.submitAppeal(batchId, { reason: reason.trim() });
```

BE controllers:

```java
// EventController.java:213,220
@GetMapping("/{eventId}/contributions")
@PostMapping("/{eventId}/contributions")

// ContributionBatchController.java:52,58,67,76,82,92
@GetMapping("/events/{eventId}/contribution-batch")
@PostMapping("/events/{eventId}/contribution-batch/open-appeal")
@PostMapping("/events/{eventId}/contribution-batch/finalize")
@GetMapping("/contribution-batches/{batchId}/appeals")
@PostMapping("/contribution-batches/{batchId}/appeals")
@PatchMapping("/contribution-appeals/{appealId}/resolve")
```

BE service:

```java
// ContributionBatchServiceImpl.java
public ContributionBatchResponse getBatchByEvent(Integer eventId) { ... }
public ContributionBatchResponse saveContributionScores(Integer eventId, List<ContributionDTO> contributions, Integer actorId) { ... }
public ContributionBatchResponse openAppealWindow(Integer eventId, Integer actorId) { ... }
public ContributionBatchResponse finalizeBatch(Integer eventId, Integer actorId) { ... }
```

## 14. Feedback Event

FE service:

```js
// feedbackService.js:14,18,31,35,48
checkEligibility: (eventId) => axiosClient.get(`/v1/events/${eventId}/feedback/eligibility`),
submit: (eventId, payload) => axiosClient.post(`/v1/events/${eventId}/feedback`, payload),
validateGuestToken: (token) => axiosClient.get(`/v1/feedback/guest/${token}`),
submitGuest: (token, payload) => axiosClient.post(`/v1/feedback/guest/${token}`, payload),
getSummary: (eventId) => axiosClient.get(`/v1/events/${eventId}/feedback/summary`),
```

FE pages:

```jsx
// FeedbackPage.jsx:52,71
feedbackService.checkEligibility(eventId);
await feedbackService.submit(eventId, payload);

// FeedbackSummaryPage.jsx:41
feedbackService.getSummary(eventId);
```

BE controller:

```java
// FeedbackController.java:23,29,37,47,52,60
@RequestMapping("/api")
@GetMapping({"/v1/events/{eventId}/feedback/eligibility", "/events/{eventId}/feedback/eligibility"})
@PostMapping({"/events/{eventId}/feedbacks", "/v1/events/{eventId}/feedback", "/v1/events/{eventId}/feedbacks"})
@GetMapping({"/guest-feedback/{feedbackToken}", "/v1/feedback/guest/{feedbackToken}"})
@PostMapping({"/guest-feedback/{feedbackToken}", "/v1/feedback/guest/{feedbackToken}"})
@GetMapping({"/events/{eventId}/feedback-summary", "/v1/events/{eventId}/feedback/summary", "/v1/events/{eventId}/feedback-summary"})
```

BE service:

```java
// FeedbackServiceImpl.java
public FeedbackSubmitResponse submitFptu(Integer eventId, FeedbackSubmitRequest request, Integer userId) { ... }
public FeedbackGuestTokenResponse validateGuestToken(String feedbackToken) { ... }
public FeedbackSubmitResponse submitGuest(String feedbackToken, FeedbackSubmitRequest request) { ... }
public FeedbackCompetitionInput summary(Integer eventId) {
    return feedbackSummaryService.getCompetitionInput(eventId);
}
```

## Cac diem dang lech / can quyet dinh

### 1. `eventService.unregister` khong khop BE endpoint hien tai

FE dang co:

```js
// eventService.js:64
unregister: (eventId) => axiosClient.delete(`/event-registrations/unregister/${eventId}`),
```

BE endpoint cancel hien tai:

```java
// EventRegistrationApiController.java:163
@PostMapping({"/api/registrations/{registrationId}/cancel"})
public ResponseEntity<Map<String, String>> cancelRegistration(...) {
    eventRegistrationService.cancelRegistration(registrationId, currentUser);
    return ResponseEntity.ok(Map.of("message", "Registration cancelled."));
}
```

Huong map dung hon:

```js
cancelRegistration: (registrationId) =>
  axiosClient.post(`/registrations/${registrationId}/cancel`),
```

### 2. `eventService.uploadBanner` chua thay BE endpoint tuong ung

FE dang goi:

```js
// eventService.js:32
uploadBanner: (eventId, file) => {
  const form = new FormData();
  form.append("file", file);
  return axiosClient.post(`/v1/events/${eventId}/banner`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
},
```

Trong `EventController.java` khong thay `@PostMapping("/{eventId}/banner")`.

### 3. ReportSubmitPage co the bi 403 khi get report

FE Leader/Vice page goi:

```jsx
// ReportSubmitPage.jsx:28
reportService.getByEventId(eventId),
```

BE endpoint dang gioi han ICPDP:

```java
// ReportController.java:40
@GetMapping("/event/{eventId}")
@PreAuthorize("hasRole('ICPDP')")
public ResponseEntity<Map<String, String>> getReport(@PathVariable Integer eventId) {
    return ResponseEntity.ok(reportUploadService.getReportByEventId(eventId));
}
```

Can quyet dinh: cho Leader/Vice xem report cua event minh quan ly, hoac FE khong goi get report o man nop lai.

### 4. Guest registration nen thong nhat mot duong

Dang co 2 duong:

```js
// eventService.js
registerGuest: (eventId, payload) => axiosClient.post(`/events/${eventId}/registrations/guest`, payload),

// guestService.js
register: (eventId, payload) => axiosClient.post(`/events/${eventId}/guest-registrations`, payload),
```

Page guest hien dung `guestService.register`, nen neu muon tranh nham lan thi nen uu tien `guestService` cho guest flow.
