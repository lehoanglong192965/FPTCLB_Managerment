import axiosClient from "../../../services/api/axiosClient";

const recruitmentApi = {
  getAll: () =>
    axiosClient.get("/recruitments"),

  getById: (id) =>
    axiosClient.get(`/recruitments/${id}`),

  create: ({ title, questionsJson, startDate, status }) =>
    axiosClient.post("/recruitments", { title, questionsJson, startDate, status }),

  update: (id, { title, questionsJson, startDate, status }) =>
    axiosClient.put(`/recruitments/${id}`, { title, questionsJson, startDate, status }),

  delete: (id) =>
    axiosClient.delete(`/recruitments/${id}`),

  sendReminder: (id) =>
    axiosClient.post(`/recruitments/${id}/remind`),
};

export default recruitmentApi;
