import { useState, useEffect } from "react";
import { Building2, Calendar, ShieldAlert, Users, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getGreeting } from "../../utils/greeting";
import icpdpStatsApi from "../../services/api/icpdp/statsApi";

const QUICK_LINKS = [
  { label: "Phê duyệt sự kiện",  href: "/icpdp/event-approval",    color: "#E6430A" },
  { label: "Nhật ký kỷ luật",    href: "/icpdp/discipline-log",     color: "#dc2626" },
  { label: "Điều động nhân sự",  href: "/icpdp/personnel-reassign", color: "#7c3aed" },
  { label: "Quản lý tuyển dụng", href: "/icpdp/recruitment",        color: "#059669" },
  { label: "Danh sách đen",      href: "/icpdp/blacklist",           color: "#6b7280" },
];

const STAT_DEFS = [
  { key: "activeClubs",          label: "CLB đang hoạt động", icon: Building2,  color: "#E6430A", bg: "#FFF3EE" },
  { key: "eventsThisMonth",      label: "Sự kiện tháng này",  icon: Calendar,   color: "#7c3aed", bg: "#f5f3ff" },
  { key: "pendingDisciplines",   label: "Đang xử lý kỷ luật", icon: ShieldAlert, color: "#dc2626", bg: "#fef2f2" },
  { key: "totalStudents",        label: "Tổng sinh viên CLB", icon: Users,       color: "#059669", bg: "#ecfdf5" },
];

export default function IcpdpOverview() {
  const { profile } = useAuth();
  const name = profile?.fullName?.split(" ").pop() ?? "bạn";
  const [stats, setStats] = useState(null);

  useEffect(() => {
    icpdpStatsApi.getOverview()
      .then((data) => setStats(data?.data ?? data))
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.warn("[IcpdpOverview] stats fetch failed:", err?.response?.status);
      });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{getGreeting()}, {name}!</h1>
        <p className="text-sm text-gray-500">Bảng điều khiển IC-PDP — Quản lý hoạt động câu lạc bộ toàn trường</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {STAT_DEFS.map((s) => (
          <div key={s.label} className="bg-white rounded-[14px] p-5 border border-[#f0f0f0] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              {stats === null ? (
                <Loader2 size={18} className="animate-spin text-gray-300 mb-1" />
              ) : (
                <p className="text-[1.4rem] font-bold text-gray-900 m-0">
                  {stats[s.key] ?? "—"}
                </p>
              )}
              <p className="text-xs text-gray-400 m-0">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[14px] p-5 border border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Truy cập nhanh</h3>
          <div className="flex flex-col gap-2">
            {QUICK_LINKS.map((l) => (
              <a key={l.label} href={l.href}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] bg-gray-50 hover:bg-gray-100 text-gray-900 text-[13px] font-medium no-underline transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[14px] p-5 border border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-1.5">
            <Clock size={15} color="#9ca3af" /> Hoạt động gần đây
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <TrendingUp size={36} strokeWidth={1.5} />
            <p className="mt-3 text-[13px]">Dữ liệu thống kê sẽ hiển thị ở đây</p>
          </div>
        </div>
      </div>
    </div>
  );
}
