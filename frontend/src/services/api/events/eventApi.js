import axiosClient from "../axiosClient";

const eventApi = {
  // PUBLIC
  getApprovedEvents: () => axiosClient.get("/v1/events/approved"),
  getPublicEventsIncludingCompleted: () => axiosClient.get("/v1/events/public-list"),
  getEventById: (eventId) => axiosClient.get(`/v1/events/${eventId}`),
  // CLUB_LEADER / VICE_LEADER — trả đủ trường quản lý (maxParticipants, budget, cửa sổ đăng ký/điểm danh...)
  getManagedEventById: (eventId) => axiosClient.get(`/v1/events/${eventId}/manage`),
  getMyEventStatus: (eventId) => axiosClient.get(`/v1/events/${eventId}/my-status`),
  getMyAssignments: () => axiosClient.get("/v1/events/my-assignments"),

  // CLUB_LEADER / VICE_LEADER
  propose: (payload) => axiosClient.post("/v1/events", payload),
  update: (eventId, payload) => axiosClient.put(`/v1/events/${eventId}`, payload),
  // Xóa mềm sự kiện ở trạng thái Draft/Rejected (chỉ người tạo)
  deleteDraft: (eventId) => axiosClient.delete(`/v1/events/${eventId}`),
  submit: (eventId) => axiosClient.patch(`/v1/events/${eventId}/submit`),
  start: (eventId) => axiosClient.patch(`/v1/events/${eventId}/start`),
  finish: (eventId) => axiosClient.patch(`/v1/events/${eventId}/finish`),
  close: (eventId) => axiosClient.patch(`/v1/events/${eventId}/close`),
  openRegistration: (eventId) => axiosClient.patch(`/v1/events/${eventId}/open-registration`),
  closeRegistration: (eventId) => axiosClient.patch(`/v1/events/${eventId}/close-registration`),
  cancel: (clubId, eventId, reason) =>
    axiosClient.patch(`/v1/events/${clubId}/${eventId}/cancel`, { reason }),
  checkIn: (eventId, studentId) => axiosClient.post(`/v1/events/${eventId}/check-in/${studentId}`),
  getCheckedInAttendees: (eventId) => axiosClient.get(`/v1/events/${eventId}/check-in`),
  getContributions: (eventId) => axiosClient.get(`/v1/events/${eventId}/contributions`),
  saveContributions: (eventId, contributions) =>
    axiosClient.post(`/v1/events/${eventId}/contributions`, contributions),
  addAssignment: (eventId, assignment) => axiosClient.post(`/v1/events/${eventId}/assignments`, assignment),
  getAssignments: (eventId) => axiosClient.get(`/v1/events/${eventId}/assignments`),
  removeAssignment: (eventId, userId) => axiosClient.delete(`/v1/events/${eventId}/assignments/${userId}`),
  getReportUploadedEvents: () => axiosClient.get("/v1/events/report-uploaded"),
  // Lịch sử báo cáo đã duyệt/từ chối (REPORT_APPROVED, REPORT_REJECTED + các trạng thái sau duyệt)
  getReportReviewedEvents: () => axiosClient.get("/v1/events/report-reviewed"),
  getReportByEventId: (eventId) => axiosClient.get(`/v1/reports/event/${eventId}`),
  rejectReport: (eventId, reason) => axiosClient.patch(`/v1/events/${eventId}/reject-report`, { reason }),
  uploadBanner: (eventId, file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", "event-banner");
    return axiosClient.post("/uploads/card-image", form);
  },

  uploadReport: (eventId, summary, file) => {
    const form = new FormData();
    form.append("eventID", eventId);
    form.append("summary", summary);
    form.append("file", file);
    return axiosClient.post("/v1/reports", form);
  },

  // ICPDP
  getPendingForIcpdp: () => axiosClient.get("/icpdp/events/pending"),
  // Lịch sử đã duyệt cho ICPDP — bao gồm cả sự kiện đã kết thúc (khác /v1/events/approved của trang chủ)
  getApprovedForIcpdp: () => axiosClient.get("/icpdp/events/approved"),
  // Toàn bộ vòng đời sự kiện (kể cả CANCELLED) — dùng cho trang tổng quan Quản Lý Sự Kiện
  getAllForIcpdp: () => axiosClient.get("/icpdp/events/all"),
  getRejectedForIcpdp: () => axiosClient.get("/icpdp/events/rejected"),
  getEventByIdForIcpdp: (eventId) => axiosClient.get(`/icpdp/events/${eventId}`),
  approveForIcpdp: (eventId) => axiosClient.patch(`/icpdp/events/${eventId}/approve`),
  rejectForIcpdp: (eventId, reason) =>
    axiosClient.patch(`/icpdp/events/${eventId}/reject`, { reason }),

  // MEMBER
  register: (eventId) => axiosClient.post(`/events/${eventId}/registrations/me`),
  registerGuest: (eventId, payload) => axiosClient.post(`/events/${eventId}/registrations/guest`, payload),
  registerWalkIn: (eventId, payload) => axiosClient.post(`/events/${eventId}/registrations/walk-in`, payload),
  // Member ticket details, including the static ticket eligibility flag.
  getMyRegistrationDetails: () => axiosClient.get("/registrations/me"),
  getMyRegistrations: () => axiosClient.get("/registrations/me/events"),

  // Registration and attendance exports
  exportRegistrations: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/registrations/export`, { responseType: "blob" }),
  exportAttendance: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/attendance/export`, { responseType: "blob" }),

  // Registration management
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
  cancelGuestRegistration: (eventId, guestRegistrationId) =>
    axiosClient.post(`/events/${eventId}/registrations/guest/${guestRegistrationId}/cancel`),
};

export default eventApi;
