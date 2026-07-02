import axiosClient from "../axiosClient";

/**
 * Event report — nộp và duyệt báo cáo sau sự kiện (Sprint 6 — BE-POST-*)
 *
 * Luồng:
 *   [Leader] submit() → [ICPDP] approve() hoặc reject() → [Leader] resubmit()
 *
 * Sự kiện phải ở trạng thái COMPLETED trước khi nộp báo cáo.
 */
const reportService = {

  // ── LEADER ────────────────────────────────────────────────────────
  // BE-POST-01: Lấy báo cáo hiện tại của sự kiện (nếu đã nộp)
  // GET /api/v1/events/:eventId/report
  getByEventId: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/report`),

  // BE-POST-02: Nộp báo cáo lần đầu (multipart: file PDF/DOCX + summary)
  // POST /api/v1/events/:eventId/report
  submit: (eventId, { file, summary }) => {
    const form = new FormData();
    form.append("file", file);
    if (summary) form.append("summary", summary);
    return axiosClient.post(`/v1/events/${eventId}/report`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // BE-POST-02: Nộp lại báo cáo sau khi bị từ chối
  // PATCH /api/v1/events/:eventId/report/resubmit
  resubmit: (eventId, { file, summary }) => {
    const form = new FormData();
    form.append("file", file);
    if (summary) form.append("summary", summary);
    return axiosClient.patch(`/v1/events/${eventId}/report/resubmit`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ── ICPDP ─────────────────────────────────────────────────────────
  // BE-POST-03: Lấy danh sách sự kiện có báo cáo chờ duyệt
  // GET /api/v1/icpdp/reports/pending
  getPendingReports: () =>
    axiosClient.get("/v1/icpdp/reports/pending"),

  // BE-POST-03: Phê duyệt báo cáo → event chuyển sang REPORT_APPROVED
  // PATCH /api/v1/events/:eventId/report/approve
  approve: (eventId) =>
    axiosClient.patch(`/v1/events/${eventId}/report/approve`),

  // BE-POST-03: Từ chối báo cáo → Leader phải nộp lại
  // PATCH /api/v1/events/:eventId/report/reject
  reject: (eventId, { reason }) =>
    axiosClient.patch(`/v1/events/${eventId}/report/reject`, { reason }),
};

export default reportService;
