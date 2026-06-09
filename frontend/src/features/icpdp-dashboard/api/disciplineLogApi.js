import axiosClient from "../../../services/api/axiosClient";

const disciplineLogApi = {
  getAll: () =>
    axiosClient.get("/discipline-logs"),

  getById: (id) =>
    axiosClient.get(`/discipline-logs/${id}`),

  create: (dto) =>
    axiosClient.post("/discipline-logs", dto),

  update: (id, dto) =>
    axiosClient.put(`/discipline-logs/${id}`, dto),

  delete: (id) =>
    axiosClient.delete(`/discipline-logs/${id}`),
};

export default disciplineLogApi;
