import axiosClient from "../axiosClient";

const clubNotificationApi = {
  sendToMembers: (clubId, { title, content }) =>
    axiosClient.post(`/clubs/${clubId}/notifications`, {
      title,
      content,
      notificationType: "CLUB_ANNOUNCEMENT",
    }),
};

export default clubNotificationApi;
