import axiosClient from "../axiosClient";

// WalkInController: /api/v1/attendance-sessions/{sessionId}/walk-ins
// All methods require sessionId (not eventId).
const walkInApi = {

  // POST /api/v1/attendance-sessions/{sessionId}/walk-ins/fptu
  // WalkInFptuRequest: studentIdOrEmail (@NotBlank)
  registerFptuWalkIn: (sessionId, { studentIdOrEmail }) =>
    axiosClient.post(`/v1/attendance-sessions/${sessionId}/walk-ins/fptu`, { studentIdOrEmail }),

  // POST /api/v1/attendance-sessions/{sessionId}/walk-ins/guest
  // GuestRegistrationRequest: fullName, email, phone, schoolOrOrganization, consent (@AssertTrue), discoverySource (@NotBlank)
  registerGuestWalkIn: (sessionId, { fullName, email, phone, schoolOrOrganization, discoverySource = 'WALK_IN', consent = true }) =>
    axiosClient.post(`/v1/attendance-sessions/${sessionId}/walk-ins/guest`, {
      fullName, email, phone, schoolOrOrganization, discoverySource, consent,
    }),
};

export default walkInApi;
