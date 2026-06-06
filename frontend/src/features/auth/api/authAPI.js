import axiosClient from "../../../services/api/axiosClient";

/**
 * authApi — thuần HTTP call, không chứa business logic.
 *
 * Base URL: http://localhost:8080/api  (cấu hình trong .env → VITE_API_URL)
 *
 * ─────────────────────────────────────────────────────────────
 *  ENDPOINT          METHOD  REQUEST BODY            RESPONSE
 * ─────────────────────────────────────────────────────────────
 *  /auth/login       POST    { email, password }     { type, token }
 *  /auth/register    POST    { email, password,      { message }
 *                             fullName, studentId }
 *  /auth/logout      POST    { refreshToken }        { message }
 *  /auth/me          GET     —                       { userID, email, fullName, roleID, ... }
 *  /auth/change-     PUT     { currentPassword,      { message }
 *    password                  newPassword }
 *  /auth/forgot-     POST    { email }               { message }
 *    password
 *  /auth/reset-      POST    { token, newPassword }  { message }
 *    password
 *  /auth/check-email GET     ?email=xxx              { exists: true/false }
 * ─────────────────────────────────────────────────────────────
 */
const authApi = {
  /**
   * Đăng nhập.
   * @param {string} email    - phải là @fpt.edu.vn hoặc @fe.edu.vn
   * @param {string} password
   * @returns {{ type: string, token: string }}
   */
  login: (email, password) =>
    axiosClient.post("/auth/login", { email, password }),

  /**
   * Đăng ký tài khoản mới.
   * @param {{ fullName, email, password, studentId }}
   * @returns {{ message: string }}
   */
  register: ({ fullName, email, password, studentId }) =>
    axiosClient.post("/auth/register", { fullName, email, password, studentId }),

  /**
   * Đăng xuất — gửi refreshToken lên server để huỷ phiên.
   * @param {string} refreshToken
   * @returns {{ message: string }}
   */
  logout: (refreshToken) =>
    axiosClient.post("/auth/logout", { refreshToken }),

  /**
   * Lấy thông tin tài khoản đang đăng nhập (cần token).
   * @returns {{ userID, email, fullName, roleID, major, accountStatus, ... }}
   */
  getProfile: () =>
    axiosClient.get("/auth/me"),

  /**
   * Đổi mật khẩu (cần token).
   * @param {{ currentPassword: string, newPassword: string }}
   * @returns {{ message: string }}
   */
  changePassword: ({ currentPassword, newPassword }) =>
    axiosClient.put("/auth/change-password", { currentPassword, newPassword }),

  /**
   * Gửi email đặt lại mật khẩu.
   * @param {string} email
   * @returns {{ message: string }}
   */
  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  /**
   * Đặt lại mật khẩu bằng token nhận qua email.
   * @param {{ token: string, newPassword: string }}
   * @returns {{ message: string }}
   */
  resetPassword: ({ token, newPassword }) =>
    axiosClient.post("/auth/reset-password", { token, newPassword }),

  /**
   * Kiểm tra email đã tồn tại trong hệ thống chưa.
   * @param {string} email
   * @returns {{ exists: boolean }}
   */
  checkEmailExists: (email) =>
    axiosClient.get("/auth/check-email", { params: { email } }),
};

export default authApi;