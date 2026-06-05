import { Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../features/auth/utils/tokenGuard";
import Sidebar from "./Sidebar";
import { getSidebarConfig } from "./sidebarConfigs";
import "../../assets/css/dashboardLayout.css";

function resolveRole(authUser) {
  if (authUser?.role) return authUser.role;

  const stored = TokenService.getRole();
  if (stored && stored !== "GUEST") return stored;

  const token =
    TokenService.getAccess() || sessionStorage.getItem("auth_token");
  const payload = token ? decodeJwtPayload(token) : null;
  return payload?.roles?.[0]?.toUpperCase() ?? "MEMBER";
}

/*
 * DashboardLayout — layout wrapper với sidebar cho mọi role sau đăng nhập.
 *
 * Cách dùng (trong routes):
 *   <Route path="/admin" element={<DashboardLayout />}>
 *     <Route index element={<SystemOverview />} />
 *     <Route path="clubs" element={<ClubManagement />} />
 *   </Route>
 *
 * Để thêm/xoá mục menu, chỉnh file ./sidebarConfigs.js
 */
export default function DashboardLayout() {
  const { user } = useAuth();
  const role = resolveRole(user);
  const navItems = getSidebarConfig(role);

  return (
    <div className="dashboard-layout">
      <Sidebar navItems={navItems} />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
