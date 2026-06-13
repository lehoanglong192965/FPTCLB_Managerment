import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../features/auth/utils/tokenGuard";
import { ROLE_LABELS } from "./sidebarConfigs";
import authService from "../../features/auth/services/authService";

function resolveUserInfo(authUser) {
  const token =
    TokenService.getAccess() || sessionStorage.getItem("auth_token");
  const payload = token ? decodeJwtPayload(token) : null;

  const name =
    authUser?.name ||
    payload?.name ||
    payload?.email?.split("@")[0] ||
    "Người dùng";

  const role =
    authUser?.role ||
    (TokenService.getRole() !== "GUEST" ? TokenService.getRole() : null) ||
    payload?.roles?.[0]?.toUpperCase() ||
    "MEMBER";

  return { name, role };
}

export default function Sidebar({ navItems }) {
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();

  const { name, role } = resolveUserInfo(user);
  const displayName = profile?.fullName || name;
  const roleLabel = ROLE_LABELS[role] ?? role;
  const avatarLetter = displayName[0]?.toUpperCase() ?? "U";

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      TokenService.clear();
      logout();
      navigate("/login");
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">F</div>
        <span>
          <span className="sidebar-logo-fptu">FPTU</span>
          {" "}
          <span className="sidebar-logo-clubs">Clubs</span>
        </span>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{avatarLetter}</div>
        <div style={{ overflow: "hidden" }}>
          <p className="sidebar-user-name">{displayName}</p>
          <p className="sidebar-user-role">{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.exact ?? false}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? " active" : ""}`
            }
          >
            <item.icon size={17} className="sidebar-nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
