import axiosClient from "../axiosClient";

/**
 * Event feedback — đánh giá sự kiện sau khi kết thúc (Sprint 7 — BE-FDB-*)
 *
 * FeedbackSubmitRequest fields (tất cả @NotNull trừ comment):
 *   registrationId/guestRegistrationId, contentRating, organizationRating, logisticsRating, overallRating, comment
 */
const feedbackService = {

  // ── FPTU MEMBER ───────────────────────────────────────────────────
  // GET /api/v1/events/:eventId/feedback/eligibility
  // Response: { eligible, eventId, registrationId, reason }
  checkEligibility: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/feedback/eligibility`),

  // POST /api/v1/events/:eventId/feedback
  submit: (eventId, { registrationId, organizationRating, contentRating, logisticsRating, overallRating, comment }) =>
    axiosClient.post(`/v1/events/${eventId}/feedback`, {
      registrationId,
      organizationRating,
      contentRating,
      logisticsRating,
      overallRating,
      comment,
    }),

  // ── GUEST (token từ email) ───────────────────────────────────────
  // GET /api/v1/feedback/guest/:token
  // Response: { valid, eventId, registrationId, guestRegistrationId, expiresAt, reason }
  validateGuestToken: (token) =>
    axiosClient.get(`/v1/feedback/guest/${token}`),

  // POST /api/v1/feedback/guest/:token
  submitGuest: (token, { registrationId, guestRegistrationId, organizationRating, contentRating, logisticsRating, overallRating, comment }) =>
    axiosClient.post(`/v1/feedback/guest/${token}`, {
      registrationId,
      guestRegistrationId,
      organizationRating,
      contentRating,
      logisticsRating,
      overallRating,
      comment,
    }),

  // ── LEADER / ICPDP ───────────────────────────────────────────────
  // GET /api/v1/events/:eventId/feedback/summary
  getSummary: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/feedback/summary`),
};

export default feedbackService;
