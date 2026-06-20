import axiosClient from "../axiosClient";

const notificationApi = {
  getByClub: (clubId) =>
    axiosClient.get(`/clubs/${clubId}/notifications`),

  create: (clubId, { title, content }) =>
    axiosClient.post(`/clubs/${clubId}/notifications`, { title, content }),
};

export default notificationApi;
