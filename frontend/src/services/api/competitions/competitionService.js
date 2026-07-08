import axiosClient from "../axiosClient";

/**
 * Club Competition — cuộc thi CLB xuất sắc theo học kỳ (Sprint 8 — BE-COMP-*)
 *
 * Luồng:
 *   [ICPDP] create() → calculate() (tính 5 nhóm điểm) → approve() → publish()
 *
 * 5 nhóm điểm (tổng 100 điểm):
 *   - ActivityScore      25đ  (BE-COMP-02) — số lượng & chất lượng sự kiện
 *   - FeedbackScore      20đ  (BE-COMP-03) — điểm đánh giá external (cap 10đ)
 *   - ParticipationScore 15đ  (BE-COMP-04) — tỷ lệ tham gia thực tế
 *   - EngagementScore    25đ  (BE-COMP-05) — đóng góp thành viên (trừ Leader/Vice)
 *   - ComplianceScore    15đ  (BE-COMP-06) — nộp báo cáo đúng hạn
 *
 * Tie-break (BE-COMP-09): ActivityScore → FeedbackScore → ParticipationScore
 */
const competitionService = {

  // ── DANH SÁCH & CHI TIẾT ─────────────────────────────────────────
  // BE-COMP-01: Lấy danh sách cuộc thi (ICPDP)
  // GET /api/v1/competitions
  getAll: () =>
    axiosClient.get("/v1/competitions"),

  // BE-COMP-01: Chi tiết cuộc thi kèm bảng điểm
  // GET /api/v1/competitions/:competitionId
  getById: (competitionId) =>
    axiosClient.get(`/v1/competitions/${competitionId}`),

  // Public: Xem bảng xếp hạng đã công bố
  // GET /api/v1/competitions/:competitionId/ranking
  getPublicRanking: (competitionId) =>
    axiosClient.get(`/v1/competitions/${competitionId}/ranking`),

  // ── ICPDP — QUẢN LÝ ──────────────────────────────────────────────
  // BE-COMP-01: Tạo cuộc thi mới (gắn với học kỳ)
  // POST /api/v1/competitions
  create: ({ title, semesterId, description }) =>
    axiosClient.post("/v1/competitions", { title, semesterId, description }),

  // BE-COMP-01: Cập nhật thông tin cuộc thi (chỉ khi còn Draft)
  // PUT /api/v1/competitions/:competitionId
  update: (competitionId, { title, description }) =>
    axiosClient.put(`/v1/competitions/${competitionId}`, { title, description }),

  // BE-COMP-08: Kích hoạt tính điểm (transaction, tính cả 5 nhóm)
  // POST /api/v1/competitions/:competitionId/calculate
  calculate: (competitionId) =>
    axiosClient.post(`/v1/competitions/${competitionId}/calculate`),

  // BE-COMP-10: Phê duyệt kết quả (chuyển sang Approved)
  // PATCH /api/v1/competitions/:competitionId/approve
  approve: (competitionId) =>
    axiosClient.patch(`/v1/competitions/${competitionId}/approve`),

  // BE-COMP-10: Công bố kết quả (chuyển sang Published, gửi thông báo)
  // POST /api/v1/competitions/:competitionId/publish
  publish: (competitionId) =>
    axiosClient.post(`/v1/competitions/${competitionId}/publish`),

  // Khoá cuộc thi (chuyển sang Closed)
  // PATCH /api/v1/competitions/:competitionId/close
  close: (competitionId) =>
    axiosClient.patch(`/v1/competitions/${competitionId}/close`),

  // ── GIẢI THƯỞNG (BE-COMP-11) ─────────────────────────────────────
  // Lấy danh sách người nhận giải thưởng (Leader/Vice của CLB xếp hạng cao)
  // GET /api/v1/competitions/:competitionId/awards
  getAwards: (competitionId) =>
    axiosClient.get(`/v1/competitions/${competitionId}/awards`),

  // ── ĐIỂM THÀNH PHẦN (debug/detail) ───────────────────────────────
  // Lấy điểm chi tiết theo từng nhóm của một CLB
  // GET /api/v1/competitions/:competitionId/clubs/:clubId/scores
  getClubScoreDetail: (competitionId, clubId) =>
    axiosClient.get(`/v1/competitions/${competitionId}/clubs/${clubId}/scores`),
};

export default competitionService;
