import authApi from "./authApi";
import { TokenService } from "../axiosClient";
import { decodeJwtPayload } from "../../../lib/tokenGuard";

const ROLE_MAP = {
  1: "ADMIN",
  2: "ICPDP",
  3: "MEMBER",
  4: "ALUMNI",
};

const authService = {
  login: async (email, password) => {
    const data = await authApi.login(email, password);

    const payload = decodeJwtPayload(data.token);
    let role = ROLE_MAP[payload?.roleID] ?? "MEMBER";

    TokenService.save({ access_token: data.token, refresh_token: data.refreshToken, role });

    let clubId = null;
    if (role === "MEMBER") {
      try {
        const res = await authApi.getMyClubRole();
        if (res.clubRoleID === 1) {
          role = "CLUB_LEADER";
          clubId = res.clubID ?? null;
        } else if (res.clubRoleID === 2) {
          role = "VICE_LEADER";
          clubId = res.clubID ?? null;
        }
        TokenService.save({ access_token: data.token, refresh_token: data.refreshToken, role, clubId });
      } catch (e) {
        console.error("Lỗi lấy quyền CLB", e);
      }
    }

    return { token: data.token, role, email: payload?.sub, clubId };
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
  updateProfile: (params) => authApi.updateProfile(params),
  checkEmailExists: (email) => authApi.checkEmailExists(email),
  getMyClubRole: () => authApi.getMyClubRole(),
  verifyOTP: (email, otpCode) => authApi.verifyOTP(email, otpCode),
  resendOTP: (email) => authApi.resendOTP(email),
  resendForgotPasswordOTP: (email) => authApi.resendForgotPasswordOTP(email),
};

export default authService;
