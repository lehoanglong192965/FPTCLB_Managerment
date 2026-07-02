import axiosClient from "../axiosClient";

const eventService = {
  // PUBLIC
  getApprovedEvents: () => axiosClient.get("/v1/events/approved"),
  getEventById: (eventId) => axiosClient.get(`/v1/events/${eventId}`),
  getMyEventStatus: (eventId) => axiosClient.get(`/v1/events/${eventId}/my-status`),
  getMyAssignments: () => axiosClient.get("/v1/events/my-assignments"),

  // CLUB_LEADER / VICE_LEADER
  propose: (payload) => axiosClient.post("/v1/events", payload),
  update: (eventId, payload) => axiosClient.put(`/v1/events/${eventId}`, payload),
  submit: (eventId) => axiosClient.patch(`/v1/events/${eventId}/submit`),
  start: (eventId) => axiosClient.patch(`/v1/events/${eventId}/start`),
  finish: (eventId) => axiosClient.patch(`/v1/events/${eventId}/finish`),
  close: (eventId) => axiosClient.patch(`/v1/events/${eventId}/close`),
  openRegistration: (eventId) => axiosClient.patch(`/v1/events/${eventId}/open-registration`),
  closeRegistration: (eventId) => axiosClient.patch(`/v1/events/${eventId}/close-registration`),
  cancel: (clubId, eventId, reason) =>
    axiosClient.patch(`/v1/events/${clubId}/${eventId}/cancel`, { reason }),
  checkIn: (eventId, studentId) => axiosClient.post(`/v1/events/${eventId}/check-in/${studentId}`),
  getCheckedInAttendees: (eventId) => axiosClient.get(`/v1/events/${eventId}/check-in`),
  getContributions: (eventId) => axiosClient.get(`/v1/events/${eventId}/contributions`),
  saveContributions: (eventId, contributions) =>
    axiosClient.post(`/v1/events/${eventId}/contributions`, contributions),
  addAssignment: (eventId, assignment) => axiosClient.post(`/v1/events/${eventId}/assignments`, assignment),
  getAssignments: (eventId) => axiosClient.get(`/v1/events/${eventId}/assignments`),
  removeAssignment: (eventId, userId) => axiosClient.delete(`/v1/events/${eventId}/assignments/${userId}`),
  getReportUploadedEvents: () => axiosClient.get("/v1/events/report-uploaded"),
  getReportByEventId: (eventId) => axiosClient.get(`/v1/reports/event/${eventId}`),
  rejectReport: (eventId) => axiosClient.patch(`/v1/events/${eventId}/reject-report`),
  uploadReport: (eventId, summary, file) => {
    const form = new FormData();
    form.append("eventID", eventId);
    form.append("summary", summary);
    form.append("file", file);
    return axiosClient.post("/v1/reports", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ICPDP
  getPendingForIcpdp: () => axiosClient.get("/icpdp/events/pending"),
  getEventByIdForIcpdp: (eventId) => axiosClient.get(`/icpdp/events/${eventId}`),
  approveForIcpdp: (eventId) => axiosClient.patch(`/icpdp/events/${eventId}/approve`),
  rejectForIcpdp: (eventId, reason) =>
    axiosClient.patch(`/icpdp/events/${eventId}/reject`, { reason }),

  // MEMBER
  register: (eventId) => axiosClient.post(`/events/${eventId}/registrations/me`),
  registerGuest: (eventId, payload) => axiosClient.post(`/events/${eventId}/registrations/guest`, payload),
  registerWalkIn: (eventId, payload) => axiosClient.post(`/events/${eventId}/registrations/walk-in`, payload),
  getMyRegistrations: () => axiosClient.get("/registrations/me/events"),

  // Legacy compatibility while old screens still call eventId-based unregister.
  unregister: (eventId) => axiosClient.delete(`/event-registrations/unregister/${eventId}`),

  // New registration management API
  listRegistrations: (eventId, params = {}) =>
    axiosClient.get(`/events/${eventId}/registrations`, { params }),
  listPendingRegistrations: (eventId, params = {}) =>
    axiosClient.get(`/events/${eventId}/registrations/pending`, { params }),
  approveRegistration: (eventId, registrationId) =>
    axiosClient.post(`/events/${eventId}/registrations/${registrationId}/approve`),
  rejectRegistration: (eventId, registrationId, reason) =>
    axiosClient.post(`/events/${eventId}/registrations/${registrationId}/reject`, { reason }),
  cancelRegistration: (registrationId) =>
    axiosClient.post(`/registrations/${registrationId}/cancel`),
};

export default eventService;
