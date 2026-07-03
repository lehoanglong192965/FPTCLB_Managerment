import axiosClient from "../axiosClient";

// WalkInController: /api/v1/attendance-sessions/{sessionId}/walk-ins
// All methods require sessionId (not eventId).
const walkInService = {

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

  // POST /api/v1/attendance-sessions/{sessionId}/walk-ins/guest/emergency-override
  // WalkInGuestEmergencyOverrideRequest extends GuestRegistrationRequest + reason (@NotBlank) + note
  emergencyOverride: (sessionId, { fullName, email, phone, schoolOrOrganization, discoverySource = 'WALK_IN', consent = true, reason, note }) =>
    axiosClient.post(`/v1/attendance-sessions/${sessionId}/walk-ins/guest/emergency-override`, {
      fullName, email, phone, schoolOrOrganization, discoverySource, consent, reason, note,
    }),
};

export default walkInService;
