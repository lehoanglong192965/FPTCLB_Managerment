import axiosClient from "../axiosClient";

/**
 * Contribution & Appeal — đánh giá đóng góp thành viên sau sự kiện (Sprint 6 — BE-CON-*)
 *
 * Actual BE endpoints (confirmed from ContributionBatchController + EventController):
 *   GET  /api/v1/events/:eventId/contributions                    → getContributionScores
 *   POST /api/v1/events/:eventId/contributions                    → saveContributionScores
 *   GET  /api/v1/events/:eventId/contribution-batch               → getBatchByEvent
 *   POST /api/v1/events/:eventId/contribution-batch/open-appeal   → openAppealWindow
 *   POST /api/v1/events/:eventId/contribution-batch/finalize      → finalizeBatch
 *   GET  /api/v1/contribution-batches/:batchId/appeals            → getAppeals
 *   POST /api/v1/contribution-batches/:batchId/appeals            → createAppeal
 *   PATCH /api/v1/contribution-appeals/:appealId/resolve          → resolveAppeal
 *
 * Note: appeals use batchId/appealId, NOT eventId/userId.
 */
const contributionApi = {

  // ── MEMBER — ĐÓNG GÓP CỦA TÔI ─────────────────────────────────
  getMine: () =>
    axiosClient.get('/v1/contributions/me'),

  getMyEventContribution: (eventId) =>
    axiosClient.get('/v1/events/' + eventId + '/contribution/me'),

  // ── LEADER — DANH SÁCH & CẬP NHẬT ─────────────────────────────────
  // GET /api/v1/events/:eventId/contributions
  getDraft: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/contributions`),

  // POST /api/v1/events/:eventId/contributions  (backend uses POST, not PUT)
  // payload: [{ userId, tier, rationale }]
  update: (eventId, contributions) =>
    axiosClient.post(`/v1/events/${eventId}/contributions`, contributions),

  // ── BATCH LIFECYCLE ────────────────────────────────────────────────
  // GET /api/v1/events/:eventId/contribution-batch
  // Response: ContributionBatchResponse { batchID, status, appealOpenedAt, appealClosesAt, ... }
  getBatch: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/contribution-batch`),

  // POST /api/v1/events/:eventId/contribution-batch/open-appeal
  openAppealWindow: (eventId) =>
    axiosClient.post(`/v1/events/${eventId}/contribution-batch/open-appeal`),

  // POST /api/v1/events/:eventId/contribution-batch/finalize
  finalize: (eventId) =>
    axiosClient.post(`/v1/events/${eventId}/contribution-batch/finalize`),

  // ── MEMBER — KHÁNG CÁO (cần batchId từ getBatch trước) ───────────
  // POST /api/v1/contribution-batches/:batchId/appeals
  // payload: { reason }
  submitAppeal: (batchId, { reason }) =>
    axiosClient.post(`/v1/contribution-batches/${batchId}/appeals`, { reason }),

  // ── LEADER/ICPDP — XỬ LÝ KHÁNG CÁO ──────────────────────────────
  // GET /api/v1/contribution-batches/:batchId/appeals
  getAppeals: (batchId) =>
    axiosClient.get(`/v1/contribution-batches/${batchId}/appeals`),

  // PATCH /api/v1/contribution-appeals/:appealId/resolve
  // payload: { status: 'ACCEPTED'|'REJECTED', resolutionNote, contributionType?, leaderEvaluation? }
  resolveAppeal: (appealId, payload) =>
    axiosClient.patch(`/v1/contribution-appeals/${appealId}/resolve`, payload),
};

export default contributionApi;
