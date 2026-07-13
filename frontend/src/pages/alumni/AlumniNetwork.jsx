import { useState, useEffect } from "react";
import { Users, Briefcase, MapPin, Loader2 } from "lucide-react";
import axiosClient from "../../services/api/axiosClient";
import { getInitials, getAvatarColor } from "../../utils/avatar";

const FALLBACK_ALUMNI = [
  { id: 1, name: "Trần Minh Khoa",  major: "SE",  year: 2022, company: "FPT Software",   role: "Software Engineer",  avatar: "K" },
  { id: 2, name: "Lê Thị Hoa",      major: "BA",  year: 2021, company: "Vingroup",         role: "Business Analyst",   avatar: "H" },
  { id: 3, name: "Nguyễn Quốc Bảo", major: "AI",  year: 2023, company: "VNG Corporation", role: "ML Engineer",         avatar: "B" },
];

export default function AlumniNetwork() {
  const [members, setMembers] = useState(FALLBACK_ALUMNI);
  const [stats, setStats]     = useState({ memberCount: "1,200+", companyCount: "350+", countryCount: "15+" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axiosClient.get("/alumni/network"),
      axiosClient.get("/alumni/network/stats"),
    ]).then(([networkRes, statsRes]) => {
      if (networkRes.status === "fulfilled") {
        const list = Array.isArray(networkRes.value) ? networkRes.value : (networkRes.value?.data ?? []);
        if (list.length > 0) {
          setMembers(list.slice(0, 10).map((a, i) => ({
            id:      a.id        ?? i,
            name:    a.fullName  ?? a.name  ?? "—",
            major:   a.major     ?? "",
            year:    a.graduationYear ?? a.year ?? "",
            company: a.company   ?? a.workplace ?? "",
            role:    a.jobTitle  ?? a.role  ?? "",
            avatar:  getInitials(a.fullName ?? a.name),
            avatarColor: getAvatarColor(a.id ?? a.fullName ?? a.name),
          })));
        }
      }
      if (statsRes.status === "fulfilled") {
        const d = statsRes.value?.data ?? statsRes.value;
        if (d) setStats({
          memberCount: d.memberCount  ?? "1,200+",
          companyCount: d.companyCount ?? "350+",
          countryCount: d.countryCount ?? "15+",
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mạng Lưới Alumni</h1>
        <p className="page-subtitle">Kết nối với cựu sinh viên FPTU trên toàn thế giới</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Thành viên Alumni", value: stats.memberCount,  icon: Users,     color: "#E6430A", bg: "#FFF3EE" },
          { label: "Công ty đang làm",  value: stats.companyCount, icon: Briefcase, color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Quốc gia",          value: stats.countryCount, icon: MapPin,    color: "#059669", bg: "#ecfdf5" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[14px] p-5 border border-[#f0f0f0] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              {loading ? <Loader2 size={16} className="animate-spin text-gray-300 mb-1" /> : (
                <p className="text-[1.4rem] font-bold text-gray-900 m-0">{s.value}</p>
              )}
              <p className="text-xs text-gray-400 m-0">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-card">
        <h3 className="text-sm font-bold text-gray-700 m-0 mb-4">Alumni nổi bật</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((a) => {
              const color = a.avatarColor ?? getAvatarColor(a.id ?? a.name);
              return (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 rounded-xl border border-[#f0f0f0] bg-white">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                  style={{ background: color + "18", color }}
                >
                  {a.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 m-0 mb-0.5">{a.name}</p>
                  {(a.role || a.company) && (
                    <p className="text-xs text-gray-400 m-0 flex items-center gap-1.5">
                      <Briefcase size={11} /> {[a.role, a.company].filter(Boolean).join(" tại ")}
                    </p>
                  )}
                </div>
                {(a.major || a.year) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 shrink-0">
                    {[a.major, a.year].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
