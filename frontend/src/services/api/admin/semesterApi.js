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

  close: (id) =>
    axiosClient.put(`/admin/semesters/${id}/close`),

  forceClose: (id, reason) =>
    axiosClient.put(`/admin/semesters/${id}/force-close`, { reason }),
};

export default semesterApi;
