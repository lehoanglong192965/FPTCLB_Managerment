import axiosClient from "./axiosClient";

const eventApi = {
  getByClubId: (clubId) => axiosClient.get(`/clubs/${clubId}/events`),
  create: (clubId, data) => axiosClient.post(`/clubs/${clubId}/events`, data),
};

export default eventApi;
