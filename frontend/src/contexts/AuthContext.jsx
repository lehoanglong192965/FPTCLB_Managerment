import { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../services/api/auth/authService";
import { TokenService } from "../services/api/axiosClient";
import { decodeJwtPayload } from "../utils/tokenGuard";
import { resolveRoleFromClaims } from "../constants/roles";

export const AuthContext = createContext();

/**
 * Lấy role từ access token — KHÔNG tin giá trị role lưu trong localStorage.
 *
 * Trước đây role được đọc từ object "user" trong localStorage, nên chỉ cần mở
 * DevTools sửa `user.role` thành "ADMIN" là vào được toàn bộ giao diện quản trị
 * (API vẫn chặn bằng @PreAuthorize, nhưng UI thì mở toang). Token thì đã được
 * backend ký nên người dùng không tự bịa claim `roleID`/`clubRole` được.
 */
const getSessionFromToken = () => {
  const token = TokenService.getAccess();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;

  const { role, clubId } = resolveRoleFromClaims(payload);
  return { email: payload.sub, role, clubId };
};

const CLUB_ROLE_ID_TO_APP_ROLE = {
  1: "CLUB_LEADER",
  2: "VICE_LEADER",
  3: "MEMBER",
};

const MANAGED_CLUB_ROLES = new Set(["CLUB_LEADER", "VICE_LEADER"]);

/**
 * Đồng bộ lại quyền CLB mỗi lần mở lại app.
 *
 * Claim trong JWT được "đóng băng" lúc đăng nhập và sống tới 24h, nên một người
 * vừa bị gỡ chức Leader vẫn thấy menu quản lý CLB cho tới khi token hết hạn.
 * Gọi lại API lúc khôi phục phiên để bắt kịp thay đổi đó. Nếu request lỗi thì
 * giữ nguyên quyền suy ra từ token — tuyệt đối không hạ quyền vì lỗi mạng.
 */
async function syncManagedClubRole(session) {
  if (!MANAGED_CLUB_ROLES.has(session.role)) return session;

  try {
    const res = await authService.getMyClubRole();
    return {
      ...session,
      role:   CLUB_ROLE_ID_TO_APP_ROLE[res?.clubRoleID] ?? session.role,
      clubId: res?.clubID ?? null,
    };
  } catch (error) {
    console.error("Lỗi đồng bộ quyền CLB:", error);
    return session;
  }
}

// Lấy phần thông tin phụ (không phải quyền) đã lưu ở localStorage.
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
      // Nguồn sự thật là access token, không phải object "user" trong storage.
      const tokenSession = getSessionFromToken();

      if (tokenSession) {
        const session = await syncManagedClubRole(tokenSession);
        const savedUser = getUserFromStorage();
        // Giữ lại các field phụ đã lưu (nếu có) nhưng quyền luôn lấy từ token.
        const restoredUser = { ...savedUser, ...session };
        if (cancelled) return;
        setUser(restoredUser);
        saveUserToStorage(restoredUser);
        TokenService.save({
          access_token:  TokenService.getAccess(),
          refresh_token: TokenService.getRefresh(),
          role:          session.role,
          clubId:        session.clubId,
        });
        fetchProfile();
      } else {
        // Không có token hợp lệ → dọn sạch phần còn sót trong storage
        removeUserFromStorage();
        TokenService.clear();
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
