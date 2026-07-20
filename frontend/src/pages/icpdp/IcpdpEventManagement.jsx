import { useEffect, useMemo, useState } from "react";
import {
  Calendar, Search, PlayCircle, XCircle, CheckCircle2, Clock, X,
  ChevronRight, Loader2, Users, MapPin, Building2, ClipboardCheck, FileText,
} from "lucide-react";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import semesterApi from "../../services/api/admin/semesterApi";
import { getServerOrigin } from "../../services/api/axiosClient";
import IcpdpEventApproval from "./IcpdpEventApproval";
import IcpdpReportReview from "./IcpdpReportReview";

const PAGE_TABS = [
  { key: "list",     label: "Danh sách sự kiện", Icon: Calendar },
  { key: "approval", label: "Phê duyệt",          Icon: ClipboardCheck },
  { key: "report",   label: "Báo cáo",             Icon: FileText },
];

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

// Gom mọi eventStatus thực tế của backend về 5 nhóm mà trang tổng quan này cần theo dõi.
// Các trạng thái hậu kỳ (báo cáo/đóng góp/đã đóng...) đều gộp vào "Đã kết thúc" vì phần
// duyệt báo cáo & đóng góp đã có trang riêng (Duyệt Báo Cáo).
const STATUS_GROUP = {
  APPROVED: "upcoming",
  REGISTRATION_CLOSED: "upcoming",
  REGISTRATION_OPEN: "open",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  REPORT_UPLOADED: "completed",
  REPORT_PENDING_APPROVAL: "completed",
  REPORT_APPROVED: "completed",
  REPORT_REJECTED: "completed",
  CONTRIBUTION_DRAFT: "completed",
  CONTRIBUTION_PENDING_APPROVAL: "completed",
  CONTRIBUTION_APPROVED: "completed",
  CONTRIBUTION_SCORING: "completed",
  CONTRIBUTION_FINALIZED: "completed",
  CLOSED: "completed",
  CANCELLED: "cancelled",
};

// Màu đồng bộ với STATUS_BADGE (EventDetailPage.jsx) / BADGE (EventCard.jsx)
const GROUP_CFG = {
  upcoming: { label: "Sắp diễn ra", color: "#2563EB", bg: "#DBEAFE", Icon: Clock },
  open: { label: "Mở đăng ký", color: "#F37021", bg: "#FFF3EC", Icon: Users },
  ongoing: { label: "Đang diễn ra", color: "#16A34A", bg: "#DCFCE7", Icon: PlayCircle },
  completed: { label: "Đã kết thúc", color: "#6B7280", bg: "#F3F4F6", Icon: CheckCircle2 },
  cancelled: { label: "Đã hủy", color: "#DC2626", bg: "#FEE2E2", Icon: XCircle },
};

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "open", label: "Mở đăng ký" },
  { value: "ongoing", label: "Đang diễn ra" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã hủy" },
];

function StatusBadge({ group }) {
  const cfg = GROUP_CFG[group] ?? GROUP_CFG.upcoming;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <cfg.Icon size={12} /> {cfg.label}
    </span>
  );
}

