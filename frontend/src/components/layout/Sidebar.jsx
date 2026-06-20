import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../lib/tokenGuard";
import { ROLE_LABELS } from "./sidebarConfigs";
import authService from "../../services/api/auth/authService";

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
  const avatarLetter = (displayName.split(" ").pop()?.[0] ?? "U").toUpperCase();

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
    <aside
      className="w-60 bg-white border-r border-[#F0F0F0] flex flex-col fixed top-0 left-0 h-screen z-[100] overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded"
    >
      <div className="px-[18px] pt-5 pb-4 text-[17px] font-extrabold tracking-tight shrink-0 border-b border-[#F0F0F0] flex items-center gap-[10px]">
        <div
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-black shadow-[0_2px_8px_rgba(230,67,10,0.3)]"
          style={{ background: "linear-gradient(135deg,#F37021,#E6430A)" }}
        >
          F
        </div>
        <span>
          <span className="text-[#111827]">FPTU</span>
          {" "}
          <span className="text-[#E6430A]">Clubs</span>
        </span>
      </div>

      <div className="flex items-center gap-[10px] mx-3 mt-[14px] mb-[6px] p-3 rounded-xl bg-[#FFF3EE] border border-[#FFE0D0] shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-[0_2px_6px_rgba(230,67,10,0.3)]"
          style={{ background: "linear-gradient(135deg,#F37021 0%,#E6430A 100%)" }}
        >
          {avatarLetter}
        </div>
        <div className="overflow-hidden">
          <p className="text-[13px] font-semibold text-[#111827] leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis m-0">
            {displayName}
          </p>
          <p className="text-[11px] text-[#E6430A] whitespace-nowrap overflow-hidden text-ellipsis m-0 font-medium">
            {roleLabel}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-[10px] py-[10px] flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.exact ?? false}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-[10px] py-[9px] pr-3 pl-[9px] rounded-[9px] text-[13.5px] font-semibold text-[#E6430A] no-underline cursor-pointer whitespace-nowrap bg-[#FFF3EE] border-l-[3px] border-[#E6430A] transition-[background,color] duration-150"
                : "flex items-center gap-[10px] px-3 py-[9px] rounded-[9px] text-[13.5px] font-medium text-[#6b7280] no-underline cursor-pointer whitespace-nowrap hover:bg-[#F9FAFB] hover:text-[#111827] transition-[background,color] duration-150"
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={17}
                  className={isActive ? "shrink-0 opacity-100" : "shrink-0 opacity-70"}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-[10px] border-t border-[#F0F0F0] shrink-0">
        <button
          className="flex items-center gap-[10px] w-full px-3 py-[9px] rounded-[9px] bg-transparent border-none text-[13.5px] font-medium text-[#6b7280] cursor-pointer transition-[background,color] duration-150 text-left hover:bg-[#FEF2F2] hover:text-[#dc2626]"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
