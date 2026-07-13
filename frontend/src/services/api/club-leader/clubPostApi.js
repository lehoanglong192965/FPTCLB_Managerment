import axiosClient from "../axiosClient";

const clubPostApi = {
  getByClub: (clubId, { page = 0, size = 20 } = {}) =>
    axiosClient.get(`/clubs/${clubId}/posts`, { params: { page, size } }),

  create: (clubId, content) =>
    axiosClient.post(`/clubs/${clubId}/posts`, { content }),
};

export default clubPostApi;
