import { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../services/api/auth/authService";
import { TokenService } from "../services/api/axiosClient";

export const AuthContext = createContext();

const CLUB_ROLE_TO_APP_ROLE = {
  1: "CLUB_LEADER",
  2: "VICE_LEADER",
  3: "MEMBER",
};

const MANAGED_CLUB_ROLES = new Set(["CLUB_LEADER", "VICE_LEADER"]);

async function refreshManagedClubSession(savedUser) {
  if (!MANAGED_CLUB_ROLES.has(savedUser?.role)) return savedUser;

  try {
    const res = await authService.getMyClubRole();
    const role = CLUB_ROLE_TO_APP_ROLE[res?.clubRoleID] ?? savedUser.role;
    TokenService.save({
      access_token: TokenService.getAccess(),
      refresh_token: TokenService.getRefresh(),
      role,
      clubId: res?.clubID ?? null,
    });
    return { ...savedUser, role };
  } catch (error) {
    console.error("Lỗi đồng bộ quyền CLB:", error);
    return savedUser;
  }
}

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
    let cancelled = false;

    const restoreSession = async () => {
      const savedUser = getUserFromStorage();
      if (savedUser) {
        if (TokenService.getAccess()) {
          const refreshedUser = await refreshManagedClubSession(savedUser);
          if (cancelled) return;
          setUser(refreshedUser);
          saveUserToStorage(refreshedUser);
          fetchProfile();
        } else {
          // Token đã bị xóa (refresh hết hạn) nhưng user vẫn còn trong storage → dọn dẹp
          removeUserFromStorage();
        }
      }
      if (!cancelled) setInitialized(true);
    };

    restoreSession();
    return () => { cancelled = true; };
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

  const logout = async () => {
    setUser(null);
    setProfile(null);
    removeUserFromStorage();
    await authService.logout(); // gọi backend để hủy refresh token, sau đó redirect /login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, profile, profileLoading, fetchProfile, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
