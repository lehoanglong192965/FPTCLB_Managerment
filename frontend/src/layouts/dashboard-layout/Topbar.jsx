import { Bell, Search } from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../features/auth/utils/tokenGuard";
import { ROLE_LABELS } from "./sidebarConfigs";

function resolveUserInfo(authUser) {
  const token = TokenService.getAccess() || sessionStorage.getItem("auth_token");
  const payload = token ? decodeJwtPayload(token) : null;
  const name =
    authUser?.name ||
    payload?.name ||
    payload?.email?.split("@")[0] ||
    "Người dùng";
  const role =
    authUser?.role ||
    (TokenService.getRole() !== "GUEST" ? TokenService.getRole() : null) ||
    "MEMBER";
  return { name, role };
}

export default function Topbar() {
  const { user } = useAuth();
  const { name, role } = resolveUserInfo(user);
  const roleLabel = ROLE_LABELS[role] ?? role;
  const avatarLetter = name[0]?.toUpperCase() ?? "U";

  return (
    <header className="dashboard-topbar">
      <div className="topbar-search-wrap">
        <Search size={15} className="topbar-search-icon" />
        <input className="topbar-search-input" placeholder="Tìm kiếm..." />
      </div>

      <div className="topbar-actions">
        <button className="topbar-icon-btn" aria-label="Thông báo">
          <Bell size={17} />
          <span className="topbar-notif-dot" />
        </button>
      </div>
    </header>
  );
}
