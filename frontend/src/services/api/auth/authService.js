import authApi from "./authApi";
import { TokenService } from "../axiosClient";
import { decodeJwtPayload } from "../../../utils/tokenGuard";
import { ROLE_MAP } from "../../../constants/roles";

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
        // Chỉ nâng quyền khi user thực sự thuộc một CLB (clubID hợp lệ)
        if (res?.clubID) {
          // clubRoleID: 1=Leader, 2=ViceLeader, 3=Member (thường)
          if (res.clubRoleID === 1) {
            role = "CLUB_LEADER";
            clubId = res.clubID;
          } else if (res.clubRoleID === 2) {
            role = "VICE_LEADER";
            clubId = res.clubID;
          }
          // clubRoleID === 3 = Member thường → giữ nguyên role "MEMBER"
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
