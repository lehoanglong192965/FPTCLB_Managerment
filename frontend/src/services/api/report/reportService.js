import axiosClient from "../axiosClient";

// ReportController: /api/v1/reports
// ContributionBatchController handles approve-report, EventController handles reject-report
const reportService = {

  // ── LEADER ────────────────────────────────────────────────────────
  // GET /api/v1/reports/event/{eventId}
  getByEventId: (eventId) =>
    axiosClient.get(`/v1/reports/event/${eventId}`),

  // POST /api/v1/reports  (multipart/form-data)
  // CreateEventReportRequest: eventID (Integer @NotNull), summary (@NotBlank, max 1000), file (MultipartFile @NotNull)
  submit: (eventId, { file, summary }) => {
    const form = new FormData();
    form.append('eventID', eventId);
    form.append('summary', summary ?? '');
    form.append('file', file);
    return axiosClient.post('/v1/reports', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // No separate resubmit endpoint — reuse POST /api/v1/reports
  resubmit: (eventId, { file, summary }) => {
    const form = new FormData();
    form.append('eventID', eventId);
    form.append('summary', summary ?? '');
    form.append('file', file);
    return axiosClient.post('/v1/reports', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ── ICPDP ─────────────────────────────────────────────────────────
  // PATCH /api/v1/events/{eventId}/approve-report  (ContributionBatchController)
  approve: (eventId) =>
    axiosClient.patch(`/v1/events/${eventId}/approve-report`),

  // PATCH /api/v1/events/{eventId}/reject-report  (EventController, no request body)
  reject: (eventId) =>
    axiosClient.patch(`/v1/events/${eventId}/reject-report`),
};

export default reportService;
