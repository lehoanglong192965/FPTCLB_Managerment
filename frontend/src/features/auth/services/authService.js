import authApi from "../api/authAPI";
import { TokenService } from "../../../services/api/axiosClient";
import { decodeJwtPayload } from "../utils/tokenGuard";

const ROLE_MAP = {
  1: "ADMIN",
  2: "ICPDP",
  3: "MEMBER",
};

/**
 * authService — xử lý business logic (lưu token, map role, redirect...).
 * Dùng authApi cho các HTTP call thuần.
 */

const authService = {
  login: async (email, password) => {
    const data = await authApi.login(email, password);
    // data = { type: "Bearer", token: "eyJ..." }

    const payload = decodeJwtPayload(data.token);
    let role = ROLE_MAP[payload?.roleID] ?? "MEMBER";

    // Tạm thời lưu token để authApi.getMyClubRole() có thể lấy gửi đi
    TokenService.save({ access_token: data.token, refresh_token: null, role });

    if (role === "MEMBER") {
      try {
        const res = await authApi.getMyClubRole();
        if (res.clubRoleID === 1 || res.clubRoleID === 2) {
          role = "LEADER";
          // Cập nhật lại role trong TokenService
          TokenService.save({ access_token: data.token, refresh_token: null, role });
        }
      } catch (e) {
        console.error("Lỗi lấy quyền CLB", e);
      }
    }

    return { token: data.token, role, email: payload?.sub };
  },

  register: async (params) => {
    const data = await authApi.register(params);
    return data;
  },

  logout: async () => {
    try {
      const refreshToken = TokenService.getRefresh();
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      TokenService.clear();
      window.location.href = "/login";
    }
  },

  getProfile: () => authApi.getProfile(),

  changePassword: (params) => authApi.changePassword(params),

  forgotPassword: (email) => authApi.forgotPassword(email),

  resetPassword: (params) => authApi.resetPassword(params),
  checkEmailExists: (email) => authApi.checkEmailExists(email),
  getMyClubRole: () => authApi.getMyClubRole(),
};
export default authService;
