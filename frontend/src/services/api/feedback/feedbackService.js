import axiosClient from "../axiosClient";

/**
 * Event feedback — đánh giá sự kiện sau khi kết thúc (Sprint 7 — BE-FDB-*)
 *
 * Hai loại người đánh giá:
 *   1. FPTU Member — đăng nhập, gọi API có Authorization header
 *   2. Guest       — truy cập qua secure token trong email (không cần đăng nhập)
 *
 * Điều kiện được đánh giá (BE-FDB-01):
 *   - Phải có attendance record với status PRESENT hoặc LATE
 *   - Chưa nộp feedback cho sự kiện này
 *   - Sự kiện phải ở trạng thái COMPLETED hoặc CLOSED
 *
 * Ghi chú điểm (BE-FDB-06):
 *   - Host members (ban tổ chức): KHÔNG được tính vào điểm external feedback
 *   - Nếu số lượng feedback < ngưỡng tối thiểu → INSUFFICIENT_SAMPLE (không tính 0)
 */
const feedbackService = {

  // ── FPTU MEMBER ───────────────────────────────────────────────────
  // BE-FDB-01: Kiểm tra điều kiện được đánh giá của user hiện tại
  // GET /api/v1/events/:eventId/feedback/eligibility
  checkEligibility: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/feedback/eligibility`),

  // BE-FDB-02: Nộp đánh giá (chỉ PRESENT/LATE mới được, Host bị loại khỏi điểm external)
  // POST /api/v1/events/:eventId/feedback
  // ratings: { organization, content, venue, overall } — mỗi cái 1-5
  submit: (eventId, { ratings, comment }) =>
    axiosClient.post(`/v1/events/${eventId}/feedback`, { ratings, comment }),

  // ── GUEST (truy cập bằng token từ email — BE-FDB-03/05) ───────────
  // Xác thực token trước khi hiện form
  // GET /api/v1/feedback/guest/:token
  validateGuestToken: (token) =>
    axiosClient.get(`/v1/feedback/guest/${token}`),

  // Nộp đánh giá Guest (không cần Authorization header)
  // POST /api/v1/feedback/guest/:token
  submitGuest: (token, { ratings, comment }) =>
    axiosClient.post(`/v1/feedback/guest/${token}`, { ratings, comment }),

  // ── LEADER / ICPDP — XEM TỔNG HỢP ───────────────────────────────
  // BE-FDB-07: Thống kê điểm đánh giá của sự kiện
  // GET /api/v1/events/:eventId/feedback/summary
  getSummary: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/feedback/summary`),
};

export default feedbackService;
