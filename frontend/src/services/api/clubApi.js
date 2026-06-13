import axiosClient from "./axiosClient";

const clubApi = {
  getAll: () => axiosClient.get("/clubs"),
  create: (data) => axiosClient.post("/clubs", data),
  updateStatus: (id, status) => axiosClient.put(`/clubs/${id}/status`, { status }),
};

export default clubApi;
