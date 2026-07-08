import { BarChart2, Users, Calendar, TrendingUp, Award, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import clubBoardApi from "../../services/api/club-leader/clubBoardApi";
import eventService from "../../services/api/events/eventService";
import { TokenService } from "../../services/api/axiosClient";

const MONTH_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

function SimpleBarChart({ data, color = "#E6430A" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-[10.5px] font-bold text-gray-700">{d.value > 0 ? d.value : ""}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 100, d.value > 0 ? 8 : 2)}%`,
              background: color,
              opacity: d.value === 0 ? 0.15 : 1,
            }}
          />
          <span className="text-[10px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ClubReports() {
  const [memberCount, setMemberCount] = useState(null);
  const [eventData, setEventData]     = useState([]);
  const [evLoading, setEvLoading]     = useState(true);
  const clubId = TokenService.getClubId();

  useEffect(() => {
    if (!clubId) return;
    clubBoardApi.getBoard(clubId)
      .then((data) => setMemberCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [clubId]);

  useEffect(() => {
    eventService.getClubEvents?.()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
        const counts = Array(12).fill(0);
        list.forEach((ev) => {
          const date = ev.startDate ?? ev.eventDate;
          if (date) {
            const month = new Date(date).getMonth();
            if (month >= 0 && month < 12) counts[month]++;
          }
        });
        setEventData(MONTH_LABELS.map((label, i) => ({ label, value: counts[i] })));
      })
      .catch(() => {
        setEventData(MONTH_LABELS.map((label) => ({ label, value: 0 })));
      })
      .finally(() => setEvLoading(false));
  }, [clubId]);

  const stats = [
    { label: "Thành viên BĐH",    value: memberCount ?? "—", icon: Users,      color: "#E6430A", bg: "#FFF3EE" },
    { label: "Sự kiện đã tổ chức", value: eventData.reduce((s, d) => s + d.value, 0) || "—", icon: Calendar,   color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Tỉ lệ tham gia",    value: "85%",               icon: TrendingUp, color: "#059669", bg: "#ecfdf5" },
    { label: "Chứng nhận cấp",    value: 0,                   icon: Award,      color: "#d97706", bg: "#fffbeb" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Báo Cáo CLB</h1>
        <p className="page-subtitle">Thống kê hoạt động và số liệu của câu lạc bộ</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-[14px] p-5 border border-[#f0f0f0] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p className="text-[1.4rem] font-bold text-gray-900 m-0">{s.value}</p>
              <p className="text-xs text-gray-400 m-0">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-card">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={18} color="#9ca3af" />
          <h3 className="text-sm font-bold text-gray-700 m-0">Sự kiện theo tháng</h3>
        </div>
        {evLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          <SimpleBarChart data={eventData} color="#E6430A" />
        )}
      </div>
    </div>
  );
}
