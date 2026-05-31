import axiosClient from "./axiosClient";

const eventService = {
  // ── PUBLIC (GUEST xem được) ──────────────────────────────────

  // Lấy tất cả sự kiện công khai (trang chủ)
  getPublic: (params) => axiosClient.get("/events/public", { params }),

  // Chi tiết sự kiện công khai
  getPublicById: (eventId) => axiosClient.get(`/events/public/${eventId}`),

  // ── MEMBER ───────────────────────────────────────────────────

  // Đăng ký tham dự sự kiện
  register: (eventId) => axiosClient.post(`/events/${eventId}/register`),

  // Hủy đăng ký
  unregister: (eventId) => axiosClient.delete(`/events/${eventId}/register`),

  // Sự kiện mình đã đăng ký
  getMyEvents: (params) => axiosClient.get("/events/my", { params }),

  // ── CORE_TEAM trở lên ────────────────────────────────────────

  // Lấy tất cả sự kiện của CLB (bao gồm nội bộ, nháp)
  getByClub: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/events`, { params }),

  // Tạo sự kiện mới
  // isPublic: true → ai cũng thấy, false → chỉ thành viên CLB
  create: (clubId, payload) =>
    axiosClient.post(`/clubs/${clubId}/events`, payload),

  // Cập nhật sự kiện
  update: (clubId, eventId, payload) =>
    axiosClient.put(`/clubs/${clubId}/events/${eventId}`, payload),

  // Upload ảnh banner sự kiện
  uploadBanner: (clubId, eventId, file) => {
    const form = new FormData();
    form.append("banner", file);
    return axiosClient.post(`/clubs/${clubId}/events/${eventId}/banner`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Hủy sự kiện
  cancel: (clubId, eventId, reason) =>
    axiosClient.patch(`/clubs/${clubId}/events/${eventId}/cancel`, { reason }),

  // Xóa sự kiện (chỉ khi còn ở trạng thái nháp)
  delete: (clubId, eventId) =>
    axiosClient.delete(`/clubs/${clubId}/events/${eventId}`),

  // Lấy danh sách người đăng ký tham dự
  getAttendees: (clubId, eventId, params) =>
    axiosClient.get(`/clubs/${clubId}/events/${eventId}/attendees`, { params }),

  // Điểm danh (check-in) người tham dự
  checkIn: (clubId, eventId, memberId) =>
    axiosClient.patch(`/clubs/${clubId}/events/${eventId}/checkin/${memberId}`),
};

export default eventService;