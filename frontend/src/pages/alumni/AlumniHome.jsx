import { useState, useEffect } from "react";
import { Star, Calendar, Users, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getGreeting } from "../../utils/greeting";
import axiosClient from "../../services/api/axiosClient";

const FALLBACK_NEWS = [
  { id: 1, title: "Hackathon Alumni 2026 — Đăng ký ngay!", date: "05/07/2026", tag: "Sự kiện" },
  { id: 2, title: "Hội thảo nghề nghiệp: Từ sinh viên đến chuyên gia", date: "20/06/2026", tag: "Workshop" },
  { id: 3, title: "IT Club kỷ niệm 10 năm thành lập", date: "01/06/2026", tag: "CLB" },
];

export default function AlumniHome() {
  const { profile } = useAuth();
  const name = profile?.fullName?.split(" ").pop() ?? "bạn";
  const [stats, setStats]   = useState({ clubCount: "—", eventCount: 2, networkCount: "—" });
  const [news, setNews]     = useState(FALLBACK_NEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axiosClient.get("/alumni/stats"),
      axiosClient.get("/alumni/news"),
    ]).then(([statsRes, newsRes]) => {
      if (statsRes.status === "fulfilled") {
        const d = statsRes.value?.data ?? statsRes.value;
        setStats({
          clubCount:    d?.clubCount    ?? "—",
          eventCount:   d?.eventCount   ?? 2,
          networkCount: d?.networkCount ?? "—",
        });
      }
      if (newsRes.status === "fulfilled") {
        const list = Array.isArray(newsRes.value) ? newsRes.value : (newsRes.value?.data ?? []);
        if (list.length > 0) {
          setNews(list.slice(0, 5).map((n) => ({
            id:    n.id,
            title: n.title ?? n.name ?? "—",
            date:  n.date  ?? n.createdAt ?? "",
            tag:   n.tag   ?? n.type     ?? "Tin tức",
          })));
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{getGreeting()}, {name}!</h1>
        <p className="text-sm text-gray-500">Chào mừng bạn quay lại — theo dõi các hoạt động từ cộng đồng FPTU</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "CLB đã từng tham gia", value: stats.clubCount,    icon: Star,     color: "#E6430A", bg: "#FFF3EE" },
          { label: "Sự kiện sắp tới",      value: stats.eventCount,   icon: Calendar, color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Kết nối Alumni",        value: stats.networkCount, icon: Users,    color: "#059669", bg: "#ecfdf5" },
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

      <div className="bg-white rounded-[14px] p-5 border border-[#f0f0f0]">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-1.5">
          <TrendingUp size={15} color="#9ca3af" /> Tin tức nổi bật
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {news.map((n) => (
              <div key={n.id} className="flex items-center gap-3.5 px-4 py-3 rounded-[10px] bg-gray-50">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF3EE] text-[#E6430A] shrink-0">
                  {n.tag}
                </span>
                <p className="flex-1 text-[13px] font-medium text-gray-900 m-0">{n.title}</p>
                <span className="text-[11px] text-gray-400 shrink-0">{n.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
