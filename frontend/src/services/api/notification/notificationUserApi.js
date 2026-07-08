import axiosClient from "../axiosClient";

const notificationUserApi = {
  getAll:       ()    => axiosClient.get("/notifications/me"),
  getUnreadCount: ()  => axiosClient.get("/notifications/unread-count"),
  getById:      (id)  => axiosClient.get(`/notifications/${id}`),
  markRead:     (id)  => axiosClient.put(`/notifications/${id}/read`),
};

export default notificationUserApi;
