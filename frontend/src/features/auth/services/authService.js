import axiosClient from "../../../services/api/axiosClient";
import { TokenService } from "../../../services/api/axiosClient";

const authService = {
  login: async (email, password) => {
    const data = await axiosClient.post("/auth/login", { email, password });
    TokenService.save(data);
    return data;
  },

  register: async ({ fullName, email, password, studentId }) => {
    const data = await axiosClient.post("/auth/register", { fullName, email, password, studentId });
    TokenService.save(data);
    return data;
  },

  logout: async () => {
    try {
      const refreshToken = TokenService.getRefresh();
      if (refreshToken) {
        await axiosClient.post("/auth/logout", { refreshToken });
      }
    } finally {
      TokenService.clear();
      window.location.href = "/login";
    }
  },

  getProfile: () => axiosClient.get("/auth/me"),

  changePassword: ({ currentPassword, newPassword }) =>
    axiosClient.put("/auth/change-password", { currentPassword, newPassword }),

  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  resetPassword: ({ token, newPassword }) =>
    axiosClient.post("/auth/reset-password", { token, newPassword }),
};

export default authService;
