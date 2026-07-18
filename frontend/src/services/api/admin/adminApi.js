import axiosClient from "../axiosClient";

const adminApi = {
  getAllUsers: () =>
    axiosClient.get("/admin/users"),

  suspendUser: (id) =>
    axiosClient.put(`/admin/users/${id}/suspend`),

  activateUser: (id) =>
    axiosClient.put(`/admin/users/${id}/activate`),

  createIcpdpAccount: (data) =>
    axiosClient.post("/admin/users/icpdp", data),

  getDisciplineLogs: () =>
    axiosClient.get("/discipline-logs"),

  createDisciplineLog: (data) =>
    axiosClient.post("/discipline-logs", data),

  updateDisciplineLog: (id, data) =>
    axiosClient.put(`/discipline-logs/${id}`, data),
};

export default adminApi;
