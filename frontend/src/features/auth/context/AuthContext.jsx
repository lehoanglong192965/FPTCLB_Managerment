import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    const savedUser = getUserFromStorage();
    if (savedUser) setUser(savedUser);
  }, []);

  const login = (userData) => {
    setUser(userData);
    saveUserToStorage(userData);
  };

  const logout = () => {
    setUser(null);
    removeUserFromStorage();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
