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
};

export default eventService;
