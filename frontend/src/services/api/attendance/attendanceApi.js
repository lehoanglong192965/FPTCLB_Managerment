import axiosClient from "../axiosClient";

// Normalize AttendanceRegistrationSearchResponse fields to match page expectations
const normalizeRecord = (r) => {
  const guestRegistrationId = r.guestRegistrationId ?? r.guestRegistrationID;
  const registrationId = r.registrationId ?? r.registrationID;
  const participantKey = guestRegistrationId
    ? 'guest-' + guestRegistrationId
    : 'fptu-' + (registrationId ?? r.recordId ?? r.id);
  return {
    ...r,
    registrationId,
    guestRegistrationId,
    participantKey,
    fullName:  r.displayName      ?? r.fullName,
    studentId: r.studentId ?? r.registrationCode,
    status:    r.attendanceStatus ?? r.status,
    recordId:  r.recordId ?? participantKey,
  };
};

const attendanceApi = {

  // ── SESSION MANAGEMENT ────────────────────────────────────────────
  // POST /api/v1/events/{eventId}/attendance-sessions
  // AttendanceSessionRequest: name (@NotBlank), opensAt, closesAt
  createSession: (eventId, { sessionName, name, opensAt, closesAt }) =>
    axiosClient.post(`/v1/events/${eventId}/attendance-sessions`, {
      name: name ?? sessionName,
      opensAt,
      closesAt,
    }),

  // GET /api/v1/events/{eventId}/attendance-session  (singular — returns one session per event)
  // Wrapped in array for backward compat with pages that expect list
  getSessions: async (eventId) => {
    const session = await axiosClient.get(`/v1/events/${eventId}/attendance-session`);
    if (!session) return [];
    return [{ ...session, sessionName: session.sessionName ?? session.name }];
  },

  // POST /api/v1/attendance-sessions/{sessionId}/open
  openSession: (sessionId) =>
    axiosClient.post(`/v1/attendance-sessions/${sessionId}/open`),

  // POST /api/v1/attendance-sessions/{sessionId}/close
  closeSession: (sessionId) =>
    axiosClient.post(`/v1/attendance-sessions/${sessionId}/close`),

  // ── SEARCH & PREVIEW ─────────────────────────────────────────────
  // GET /api/v1/attendance-sessions/{sessionId}/registrations/search?keyword=
  searchParticipants: (sessionId, keyword) =>
    axiosClient.get(`/v1/attendance-sessions/${sessionId}/registrations/search`, {
      params: { keyword },
    }).then((list) => (Array.isArray(list) ? list : []).map(normalizeRecord)),

  // GET /api/v1/attendance-sessions/{sessionId}/registrations/{registrationId}/preview
  previewRegistration: (sessionId, registrationId) =>
    axiosClient.get(`/v1/attendance-sessions/${sessionId}/registrations/${registrationId}/preview`),

  // ── CHECK-IN ─────────────────────────────────────────────────────
  // POST /api/v1/attendance-sessions/{sessionId}/check-ins
  // AttendanceCheckInRequest: registrationId, guestRegistrationId, verificationMethod (@NotBlank), verificationValue, guestFullName, note
  checkIn: (sessionId, { registrationId, guestRegistrationId, verificationMethod = 'MANUAL', verificationValue, guestFullName, note }) =>
    axiosClient.post(`/v1/attendance-sessions/${sessionId}/check-ins`, {
      registrationId,
      guestRegistrationId,
      verificationMethod,
      verificationValue,
      guestFullName,
      note,
    }),

  // ── SESSION SUMMARY (no dedicated BE endpoint — computed from search) ──
  getSessionSummary: async (sessionId) => {
    const records = await attendanceApi.searchParticipants(sessionId, '');
    return {
      records,
      totalRegistered: records.length,
      totalCheckedIn:  records.filter((r) => r.attendanceStatus === 'PRESENT').length,
      totalAbsent:     records.filter((r) => r.attendanceStatus === 'ABSENT').length,
    };
  },

  // ── EVENT SUMMARY ─────────────────────────────────────────────────
  // GET /api/v1/events/{eventId}/attendance-summary
  getEventAttendanceSummary: async (eventId) => {
    const summary = await axiosClient.get(`/v1/events/${eventId}/attendance-summary`);
    const totalRegistered = summary.totalRegistered ?? summary.confirmedCount ?? 0;
    const totalPresent = summary.totalPresent ?? summary.presentCount ?? summary.totalCheckedIn ?? 0;
    const totalAbsent = summary.totalAbsent ?? summary.absentCount ?? Math.max(totalRegistered - totalPresent, 0);
    return {
      ...summary,
      totalRegistered,
      totalPresent,
      totalCheckedIn: totalPresent,
      totalAbsent,
      attendanceRate: totalRegistered > 0 ? ((totalPresent / totalRegistered) * 100).toFixed(1) : 0,
    };
  },

  // ── CORRECTION ───────────────────────────────────────────────────
  // PATCH /api/v1/attendance-records/{attendanceRecordId}
  // AttendanceCorrectionRequest: attendanceStatus (@NotBlank), overrideReason (@NotBlank), note
  correctAttendance: (attendanceRecordId, { status, reason, note }) =>
    axiosClient.patch(`/v1/attendance-records/${attendanceRecordId}`, {
      attendanceStatus: status,
      overrideReason:   reason,
      note,
    }),
};

export default attendanceApi;
