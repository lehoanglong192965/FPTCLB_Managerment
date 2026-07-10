import axiosClient from "../axiosClient";

const clubService = {
  // ── PUBLIC ──────────────────────────────────────────────────────
  // Backend: GET /api/clubs (danh sách club đang hoạt động, không cần đăng nhập)
  getAllPublic: (params) => axiosClient.get("/clubs", { params }),
  // Backend: GET /api/clubs/{clubCode}
  getByIdPublic: (clubCode) => axiosClient.get(`/clubs/${clubCode}`),
  getAll: (params) => axiosClient.get("/clubs", { params }),
  getById: (clubId) => axiosClient.get(`/clubs/id/${clubId}`),
  getPublicEvents: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/events/public`, { params }),
  getMemberRankings: (clubId) =>
    axiosClient.get(`/clubs/${clubId}/rankings/members`),

  // ── MEMBER ──────────────────────────────────────────────────────
  join: (clubId) => axiosClient.post(`/clubs/${clubId}/join`),
  leave: (clubId) => axiosClient.post(`/clubs/${clubId}/leave`),
  getMyClubs: () => axiosClient.get("/clubs/my"),

  // ── UPLOAD ──────────────────────────────────────────────────────
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return axiosClient.post("/uploads/card-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

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
  getAllForManagement: () => axiosClient.get("/v1/clubs/management"),
  review: (clubId, { status, reason }) =>
    axiosClient.patch(`/clubs/${clubId}/review`, { status, reason }),
  delete: (clubId) => axiosClient.delete(`/clubs/${clubId}`),
  getStats: (clubId) => axiosClient.get(`/clubs/${clubId}/stats`),
};

export default clubService;
