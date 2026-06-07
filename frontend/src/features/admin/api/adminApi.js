import axiosClient from "../../../services/api/axiosClient";

/**
 * adminApi — quản lý User cho Admin.
 *
 * ─────────────────────────────────────────────────────────────
 *  ENDPOINT                        METHOD  RESPONSE
 * ─────────────────────────────────────────────────────────────
 *  /admin/users                    GET     UserDTO[]
 *  /admin/users/:id/suspend        PUT     UserDTO
 *  /admin/users/:id/activate       PUT     UserDTO
 * ─────────────────────────────────────────────────────────────
 * Yêu cầu quyền Admin.
 */
const adminApi = {
  getAllUsers: () =>
    axiosClient.get("/admin/users"),

  suspendUser: (id) =>
    axiosClient.put(`/admin/users/${id}/suspend`),

  activateUser: (id) =>
    axiosClient.put(`/admin/users/${id}/activate`),
};

export default adminApi;