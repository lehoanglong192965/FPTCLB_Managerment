import { Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../utils/tokenGuard";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getSidebarConfig } from "./sidebarConfigs";
import AiChat from "../../components/ui/AiChat";

function resolveRole(authUser) {
  if (authUser?.role) return authUser.role;

  const stored = TokenService.getRole();
  if (stored && stored !== "GUEST") return stored;

  const token = TokenService.getAccess();
  const payload = token ? decodeJwtPayload(token) : null;
  return payload?.roles?.[0]?.toUpperCase() ?? "MEMBER";
}

export default function DashboardLayout() {
  const { user } = useAuth();
  const role = resolveRole(user);
  const navItems = getSidebarConfig(role);

  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} />
      <main className="flex-1 ml-60 bg-[#F4F5F7] min-h-screen flex flex-col">
        <Topbar />
        <div className="p-7 px-8 flex-1">
          <Outlet />
        </div>
      </main>
      {role !== "ADMIN" && <AiChat />}
    </div>
  );
}
