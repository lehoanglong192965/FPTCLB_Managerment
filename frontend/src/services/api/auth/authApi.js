import axiosClient from "../axiosClient";

const authApi = {
  login: (email, password) =>
    axiosClient.post("/auth/login", { email, password }),

  register: ({ fullName, email, password, studentId, major }) =>
    axiosClient.post("/auth/register", { fullName, email, password, studentId, major }),

  logout: (refreshToken) =>
    axiosClient.post("/auth/logout", { refreshToken }),

  getProfile: () =>
    axiosClient.get("/user/profile"),

  changePassword: ({ currentPassword, newPassword }) =>
    axiosClient.put("/auth/change-password", { currentPassword, newPassword }),

  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  resetPassword: ({ email, otp, newPassword }) =>
    axiosClient.post("/auth/reset-password", { email, otp, newPassword }),

  updateProfile: ({ fullName, major, phoneNumber }) =>
    axiosClient.put("/user/profile", { fullName, major, phoneNumber }),

  checkEmailExists: (email) =>
    axiosClient.get("/auth/check-email", { params: { email } }),

  getMyClubRole: () =>
    axiosClient.get("/user/my-club-role"),

  verifyOTP: (email, otpCode) =>
    axiosClient.post("/auth/verify-otp", { email, otpCode }),

  resendOTP: (email) =>
    axiosClient.post(`/auth/resend-otp?email=${email}`),
    
  resendForgotPasswordOTP: (email) =>
    axiosClient.post(`/auth/resend-forgot-otp?email=${email}`),
};

export default authApi;
