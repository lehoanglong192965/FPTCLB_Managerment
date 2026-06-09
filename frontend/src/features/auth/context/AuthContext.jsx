import { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../services/authService";
import { TokenService } from "../../../services/api/axiosClient";

export const AuthContext = createContext();

const getUserFromStorage = () => {
  try {
    const userString = localStorage.getItem("user");
    if (userString) return JSON.parse(userString);
  } catch (error) {
    console.error("Error reading storage:", error);
  }
  return null;
};

const saveUserToStorage = (userData) => {
  localStorage.setItem("user", JSON.stringify(userData));
};

const removeUserFromStorage = () => {
  localStorage.removeItem("user");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await authService.getProfile();
      setProfile(data);
    } catch (e) {
      console.error("Lỗi tải profile:", e);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedUser = getUserFromStorage();
    if (savedUser) {
      setUser(savedUser);
      // Chỉ fetch profile nếu có access token (phiên còn hợp lệ)
      if (TokenService.getAccess()) {
        fetchProfile();
      }
    }
  }, [fetchProfile]);

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
    <AuthContext.Provider value={{ user, login, logout, profile, profileLoading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
