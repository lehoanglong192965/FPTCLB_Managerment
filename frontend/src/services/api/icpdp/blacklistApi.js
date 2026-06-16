import axiosClient from "../axiosClient";

const blacklistApi = {
  getAll: (clubID) =>
    axiosClient.get(`/clubs/${clubID}/blacklist`),

  add: (clubID, { userID, reason }) =>
    axiosClient.post(`/clubs/${clubID}/blacklist`, { userID, reason }),

  update: (clubID, blacklistID, { userID, reason }) =>
    axiosClient.put(`/clubs/${clubID}/blacklist/${blacklistID}`, { userID, reason }),

  remove: (clubID, blacklistID) =>
    axiosClient.delete(`/clubs/${clubID}/blacklist/${blacklistID}`),
};

export default blacklistApi;
