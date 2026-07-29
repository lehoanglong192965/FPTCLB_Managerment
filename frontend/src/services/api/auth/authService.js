import authApi from "./authApi";
import { TokenService } from "../axiosClient";
import { decodeJwtPayload } from "../../../utils/tokenGuard";
import { resolveRoleFromClaims } from "../../../constants/roles";

const authService = {
  login: async (email, password) => {
    const data = await authApi.login(email, password);

    // Role + clubId lấy thẳng từ claim của token: backend đã tính sẵn khi cấp
    // token nên không cần gọi thêm /user/my-club-role (một request thừa, và nếu
    // nó lỗi thì Leader bị tụt quyền xuống Member).
    const payload = decodeJwtPayload(data.token);
    const { role, clubId } = resolveRoleFromClaims(payload);

    TokenService.save({
      access_token: data.token,
      refresh_token: data.refreshToken,
      role,
      clubId,
    });

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
  checkStudentId: (studentId) => authApi.checkStudentId(studentId),
  getMyClubRole: () => authApi.getMyClubRole(),
  verifyOTP: (email, otpCode) => authApi.verifyOTP(email, otpCode),
  resendOTP: (email) => authApi.resendOTP(email),
  resendForgotPasswordOTP: (email) => authApi.resendForgotPasswordOTP(email),
};

export default authService;
