import axiosClient from "../axiosClient";

const dashboardApi = {
  getDashboard: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/dashboard`, { params }),

  getWarnings: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/dashboard/warnings`, { params }),

  getEvaluations: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/evaluations`, { params }),

  createEvaluation: (clubId, payload) =>
    axiosClient.post(`/clubs/${clubId}/evaluations`, payload),

  updateEvaluation: (clubId, evaluationId, payload) =>
    axiosClient.put(`/clubs/${clubId}/evaluations/${evaluationId}`, payload),
};

export default dashboardApi;
