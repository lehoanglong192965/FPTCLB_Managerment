import { BarChart2, Users, Calendar, TrendingUp, Award, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import clubBoardApi from "../../services/api/club-leader/clubBoardApi";
import attendanceApi from "../../services/api/attendance/attendanceApi";
import clubApi from "../../services/api/clubs/clubApi";
import { TokenService } from "../../services/api/axiosClient";

const MONTH_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const FINISHED_EVENT_STATUSES = new Set([
  "COMPLETED",
  "REPORTUPLOADED",
  "REPORTPENDINGAPPROVAL",
  "REPORTAPPROVED",
  "REPORTREJECTED",
  "CONTRIBUTIONFINALIZED",
  "CLOSED",
]);

function resolveClubId() {
  const fromToken = TokenService.getClubId();
  if (fromToken) return fromToken;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.clubId ?? null;
  } catch {
    return null;
  }
}

function asArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function normalizeStatus(value) {
  return String(value ?? "").replace(/[\s_-]/g, "").toUpperCase();
}

function normalizeEvent(event) {
  return {
    eventID: event.eventID ?? event.id,
    eventName: event.eventName ?? event.name ?? "",
    eventStatus: event.eventStatus ?? event.status ?? "",
    startDate: event.startDate ?? event.eventDate ?? event.date ?? event.createdAt ?? event.createdDate,
  };
}

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
  const [eventData, setEventData] = useState(MONTH_LABELS.map((label) => ({ label, value: 0 })));
  const [evLoading, setEvLoading] = useState(true);
  const [eventCount, setEventCount] = useState(null);
  const [attendanceRate, setAttendanceRate] = useState(null);
  const [error, setError] = useState("");
  const clubId = resolveClubId();

  useEffect(() => {
    if (!clubId) {
      setMemberCount(0);
      return;
    }
    clubBoardApi.getBoard(clubId)
      .then((data) => setMemberCount(asArray(data).length))
      .catch(() => setMemberCount(0));
  }, [clubId]);

  useEffect(() => {
    if (!clubId) {
      setEventData(MONTH_LABELS.map((label) => ({ label, value: 0 })));
      setEventCount(0);
      setAttendanceRate(null);
      setEvLoading(false);
      setError("Không xác định được CLB của tài khoản hiện tại.");
      return;
    }

    let cancelled = false;
    setEvLoading(true);
    setError("");

    clubApi.getAllEvents(clubId)
      .then(async (res) => {
        if (cancelled) return;

        const events = asArray(res).map(normalizeEvent);
        const finishedEvents = events.filter((event) => FINISHED_EVENT_STATUSES.has(normalizeStatus(event.eventStatus)));
        const chartEvents = finishedEvents.length > 0 ? finishedEvents : events;
        const counts = Array(12).fill(0);

        chartEvents.forEach((event) => {
          if (!event.startDate) return;
          const date = new Date(event.startDate);
          if (Number.isNaN(date.getTime())) return;
          const month = date.getMonth();
          if (month >= 0 && month < 12) counts[month] += 1;
        });

        const summaries = await Promise.allSettled(
          finishedEvents
            .filter((event) => event.eventID)
            .map((event) => attendanceApi.getEventAttendanceSummary(event.eventID))
        );
        if (cancelled) return;

        const totals = summaries.reduce((acc, item) => {
          if (item.status !== "fulfilled") return acc;
          return {
            registered: acc.registered + Number(item.value?.totalRegistered ?? 0),
            present: acc.present + Number(item.value?.totalPresent ?? item.value?.totalCheckedIn ?? 0),
          };
        }, { registered: 0, present: 0 });

        setEventCount(finishedEvents.length);
        setAttendanceRate(totals.registered > 0 ? Math.round((totals.present / totals.registered) * 100) : null);
        setEventData(MONTH_LABELS.map((label, index) => ({ label, value: counts[index] })));
      })
      .catch((err) => {
        if (cancelled || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setError("Không tải được dữ liệu báo cáo CLB.");
        setEventCount(0);
        setAttendanceRate(null);
        setEventData(MONTH_LABELS.map((label) => ({ label, value: 0 })));
      })
      .finally(() => {
        if (!cancelled) setEvLoading(false);
      });

    return () => { cancelled = true; };
  }, [clubId]);

  const stats = [
    { label: "Thành viên BĐH", value: memberCount ?? "-", icon: Users, color: "#E6430A", bg: "#FFF3EE" },
    { label: "Sự kiện đã tổ chức", value: eventCount ?? "-", icon: Calendar, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Tỉ lệ tham gia", value: attendanceRate == null ? "-" : `${attendanceRate}%`, icon: TrendingUp, color: "#059669", bg: "#ecfdf5" },
    { label: "Chứng nhận cấp", value: 0, icon: Award, color: "#d97706", bg: "#fffbeb" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Báo Cáo CLB</h1>
        <p className="page-subtitle">Thống kê hoạt động và số liệu của câu lạc bộ</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-[14px] p-5 border border-[#f0f0f0] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: stat.bg }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <p className="text-[1.4rem] font-bold text-gray-900 m-0">{stat.value}</p>
              <p className="text-xs text-gray-400 m-0">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-card">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={18} color="#9ca3af" />
          <h3 className="text-sm font-bold text-gray-700 m-0">Sự kiện theo tháng</h3>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-orange-100 bg-orange-50 px-4 py-2 text-sm text-orange-700">
            {error}
          </div>
        )}
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
