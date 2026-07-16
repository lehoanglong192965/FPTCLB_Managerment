import axiosClient from "../axiosClient";

const feedbackApi = {
  getPending: () =>
    axiosClient.get(`/events/pending-feedback`),

  checkEligibility: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/feedback/eligibility`),

  submit: (eventId, { registrationId, organizationRating, contentRating, logisticsRating, overallRating, comment }) =>
    axiosClient.post(`/events/${eventId}/feedback`, {
      ...(registrationId ? { registrationId } : {}),
      organizationRating,
      contentRating,
      logisticsRating,
      overallRating,
      comment,
    }),

  validateGuestToken: (token) =>
    axiosClient.get(`/v1/feedback/guest/${token}`),

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

  getSummary: (eventId) =>
    axiosClient.get(`/v1/events/${eventId}/feedback/summary`),

  getReport: (eventId) =>
    axiosClient.get(`/events/${eventId}/feedback-report`),
};

export default feedbackApi;
