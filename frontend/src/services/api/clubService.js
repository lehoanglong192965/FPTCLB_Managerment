import axiosClient from "./axiosClient";

const clubService = {
  // ── PUBLIC (GUEST xem được) ──────────────────────────────────

  // Lấy danh sách tất cả CLB (có filter, search, phân trang)
  // Ví dụ: getAll({ page: 1, limit: 10, search: "âm nhạc", category: "arts" })
  getAll: (params) => axiosClient.get("/clubs", { params }),

  // Lấy chi tiết 1 CLB theo id
  getById: (clubId) => axiosClient.get(`/clubs/${clubId}`),

  // Lấy danh sách sự kiện công khai của CLB
  getPublicEvents: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/events/public`, { params }),

  // ── MEMBER (Đã đăng nhập) ────────────────────────────────────

  // Đăng ký tham gia CLB
  join: (clubId) => axiosClient.post(`/clubs/${clubId}/join`),

  // Rời CLB
  leave: (clubId) => axiosClient.post(`/clubs/${clubId}/leave`),

  // Xem CLB mình đang tham gia
  getMyClubs: () => axiosClient.get("/clubs/my"),

  // ── CLUB_LEADER / VICE_LEADER / CORE_TEAM ───────────────────

  // Tạo CLB mới (chỉ CLUB_MANAGER hoặc ADMIN mới duyệt)
  create: (payload) => axiosClient.post("/clubs", payload),

  // Cập nhật thông tin CLB
  update: (clubId, payload) => axiosClient.put(`/clubs/${clubId}`, payload),

  // Upload ảnh bìa / logo CLB
  uploadCover: (clubId, file) => {
    const form = new FormData();
    form.append("cover", file);
    return axiosClient.post(`/clubs/${clubId}/cover`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Xem tất cả sự kiện của CLB (bao gồm nội bộ)
  getAllEvents: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/events`, { params }),

  // ── CLUB_MANAGER / ADMIN ─────────────────────────────────────

  // Duyệt hoặc từ chối CLB mới
  // status: "approved" | "rejected"
  review: (clubId, { status, reason }) =>
    axiosClient.patch(`/clubs/${clubId}/review`, { status, reason }),

  // Xóa CLB (chỉ ADMIN)
  delete: (clubId) => axiosClient.delete(`/clubs/${clubId}`),

  // Lấy thống kê tổng quan CLB
  getStats: (clubId) => axiosClient.get(`/clubs/${clubId}/stats`),
};

export default clubService;