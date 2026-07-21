import axiosClient from "../axiosClient";

// GuestRegistrationController is at /api (not /api/v1), so paths have no /v1/ prefix.
// baseURL = http://localhost:8080/api, so /events/... → http://localhost:8080/api/events/...
const guestApi = {

  // POST /api/events/{eventId}/guest-registrations
  // GuestRegistrationRequest: fullName, email, phone, schoolOrOrganization, consent (@AssertTrue), discoverySource (@NotBlank)
  register: (eventId, { fullName, email, phone, schoolOrOrganization, discoverySource = 'EVENT_PAGE', consent = true }) =>
    axiosClient.post(`/events/${eventId}/guest-registrations`, {
      fullName, email, phone, schoolOrOrganization, discoverySource, consent,
    }),

  // POST /api/guest-registrations/{guestReference}/verify-otp
  // GuestOtpVerifyRequest: otp (@NotBlank, size 4-12)
  verifyOtp: (guestReference, { otp }) =>
    axiosClient.post(`/guest-registrations/${guestReference}/verify-otp`, { otp }),

  // POST /api/guest-registrations/{guestReference}/resend-otp  (no request body)
  resendOtp: (guestReference) =>
    axiosClient.post(`/guest-registrations/${guestReference}/resend-otp`),

  // GET /api/guest-registrations/{guestReference}
  getStatus: (guestReference) =>
    axiosClient.get(`/guest-registrations/${guestReference}`),

  // POST /api/guest-registrations/{guestReference}/cancel  (not DELETE)
  cancel: (guestReference, reason) =>
    axiosClient.post(`/guest-registrations/${guestReference}/cancel`, { reason }),
};

export default guestApi;
