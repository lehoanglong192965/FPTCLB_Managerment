import { createContext, useContext, useEffect, useState } from "react";

// 1. Create shared context
export const AuthContext = createContext();

// ==========================================
// Các hàm hỗ trợ
// ==========================================

// Lấy user từ localStorage 1 cách an toàn
const getUserFromStorage = () => {
  try {
    const userString = localStorage.getItem("user");

    if (userString) {
      return JSON.parse(userString);
    }
    // Ở dòng trả về lỗi sẽ sửa thành tiếng việt nếu hệ thống đồng bộ tiếng việt
  } catch (error) {
    console.error("Error reading storage:", error);
  }

  return null;
};

// Lưu user vào localStorage
const saveUserToStorage = (userData) => {
  const userString = JSON.stringify(userData);

  localStorage.setItem("user", userString);
};

// Xoá user khỏi localStorage
const removeUserFromStorage = () => {
  localStorage.removeItem("user");
};

// ==========================================
// Component chính quản lí auth
// ==========================================

export const AuthProvider = ({ children }) => {

  // Lưu thông tin người dùng hiện tại (null nếu chưa đăng nhập)
  const [user, setUser] = useState(null);

  // Khi load app, kiểm tra xem đã có user nào lưu trong localStorage chưa
  useEffect(() => {
    const savedUser = getUserFromStorage();

    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Xử lý đăng nhập: nhận dữ liệu người dùng, lưu vào state và localStorage
  const login = (userData) => {
    setUser(userData);

    saveUserToStorage(userData);
  };

  // Xử lý đăng xuất: xoá thông tin người dùng khỏi state và localStorage
  const logout = () => {
    setUser(null);

    removeUserFromStorage();
  };

  // Chia sẻ thông tin người dùng và các hàm login/logout cho toàn bộ component con thông qua context
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM HOOK để dễ dàng sử dụng context ở các component con
// ==========================================

export const useAuth = () => {
  return useContext(AuthContext);
};