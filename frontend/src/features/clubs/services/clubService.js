import axiosClient from "../../../services/api/axiosClient";

const clubService = {
  // ── PUBLIC ──────────────────────────────────────────────────────
  getAll: (params) => axiosClient.get("/clubs", { params }),
  getById: (clubId) => axiosClient.get(`/clubs/${clubId}`),
  getPublicEvents: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/events/public`, { params }),

  // ── MEMBER ──────────────────────────────────────────────────────
  join: (clubId) => axiosClient.post(`/clubs/${clubId}/join`),
  leave: (clubId) => axiosClient.post(`/clubs/${clubId}/leave`),
  getMyClubs: () => axiosClient.get("/clubs/my"),

  // ── CLUB_LEADER / VICE_LEADER / CORE_TEAM ───────────────────────
  create: (payload) => axiosClient.post("/clubs", payload),
  update: (clubId, payload) => axiosClient.put(`/clubs/${clubId}`, payload),
  uploadCover: (clubId, file) => {
    const form = new FormData();
    form.append("cover", file);
    return axiosClient.post(`/clubs/${clubId}/cover`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAllEvents: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/events`, { params }),

  // ── CLUB_MANAGER / ADMIN ─────────────────────────────────────────
  review: (clubId, { status, reason }) =>
    axiosClient.patch(`/clubs/${clubId}/review`, { status, reason }),
  delete: (clubId) => axiosClient.delete(`/clubs/${clubId}`),
  getStats: (clubId) => axiosClient.get(`/clubs/${clubId}/stats`),
};

export default clubService;