function DetailModal({ event, onClose }) {
  const dateStr = event.startDate
    ? new Date(event.startDate).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "Chưa xác định";
  const timeStr = event.startDate
    ? new Date(event.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";
  const endTimeStr = event.endDate
    ? new Date(event.endDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {event.bannerUrl && (
          <div
            className="w-full h-[160px] rounded-t-2xl"
            style={{ backgroundImage: `url(${getImageUrl(event.bannerUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        )}
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 m-0 mb-1.5">{event.eventName}</h3>
              <StatusBadge group={event.statusGroup} />
            </div>
            <button onClick={onClose} className="bg-none border-none cursor-pointer text-gray-400 hover:text-gray-600 p-1 shrink-0">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 text-[13px] text-gray-600 mt-4">
            <span className="flex items-center gap-2">
              <Building2 size={14} className="text-gray-400" /> {event.clubName}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" /> {dateStr}{timeStr ? ` · ${timeStr}${endTimeStr ? `–${endTimeStr}` : ""}` : ""}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" /> {event.location || event.venueName || "Chưa xếp phòng"}
            </span>
            {Number.isFinite(event.maxParticipants) && event.maxParticipants > 0 && (
              <span className="flex items-center gap-2">
                <Users size={14} className="text-gray-400" />
                {event.currentParticipants ?? 0}/{event.maxParticipants} người đã đăng ký
              </span>
            )}
          </div>

          {event.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[12.5px] font-semibold text-gray-700 mb-1.5">Mô tả</p>
              <p className="text-[13px] text-gray-500 whitespace-pre-line m-0">{event.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IcpdpEventManagement() {
  const [tab, setTab] = useState("list");
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [eventRows, clubRows, semesterRows] = await Promise.all([
          eventApi.getAllForIcpdp(),
          clubApi.getAll(),
          semesterApi.getAll(),
        ]);
        if (cancelled) return;

        const rawSemesters = Array.isArray(semesterRows) ? semesterRows : (semesterRows?.data ?? semesterRows?.content ?? []);
        const normalizedSemesters = rawSemesters.map((item) => ({
          id: item.semesterID ?? item.semesterId ?? item.id,
          code: item.semesterCode ?? item.code ?? `Học kỳ ${item.semesterID ?? item.id}`,
          isActive: Boolean(item.isActive),
        })).filter((item) => item.id);
        const preferredSemester = normalizedSemesters.find((item) => item.isActive) ?? normalizedSemesters[0];
        setSemesters(normalizedSemesters);
        setSemester(String(preferredSemester?.id ?? ""));

        const rawClubs = Array.isArray(clubRows) ? clubRows : (clubRows?.data ?? clubRows?.content ?? []);
        setClubs(rawClubs);

        const rawEvents = Array.isArray(eventRows) ? eventRows : (eventRows?.data ?? eventRows?.content ?? []);
        setEvents(rawEvents);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message ?? "Không thể tải danh sách sự kiện.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    return events
      .filter((e) => !semester || String(e.semesterID) === String(semester))
      .map((e) => {
        const club = clubs.find((c) => c.clubID === e.clubID);
        return {
          ...e,
          clubName: club?.name ?? "CLB FPTU",
          statusGroup: STATUS_GROUP[e.eventStatus] ?? "upcoming",
        };
      })
      .sort((a, b) => new Date(b.startDate ?? 0) - new Date(a.startDate ?? 0));
  }, [events, clubs, semester]);

  const filtered = rows.filter((e) => {
    if (statusFilter !== "all" && e.statusGroup !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    return !q || e.eventName?.toLowerCase().includes(q) || e.clubName?.toLowerCase().includes(q);
  });

  const stats = useMemo(() => ({
    upcoming: rows.filter((e) => e.statusGroup === "upcoming").length,
    ongoing: rows.filter((e) => e.statusGroup === "ongoing").length,
    completed: rows.filter((e) => e.statusGroup === "completed").length,
  }), [rows]);

  const STAT_TILES = [
    { key: "upcoming", label: "Sắp diễn ra", value: stats.upcoming, color: "#2563EB", bg: "#DBEAFE", Icon: Clock },
    { key: "ongoing", label: "Đang diễn ra", value: stats.ongoing, color: "#16A34A", bg: "#DCFCE7", Icon: PlayCircle },
    { key: "completed", label: "Đã kết thúc", value: stats.completed, color: "#6B7280", bg: "#F3F4F6", Icon: CheckCircle2 },
  ];

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 page-header">
        <div>
          <h1 className="page-title">Quản Lý Sự Kiện</h1>
          <p className="page-subtitle">Theo dõi toàn bộ vòng đời sự kiện của các câu lạc bộ trong hệ thống</p>
        </div>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="px-3.5 py-2 rounded-[10px] border-[1.5px] border-gray-200 bg-white text-[13px] font-semibold text-gray-700 outline-none cursor-pointer font-[inherit]"
        >
          {semesters.map((s) => <option key={s.id} value={s.id}>Học kỳ: {s.code}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-[13px] text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Đang tải dữ liệu sự kiện...
        </div>
      )}

      {/* Stat tiles — 1 card gộp 3 mục, ngăn cách bằng đường kẻ dọc */}
      <div className="bg-white rounded-2xl border border-[#f0f0f0] px-6 py-5 mb-5">
        <p className="text-[13.5px] font-bold text-gray-700 m-0 mb-4">Tổng Quan Sự Kiện</p>
        <div className="grid grid-cols-3 divide-x divide-gray-100 max-[720px]:grid-cols-1 max-[720px]:divide-x-0 max-[720px]:divide-y">
          {STAT_TILES.map((t) => (
            <div key={t.key} className="flex items-center gap-3 px-5 first:pl-0 last:pr-0 max-[720px]:py-3 max-[720px]:first:pt-0 max-[720px]:last:pb-0">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: t.bg }}>
                <t.Icon size={20} color={t.color} />
              </div>
              <div>
                <p className="text-[1.4rem] font-extrabold text-gray-900 m-0 leading-tight">{t.value}</p>
                <p className="text-[12px] text-gray-400 m-0 mt-0.5">{t.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab: Danh sách sự kiện / Phê duyệt / Báo cáo */}
      <div className="flex items-center gap-1.5 mb-6 border-b border-slate-200">
        {PAGE_TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-semibold border-0 border-b-2 bg-transparent cursor-pointer font-[inherit] transition-colors -mb-px ${
                active
                  ? "text-[#E6430A] border-[#E6430A]"
                  : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          );
        })}
      </div>

      {tab === "approval" && <IcpdpEventApproval embedded />}
      {tab === "report" && <IcpdpReportReview embedded />}

      {tab === "list" && (<>

      {/* Filters — đồng bộ với các trang danh sách khác (ClubEventsMgmt, IcpdpEventApproval,
          IcpdpClubManagement): ô tìm kiếm riêng 1 hàng, bên dưới là tab gạch chân có số đếm,
          màu nhấn cam đồng nhất thay vì đổi màu theo từng trạng thái. */}
      <div className="mb-4">
        <div className="relative max-w-sm mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sự kiện, câu lạc bộ..."
            className="w-full pl-8 pr-3 py-2 rounded-[10px] border-[1.5px] border-gray-200 text-[13px] outline-none box-border font-[inherit] focus:border-[#E6430A]"
          />
        </div>

        <div className="flex gap-0 border-b-2 border-gray-200 flex-wrap">
          {FILTER_OPTIONS.map(({ value, label }) => {
            const active = statusFilter === value;
            const count = value === "all" ? rows.length : rows.filter((e) => e.statusGroup === value).length;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 font-[inherit] bg-transparent ${
                  active ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${active ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 w-10">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500">Sự kiện</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500">Câu lạc bộ</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500">Thời gian</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-500">Đăng ký</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500">Trạng thái</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, idx) => (
              <tr
                key={e.eventID}
                onClick={() => setSelected(e)}
                className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-orange-50/40 transition-colors"
              >
                <td className="px-4 py-3.5 text-gray-400 font-semibold">{idx + 1}</td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-gray-900 m-0">{e.eventName}</p>
                </td>
                <td className="px-4 py-3.5 text-gray-600">{e.clubName}</td>
                <td className="px-4 py-3.5 text-gray-600">
                  {e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3.5 text-center text-gray-600">
                  {Number.isFinite(e.maxParticipants) && e.maxParticipants > 0
                    ? `${e.currentParticipants ?? 0}/${e.maxParticipants}`
                    : "—"}
                </td>
                <td className="px-4 py-3.5"><StatusBadge group={e.statusGroup} /></td>
                <td className="pr-3"><ChevronRight size={15} className="text-gray-300" /></td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-[13px]">
                  Không có sự kiện nào khớp bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <DetailModal event={selected} onClose={() => setSelected(null)} />}
      </>)}
    </div>
  );
}
