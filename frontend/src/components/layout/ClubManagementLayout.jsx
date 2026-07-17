import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home, Calendar, CalendarPlus, Users, ClipboardList,
  Ban, BarChart2, Settings,
} from "lucide-react";

export default function ClubManagementLayout() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  const isClubLeader = user?.role === "CLUB_LEADER";
  const base       = isClubLeader ? "/club-leader" : "/vice-leader";
  const myClubBase = `${base}/my-club`;
  const home       = `${myClubBase}/space`;

  const navItems = [
    { icon: Home,         label: "Trang câu lạc bộ",   path: home },
    { icon: Calendar,     label: "Quản lý sự kiện",    path: `${myClubBase}/events` },
    { icon: CalendarPlus, label: "Tạo sự kiện",        path: `${base}/event-create` },
    { icon: Users,        label: "Quản lý thành viên", path: `${myClubBase}/members` },
    ...(isClubLeader ? [
      { icon: ClipboardList, label: "Đơn ứng tuyển",   path: `${myClubBase}/applications` },
      { icon: Ban,           label: "Danh sách đen",   path: `${myClubBase}/blacklist` },
    ] : []),
    { icon: BarChart2,    label: "Báo cáo CLB",        path: `${myClubBase}/reports` },
    { icon: Settings,     label: "Thông tin CLB",      path: `${myClubBase}/club-info` },
  ];

  return (
    <div className="flex gap-5 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>

      {/* Persistent right management sidebar */}
      <div className="w-[234px] shrink-0 sticky top-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 m-0">
              Quản lý CLB
            </p>
          </div>
          <div className="flex flex-col py-1">
            {navItems.map(({ icon: Icon, label, path }) => {
              const isHome   = path === home;
              const isActive = isHome
                ? pathname === home
                : pathname === path || pathname.startsWith(path + "/");
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[13.5px] transition-colors cursor-pointer border-none font-[inherit] text-left w-full rounded-none ${
                    isActive
                      ? "bg-orange-50 text-[#E6430A] font-semibold"
                      : "bg-transparent text-gray-700 hover:bg-gray-50 hover:text-[#E6430A]"
                  }`}
                >
                  <Icon
                    size={16}
                    className={`shrink-0 ${isActive ? "text-[#E6430A]" : "text-gray-400"}`}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
