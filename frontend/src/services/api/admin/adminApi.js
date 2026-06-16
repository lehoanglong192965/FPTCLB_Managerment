import axiosClient from "../axiosClient";

const adminApi = {
  getAllUsers: () =>
    axiosClient.get("/admin/users"),

  suspendUser: (id) =>
    axiosClient.put(`/admin/users/${id}/suspend`),

  activateUser: (id) =>
    axiosClient.put(`/admin/users/${id}/activate`),
};

export default adminApi;
