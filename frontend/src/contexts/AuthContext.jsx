import { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../services/api/auth/authService";
import { TokenService } from "../services/api/axiosClient";

export const AuthContext = createContext();
// Lấy thông tin user từ localStorage, nếu có lỗi thì trả về null.
const getUserFromStorage = () => {
  try {
    const userString = localStorage.getItem("user");
    if (userString) return JSON.parse(userString);
  } catch (error) {
    console.error("Error reading storage:", error);
  }
  return null;
};
// Lưu thông tin user vào localStorage.
const saveUserToStorage = (userData) => {
  localStorage.setItem("user", JSON.stringify(userData));
};
// Xóa thông tin user khỏi localStorage.
const removeUserFromStorage = () => {
  localStorage.removeItem("user");
};
// Context provider để quản lý thông tin xác thực người dùng.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  // Hàm fetchProfile để lấy thông tin profile của user từ backend.
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await authService.getProfile();
      setProfile(data);
    } catch (e) {
      if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError") return;
      console.error("Lỗi tải profile:", e);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Khôi phục session khi reload trang
  useEffect(() => {
    const savedUser = getUserFromStorage();
    if (savedUser) {
      if (TokenService.getAccess()) {
        setUser(savedUser);
        fetchProfile();
      } else {
        // Token đã bị xóa (refresh hết hạn) nhưng user vẫn còn trong storage → dọn dẹp
        removeUserFromStorage();
      }
    }
    setInitialized(true);
  }, [fetchProfile]);

  // Lắng nghe sự kiện logout từ axiosClient (refresh token hết hạn / fail)
  useEffect(() => {
    const handleAuthLogout = (e) => {
      setUser(null);
      setProfile(null);
      removeUserFromStorage();
      const returnUrl = encodeURIComponent(e.detail?.returnUrl ?? "/");
      window.location.href = `/login?returnUrl=${returnUrl}`;
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);

  const login = (userData) => {
    setUser(userData);
    saveUserToStorage(userData);
    fetchProfile();
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    removeUserFromStorage();
    authService.logout(); // gọi backend để hủy refresh token, sau đó redirect /login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, profile, profileLoading, fetchProfile, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
