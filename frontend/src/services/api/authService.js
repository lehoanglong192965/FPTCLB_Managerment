import axiosClient from "./axiosClient";
import { TokenService } from "./axiosClient";

const authService = {
  // Đăng nhập → backend trả { access_token, refresh_token, role }
  login: async (email, password) => {
    const data = await axiosClient.post("/auth/login", { email, password });
    TokenService.save(data); // Lưu token + role vào localStorage
    return data;
  },

  // Đăng ký → backend tự set role = MEMBER
  register: async ({ fullName, email, password, studentId }) => {
    const data = await axiosClient.post("/auth/register", {
      fullName,
      email,
      password,
      studentId,
    });
    TokenService.save(data);
    return data;
  },

  // Đăng xuất → xóa token local + báo server thu hồi refresh token
  logout: async () => {
    try {
      const refreshToken = TokenService.getRefresh();
      if (refreshToken) { // Chỉ gọi server nếu còn token
        await axiosClient.post("/auth/logout", { refreshToken });
      }
    } finally {
      TokenService.clear();
      window.location.href = "/login";
    }
  },

  // Lấy thông tin profile người dùng đang đăng nhập
  getProfile: () => axiosClient.get("/auth/me"),

  // Đổi mật khẩu
  changePassword: ({ currentPassword, newPassword }) =>
    axiosClient.put("/auth/change-password", { currentPassword, newPassword }),

  // Quên mật khẩu → gửi email reset
  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  // Đặt lại mật khẩu bằng token từ email
  resetPassword: ({ token, newPassword }) =>
    axiosClient.post("/auth/reset-password", { token, newPassword }),
};

export default authService;