import axiosClient from "../axiosClient";

const icpdpStatsApi = {
  getOverview: () => axiosClient.get("/icpdp/stats"),
  getPersonnelHistory: (params) => axiosClient.get("/icpdp/personnel-reassign/history", { params }),
  reassign: (payload) => axiosClient.post("/icpdp/personnel-reassign", payload),
};

export default icpdpStatsApi;
