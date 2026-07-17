import axiosClient from "../axiosClient";

const recruitmentApi = {
  getAll: () =>
    axiosClient.get("/recruitments"),

  getById: (id) =>
    axiosClient.get(`/recruitments/${id}`),

  create: ({ title, questionsJson, startDate, endDate, semesterID, status }) =>
    axiosClient.post("/recruitments", { title, questionsJson, startDate, endDate, semesterID, status }),

  update: (id, { title, questionsJson, startDate, endDate, semesterID, status }) =>
    axiosClient.put(`/recruitments/${id}`, { title, questionsJson, startDate, endDate, semesterID, status }),

  delete: (id) =>
    axiosClient.delete(`/recruitments/${id}`),

  sendReminder: (id) =>
    axiosClient.post(`/recruitments/${id}/remind`),

  getByClub: (clubId) =>
    axiosClient.get(`/recruitments/club/${clubId}`),

  createForClub: (clubId, payload) =>
    axiosClient.post(`/recruitments/club/${clubId}`, payload),

  changeStatus: (id, status) =>
    axiosClient.patch(`/recruitments/${id}/status`, { status }),

  getSeasonClubs: (seasonId) =>
    axiosClient.get(`/recruitments/${seasonId}/clubs`),
};

export default recruitmentApi;
