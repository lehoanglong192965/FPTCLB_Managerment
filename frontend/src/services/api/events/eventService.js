import axiosClient from "../axiosClient";

const eventService = {
  // ── PUBLIC ──────────────────────────────────────────────────────
  getPublic: (params) => axiosClient.get("/events/public", { params }),
  getPublicById: (eventId) => axiosClient.get(`/events/public/${eventId}`),

  // ── MEMBER ──────────────────────────────────────────────────────
  register: (eventId) => axiosClient.post(`/events/${eventId}/register`),
  unregister: (eventId) => axiosClient.delete(`/events/${eventId}/register`),
  getMyEvents: (params) => axiosClient.get("/events/my", { params }),

  // ── CORE_TEAM trở lên ───────────────────────────────────────────
  getByClub: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/events`, { params }),
  create: (clubId, payload) =>
    axiosClient.post(`/clubs/${clubId}/events`, payload),
  update: (clubId, eventId, payload) =>
    axiosClient.put(`/clubs/${clubId}/events/${eventId}`, payload),
  uploadBanner: (clubId, eventId, file) => {
    const form = new FormData();
    form.append("banner", file);
    return axiosClient.post(`/clubs/${clubId}/events/${eventId}/banner`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  cancel: (clubId, eventId, reason) =>
    axiosClient.patch(`/clubs/${clubId}/events/${eventId}/cancel`, { reason }),
  delete: (clubId, eventId) =>
    axiosClient.delete(`/clubs/${clubId}/events/${eventId}`),
  getAttendees: (clubId, eventId, params) =>
    axiosClient.get(`/clubs/${clubId}/events/${eventId}/attendees`, { params }),
  checkIn: (clubId, eventId, memberId) =>
    axiosClient.patch(`/clubs/${clubId}/events/${eventId}/checkin/${memberId}`),
};

export default eventService;
