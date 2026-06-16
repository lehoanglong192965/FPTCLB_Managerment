import axiosClient from "../axiosClient";

const clubBoardApi = {
  getBoard: (clubId) =>
    axiosClient.get(`/clubs/${clubId}/board`),

  changeBoard: (clubId, { userID, action, newRole, reason }) =>
    axiosClient.put(`/clubs/${clubId}/board`, { userID, action, newRole, reason }),
};

export default clubBoardApi;
