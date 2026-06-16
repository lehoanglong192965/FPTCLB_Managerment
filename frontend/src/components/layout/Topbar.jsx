import { Bell, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../lib/tokenGuard";
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
    <header className="h-[58px] bg-white border-b border-[#F0F0F0] flex items-center justify-between px-7 sticky top-0 z-50 shrink-0 gap-4">
      <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] px-[14px] py-2 w-60">
        <Search size={15} className="text-[#9ca3af] shrink-0" />
        <input
          className="bg-transparent border-none outline-none text-[13.5px] text-[#111827] w-full placeholder:text-[#b0b7c3]"
          placeholder="Tìm kiếm..."
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          className="w-[38px] h-[38px] rounded-[10px] bg-transparent border border-[#E5E7EB] flex items-center justify-center cursor-pointer text-[#6b7280] relative transition-[background,color,border-color] duration-150 hover:bg-[#FFF3EE] hover:border-[#FFD0BB] hover:text-[#E6430A]"
          aria-label="Thông báo"
        >
          <Bell size={17} />
          <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#E6430A] border-[1.5px] border-white" />
        </button>
      </div>
    </header>
  );
}
