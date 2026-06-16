import axiosClient from "../axiosClient";

const semesterApi = {
  getAll: () =>
    axiosClient.get("/semesters"),

  getById: (id) =>
    axiosClient.get(`/semesters/${id}`),

  create: ({ semesterCode, startDate, endDate, isActive }) =>
    axiosClient.post("/semesters", { semesterCode, startDate, endDate, isActive }),

  update: (id, { semesterCode, startDate, endDate, isActive }) =>
    axiosClient.put(`/semesters/${id}`, { semesterCode, startDate, endDate, isActive }),

  delete: (id) =>
    axiosClient.delete(`/semesters/${id}`),
};

export default semesterApi;
