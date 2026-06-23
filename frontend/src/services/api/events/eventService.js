import axiosClient from "../axiosClient";

const eventService = {
  // ── PUBLIC ────────────────────────────────────────────────────────────────
  // GET /api/events/approved
  getApprovedEvents: () => axiosClient.get("/events/approved"),

  // GET /api/events/{eventId}
  getEventById: (eventId) => axiosClient.get(`/events/${eventId}`),

  // ── CLUB_LEADER / VICE_LEADER ─────────────────────────────────────────────
  // POST /api/events/registerEvent
  propose: (payload) => axiosClient.post("/events/registerEvent", payload),

  // POST /api/events/{eventId}/assignments
  addAssignment: (eventId, assignment) => axiosClient.post(`/events/${eventId}/assignments`, assignment),

  // GET /api/events/{eventId}/assignments
  getAssignments: (eventId) => axiosClient.get(`/events/${eventId}/assignments`),

  // DELETE /api/events/{eventId}/assignments/{userId}
  removeAssignment: (eventId, userId) => axiosClient.delete(`/events/${eventId}/assignments/${userId}`),

  // PATCH /api/events/{eventId}/submit
  submit: (eventId) => axiosClient.patch(`/events/${eventId}/submit`),

  // PATCH /api/events/{clubId}/{eventId}/cancel   body: { reason }
  cancel: (clubId, eventId, reason) =>
    axiosClient.patch(`/events/${clubId}/${eventId}/cancel`, { reason }),

  // ── ICPDP ─────────────────────────────────────────────────────────────────
  // GET /api/icpdp/events/pending
  getPendingForIcpdp: () => axiosClient.get("/icpdp/events/pending"),

  // GET /api/icpdp/events/{eventId}
  getEventByIdForIcpdp: (eventId) => axiosClient.get(`/icpdp/events/${eventId}`),

  // PATCH /api/icpdp/events/{eventId}/approve
  approveForIcpdp: (eventId) => axiosClient.patch(`/icpdp/events/${eventId}/approve`),

  // PATCH /api/icpdp/events/{eventId}/reject   body: { reason }
  rejectForIcpdp: (eventId, reason) =>
    axiosClient.patch(`/icpdp/events/${eventId}/reject`, { reason }),

  // ── MEMBER ────────────────────────────────────────────────────────────────
  // POST /api/event-registrations/register/{eventId}
  register: (eventId) => axiosClient.post(`/event-registrations/register/${eventId}`),

  // DELETE /api/event-registrations/unregister/{eventId}
  unregister: (eventId) => axiosClient.delete(`/event-registrations/unregister/${eventId}`),
  // ── CLUB_LEADER / ACTIONS ─────────────────────────────────────────────
  // POST /api/events/{eventId}/check-in/{studentId}
  checkIn: (eventId, studentId) => axiosClient.post(`/events/${eventId}/check-in/${studentId}`),

  // PATCH /api/events/{eventId}/finish
  finish: (eventId) => axiosClient.patch(`/events/${eventId}/finish`),

  // PATCH /api/events/{eventId}/close
  close: (eventId) => axiosClient.patch(`/events/${eventId}/close`),

  // GET /api/events/{eventId}/report/default-contributions
  getContributions: (eventId) => axiosClient.get(`/events/${eventId}/report/default-contributions`),

  // POST /api/events/{eventId}/report
  saveContributions: (eventId, contributions) =>
    axiosClient.post(`/events/${eventId}/report`, contributions),
};

export default eventService;
