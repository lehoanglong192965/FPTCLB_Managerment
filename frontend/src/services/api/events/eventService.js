import axiosClient from "../axiosClient";

const eventService = {
  // ── PUBLIC ────────────────────────────────────────────────────────────────
  // GET /api/v1/events/approved
  getApprovedEvents: () => axiosClient.get("/v1/events/approved"),

  // GET /api/v1/events/{eventId}
  getEventById: (eventId) => axiosClient.get(`/v1/events/${eventId}`),

  // GET /api/v1/events/{eventId}/my-status
  getMyEventStatus: (eventId) => axiosClient.get(`/v1/events/${eventId}/my-status`),

  // GET /api/v1/events/my-assignments
  getMyAssignments: () => axiosClient.get("/v1/events/my-assignments"),

  // ── CLUB_LEADER / VICE_LEADER ─────────────────────────────────────────────
  // POST /api/v1/events
  propose: (payload) => axiosClient.post("/v1/events", payload),

  // PATCH /api/v1/events/{eventId}/submit
  submit: (eventId) => axiosClient.patch(`/v1/events/${eventId}/submit`),

  // PATCH /api/v1/events/{eventId}/start
  start: (eventId) => axiosClient.patch(`/v1/events/${eventId}/start`),

  // PATCH /api/v1/events/{eventId}/finish
  finish: (eventId) => axiosClient.patch(`/v1/events/${eventId}/finish`),

  // PATCH /api/v1/events/{eventId}/close
  close: (eventId) => axiosClient.patch(`/v1/events/${eventId}/close`),

  // PATCH /api/v1/events/{eventId}/open-registration
  openRegistration: (eventId) => axiosClient.patch(`/v1/events/${eventId}/open-registration`),

  // PATCH /api/v1/events/{clubId}/{eventId}/cancel   body: { reason }
  cancel: (clubId, eventId, reason) =>
    axiosClient.patch(`/v1/events/${clubId}/${eventId}/cancel`, { reason }),

  // POST /api/v1/events/{eventId}/check-in/{studentId}
  checkIn: (eventId, studentId) =>
    axiosClient.post(`/v1/events/${eventId}/check-in/${studentId}`),

  // GET /api/v1/events/{eventId}/contributions
  getContributions: (eventId) => axiosClient.get(`/v1/events/${eventId}/contributions`),

  // POST /api/v1/events/{eventId}/contributions
  saveContributions: (eventId, contributions) =>
    axiosClient.post(`/v1/events/${eventId}/contributions`, contributions),

  // POST /api/v1/events/{eventId}/assignments
  addAssignment: (eventId, assignment) =>
    axiosClient.post(`/v1/events/${eventId}/assignments`, assignment),

  // GET /api/v1/events/{eventId}/assignments
  getAssignments: (eventId) => axiosClient.get(`/v1/events/${eventId}/assignments`),

  // DELETE /api/v1/events/{eventId}/assignments/{userId}
  removeAssignment: (eventId, userId) =>
    axiosClient.delete(`/v1/events/${eventId}/assignments/${userId}`),

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

  // GET /api/event-registrations/my-registrations
  getMyRegistrations: () => axiosClient.get("/event-registrations/my-registrations"),
};

export default eventService;
