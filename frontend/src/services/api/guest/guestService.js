import axiosClient from "../axiosClient";

/**
 * Guest OTP registration flow (Sprint 4 — BE-GST-*)
 *
 * Luồng:
 *   register() → sendOtp() (BE tự gửi sau register) → verifyOtp() → CONFIRMED
 *                                                    ↗ resendOtp() nếu hết hạn
 */
const guestService = {

  // ── ĐĂNG KÝ ──────────────────────────────────────────────────────
  // BE-GST-05: Tạo đăng ký Guest, trạng thái PENDING_VERIFICATION, BE tự gửi OTP qua email
  // POST /api/v1/guest/register
  register: (eventId, { fullName, email, phone }) =>
    axiosClient.post("/v1/guest/register", { eventId, fullName, email, phone }),

  // ── XÁC THỰC OTP ─────────────────────────────────────────────────
  // BE-GST-08: Xác thực OTP → chuyển sang CONFIRMED hoặc WAITLISTED
  // POST /api/v1/guest/verify-otp
  verifyOtp: ({ email, otp }) =>
    axiosClient.post("/v1/guest/verify-otp", { email, otp }),

  // BE-GST-09: Gửi lại OTP (có giới hạn số lần)
  // POST /api/v1/guest/resend-otp
  resendOtp: ({ email, eventId }) =>
    axiosClient.post("/v1/guest/resend-otp", { email, eventId }),

  // ── XEM TRẠNG THÁI ───────────────────────────────────────────────
  // BE-GST-09: Xem trạng thái đăng ký theo guestReference
  // GET /api/v1/guest/status/:ref
  getStatus: (guestRef) =>
    axiosClient.get(`/v1/guest/status/${guestRef}`),

  // ── HUỶ ĐĂNG KÝ ──────────────────────────────────────────────────
  // BE-GST-09: Huỷ đăng ký (trước khi sự kiện bắt đầu)
  // DELETE /api/v1/guest/cancel/:ref
  cancel: (guestRef) =>
    axiosClient.delete(`/v1/guest/cancel/${guestRef}`),
};

export default guestService;
