import axiosClient from "./api/axiosClient";

const memberService = {
  getAll: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/members`, { params }),

  getById: (clubId, memberId) =>
    axiosClient.get(`/clubs/${clubId}/members/${memberId}`),

  approve: (clubId, memberId) =>
    axiosClient.patch(`/clubs/${clubId}/members/${memberId}/approve`),

  reject: (clubId, memberId, reason) =>
    axiosClient.patch(`/clubs/${clubId}/members/${memberId}/reject`, { reason }),

  setRole: (clubId, memberId, newRole) =>
    axiosClient.patch(`/clubs/${clubId}/members/${memberId}/role`, { role: newRole }),

  invite: (clubId, email) =>
    axiosClient.post(`/clubs/${clubId}/members/invite`, { email }),

  remove: (clubId, memberId) =>
    axiosClient.delete(`/clubs/${clubId}/members/${memberId}`),

  getPendingRequests: (clubId) =>
    axiosClient.get(`/clubs/${clubId}/members/pending`),
};

export default memberService;
