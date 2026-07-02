import axiosClient from "../axiosClient";

/**
 * Walk-in registration — đăng ký tại chỗ trong ngày sự kiện (Sprint 5 — BE-WALK-*)
 *
 * Luồng FPTU:
 *   searchFptu() → registerFptuWalkIn() → checkIn tự động
 *
 * Luồng Guest:
 *   registerGuestWalkIn() → BE gửi OTP → verifyGuestWalkInOtp() → checkIn tự động
 *
 * Luồng Emergency (Admin/ICPDP):
 *   emergencyOverride() → bypass capacity, checkIn ngay
 */
const walkInService = {

  // ── FPTU WALK-IN (BE-WALK-02) ─────────────────────────────────────
  // Tìm sinh viên FPTU theo MSSV (xem trước trước khi walk-in)
  // GET /api/v1/events/:eventId/walkin/fptu/search?studentId=
  searchFptu: (eventId, studentId) =>
    axiosClient.get(`/v1/events/${eventId}/walkin/fptu/search`, {
      params: { studentId },
    }),

  // Đăng ký walk-in cho sinh viên FPTU (classify → allocate → check-in)
  // POST /api/v1/events/:eventId/walkin/fptu
  registerFptuWalkIn: (eventId, { studentId }) =>
    axiosClient.post(`/v1/events/${eventId}/walkin/fptu`, { studentId }),

  // ── GUEST WALK-IN (BE-WALK-03) ────────────────────────────────────
  // Bước 1: Tạo đăng ký Guest walk-in → BE gửi OTP
  // POST /api/v1/events/:eventId/walkin/guest
  registerGuestWalkIn: (eventId, { fullName, email, phone }) =>
    axiosClient.post(`/v1/events/${eventId}/walkin/guest`, {
      fullName,
      email,
      phone,
    }),

  // Bước 2: Xác thực OTP → check-in ngay
  // POST /api/v1/events/:eventId/walkin/guest/verify
  verifyGuestWalkInOtp: (eventId, { email, otp }) =>
    axiosClient.post(`/v1/events/${eventId}/walkin/guest/verify`, { email, otp }),

  // ── EMERGENCY OVERRIDE (Admin/ICPDP — BE-WALK-04) ─────────────────
  // Bypass capacity limit, check-in ngay không cần xác thực
  // POST /api/v1/events/:eventId/walkin/override
  emergencyOverride: (eventId, { fullName, studentId, email, reason }) =>
    axiosClient.post(`/v1/events/${eventId}/walkin/override`, {
      fullName,
      studentId,
      email,
      reason,
    }),

  // ── LOG WALK-IN ───────────────────────────────────────────────────
  // Lấy danh sách walk-in trong ngày của sự kiện
  // GET /api/v1/events/:eventId/walkin/log
  getWalkInLog: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/walkin/log`),
};

export default walkInService;
