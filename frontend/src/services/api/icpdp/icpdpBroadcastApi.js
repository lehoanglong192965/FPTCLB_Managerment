import axiosClient from "../axiosClient";

const icpdpNotificationApi = {
  broadcast: ({ audience, type, title, content }) =>
    axiosClient.post("/icpdp/notifications/broadcast", { audience, type, title, content }),
};

export default icpdpNotificationApi;
