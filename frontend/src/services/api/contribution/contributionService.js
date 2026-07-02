import axiosClient from "../axiosClient";

/**
 * Contribution & Appeal — đánh giá đóng góp thành viên sau sự kiện (Sprint 6 — BE-CON-*)
 *
 * Luồng:
 *   [Leader] getDraft() → update() → finalize()
 *     → APPEAL_WINDOW (24h) → [Member] submitAppeal()
 *       → [Leader] processAppeal() HOẶC hết 24h (BE-CON-08 scheduler tự đóng)
 *         → [ICPDP nếu cần] emergencyOverride()
 *
 * Chú ý:
 * - Chỉ Host (người được phân công) mới có trong danh sách contribution
 * - Leader không được tự đánh giá bản thân (BE-CON-04 guard)
 * - Sau CLOSED không được sửa (BE-CON-11)
 */
const contributionService = {

  // ── LEADER — TẠO & CHỈNH SỬA ──────────────────────────────────────
  // BE-CON-01: Lấy danh sách contribution draft (Host eligible only)
  // GET /api/v1/events/:eventId/contributions
  getDraft: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/contributions`),

  // BE-CON-03: Cập nhật tier và ghi chú cho từng người
  // PUT /api/v1/events/:eventId/contributions
  // payload: [{ userId, tier, rationale }]
  update: (eventId, contributions) =>
    axiosClient.put(`/v1/events/${eventId}/contributions`, contributions),

  // BE-CON-05: Khoá đánh giá → bắt đầu APPEAL_WINDOW 24h
  // PATCH /api/v1/events/:eventId/contributions/finalize
  finalize: (eventId) =>
    axiosClient.patch(`/v1/events/${eventId}/contributions/finalize`),

  // ── MEMBER — KHÁNG CÁO ────────────────────────────────────────────
  // BE-CON-06: Nộp kháng cáo trong 24h kể từ khi finalize
  // POST /api/v1/events/:eventId/contributions/appeal
  submitAppeal: (eventId, { reason }) =>
    axiosClient.post(`/v1/events/${eventId}/contributions/appeal`, { reason }),

  // Xem trạng thái kháng cáo của bản thân
  // GET /api/v1/events/:eventId/contributions/appeal/my
  getMyAppeal: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/contributions/appeal/my`),

  // ── LEADER — XỬ LÝ KHÁNG CÁO ─────────────────────────────────────
  // BE-CON-07: Xem tất cả kháng cáo của sự kiện
  // GET /api/v1/events/:eventId/contributions/appeals
  getAppeals: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/contributions/appeals`),

  // BE-CON-07: Chấp nhận hoặc từ chối kháng cáo của một thành viên
  // PATCH /api/v1/events/:eventId/contributions/:userId/appeal/process
  processAppeal: (eventId, userId, { isAccepted, newTier, reason }) =>
    axiosClient.patch(
      `/v1/events/${eventId}/contributions/${userId}/appeal/process`,
      { isAccepted, newTier, reason }
    ),

  // ── ICPDP — OVERRIDE KHẨN CẤP (BE-CON-09) ────────────────────────
  // Ghi đè kết quả sau khi CLOSED (cần lý do rõ ràng)
  // PATCH /api/v1/events/:eventId/contributions/override
  emergencyOverride: (eventId, { userId, newTier, reason }) =>
    axiosClient.patch(`/v1/events/${eventId}/contributions/override`, {
      userId,
      newTier,
      reason,
    }),
};

export default contributionService;
