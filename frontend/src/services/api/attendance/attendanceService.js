import axiosClient from "../axiosClient";

/**
 * Attendance session & check-in (Sprint 5 — BE-ATT-*)
 *
 * Luồng session:
 *   createSession() → openSession() → [checkIn() nhiều lần] → closeSession()
 *   closeSession() → BE tự đánh dấu ABSENT những ai chưa checkIn
 */
const attendanceService = {

  // ── SESSION MANAGEMENT (Leader/Staff) ─────────────────────────────
  // BE-ATT-01: Tạo phiên điểm danh mới cho sự kiện
  // POST /api/v1/events/:eventId/sessions
  createSession: (eventId, { sessionName }) =>
    axiosClient.post(`/v1/events/${eventId}/sessions`, { sessionName }),

  // BE-ATT-01: Lấy danh sách phiên của sự kiện
  // GET /api/v1/events/:eventId/sessions
  getSessions: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/sessions`),

  // BE-ATT-02: Mở phiên (chuyển sang OPEN, cho phép check-in)
  // PATCH /api/v1/events/:eventId/sessions/:sessionId/open
  openSession: (eventId, sessionId) =>
    axiosClient.patch(`/v1/events/${eventId}/sessions/${sessionId}/open`),

  // BE-ATT-02: Đóng phiên → BE tự đánh ABSENT
  // PATCH /api/v1/events/:eventId/sessions/:sessionId/close
  closeSession: (eventId, sessionId) =>
    axiosClient.patch(`/v1/events/${eventId}/sessions/${sessionId}/close`),

  // ── TÌM KIẾM NGƯỜI THAM DỰ (Staff dùng khi check-in) ─────────────
  // BE-ATT-03: Tìm kiếm theo tên / MSSV / số điện thoại cuối 4 số (Guest)
  // GET /api/v1/events/:eventId/sessions/:sessionId/participants?q=
  searchParticipants: (eventId, sessionId, query) =>
    axiosClient.get(`/v1/events/${eventId}/sessions/${sessionId}/participants`, {
      params: { q: query },
    }),

  // BE-ATT-04: Xem trước thông tin đăng ký (read-only, trước khi check-in)
  // GET /api/v1/events/:eventId/registrations/:registrationId/preview
  previewRegistration: (eventId, registrationId) =>
    axiosClient.get(`/v1/events/${eventId}/registrations/${registrationId}/preview`),

  // ── CHECK-IN ──────────────────────────────────────────────────────
  // BE-ATT-06: Check-in FPTU (chỉ CONFIRMED mới được check-in)
  // POST /api/v1/events/:eventId/sessions/:sessionId/check-in
  checkIn: (eventId, sessionId, { registrationId, method }) =>
    axiosClient.post(`/v1/events/${eventId}/sessions/${sessionId}/check-in`, {
      registrationId,
      method, // "MANUAL" | "SCAN"
    }),

  // BE-ATT-07: Check-in Guest (xác thực 4 số cuối SĐT)
  // POST /api/v1/events/:eventId/sessions/:sessionId/check-in/guest
  checkInGuest: (eventId, sessionId, { guestRef, phoneLast4 }) =>
    axiosClient.post(`/v1/events/${eventId}/sessions/${sessionId}/check-in/guest`, {
      guestRef,
      phoneLast4,
    }),

  // ── THỐNG KÊ & CHỈNH SỬA ─────────────────────────────────────────
  // BE-ATT-09: Tổng hợp điểm danh của phiên
  // GET /api/v1/events/:eventId/sessions/:sessionId/summary
  getSessionSummary: (eventId, sessionId) =>
    axiosClient.get(`/v1/events/${eventId}/sessions/${sessionId}/summary`),

  // BE-ATT-09: Tổng hợp điểm danh toàn bộ sự kiện
  // GET /api/v1/events/:eventId/attendance/summary
  getEventAttendanceSummary: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/attendance/summary`),

  // BE-ATT-11: Chỉnh sửa kết quả điểm danh (Leader/ICPDP + ghi audit)
  // PATCH /api/v1/events/:eventId/sessions/:sessionId/records/:recordId/correct
  correctAttendance: (eventId, sessionId, recordId, { status, reason }) =>
    axiosClient.patch(
      `/v1/events/${eventId}/sessions/${sessionId}/records/${recordId}/correct`,
      { status, reason }
    ),
};

export default attendanceService;
