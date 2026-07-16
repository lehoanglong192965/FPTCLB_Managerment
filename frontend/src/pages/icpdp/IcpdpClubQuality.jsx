import { useMemo, useState } from "react";
import {
  Gauge, Search, Users, Calendar, Star, ShieldCheck, Sparkles,
  TrendingUp, TrendingDown, Minus, AlertTriangle, X, PauseCircle,
  PlayCircle, CheckCircle2, ChevronRight,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

/* =========================================================================
 * MOCKDATA — trang đang chạy dữ liệu giả để duyệt UI.
 * Khi nối API thật: thay MOCK_CLUBS bằng GET /icpdp/clubs/quality,
 * hành động dừng/khôi phục gọi PATCH /icpdp/clubs/{id}/status.
 * ========================================================================= */

// Trọng số 5 nhóm điểm (tổng 100) — khớp đề xuất công thức KPI
const SCORE_GROUPS = [
  { key: "scale",      label: "Quy mô & giữ chân",   weight: 25, icon: Users },
  { key: "activity",   label: "Mức độ hoạt động",    weight: 25, icon: Calendar },
  { key: "quality",    label: "Chất lượng sự kiện",  weight: 20, icon: Star },
  { key: "compliance", label: "Tuân thủ",            weight: 20, icon: ShieldCheck },
  { key: "appeal",     label: "Sức hút tuyển quân",  weight: 10, icon: Sparkles },
];

const TIER_CFG = {
  A: { label: "Tier A", color: "#059669", bg: "#ecfdf5", desc: "Xuất sắc" },
  B: { label: "Tier B", color: "#2563eb", bg: "#eff6ff", desc: "Tốt" },
  C: { label: "Tier C", color: "#d97706", bg: "#fffbeb", desc: "Cần cải thiện" },
  D: { label: "Tier D", color: "#dc2626", bg: "#fef2f2", desc: "Báo động" },
};

const tierOf = (score) => (score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D");

const MOCK_CLUBS = [
  {
    clubID: 1, clubName: "F-Code", category: "Học thuật", emoji: "💻", status: "Active",
    members: 86, memberDelta: +12, eventsHeld: 9, eventsCancelled: 0,
    avgFeedback: 4.6, attendanceRate: 91, reportOnTime: 100, disciplineCount: 0, applications: 124,
    scores: { scale: 92, activity: 88, quality: 90, compliance: 100, appeal: 95 },
    history: [78, 84, 91], redFlags: [],
  },
  {
    clubID: 2, clubName: "FPTU Guitar Club", category: "Nghệ thuật", emoji: "🎸", status: "Active",
    members: 54, memberDelta: +3, eventsHeld: 6, eventsCancelled: 1,
    avgFeedback: 4.2, attendanceRate: 84, reportOnTime: 83, disciplineCount: 0, applications: 67,
    scores: { scale: 74, activity: 70, quality: 80, compliance: 78, appeal: 72 },
    history: [70, 73, 75], redFlags: [],
  },
  {
    clubID: 3, clubName: "Vovinam FPTU", category: "Thể thao", emoji: "🥋", status: "Active",
    members: 41, memberDelta: -2, eventsHeld: 5, eventsCancelled: 1,
    avgFeedback: 4.0, attendanceRate: 79, reportOnTime: 80, disciplineCount: 1, applications: 38,
    scores: { scale: 62, activity: 66, quality: 71, compliance: 64, appeal: 58 },
    history: [71, 66, 66], redFlags: ["1 vụ kỷ luật trong kỳ"],
  },
  {
    clubID: 4, clubName: "Business Club", category: "Học thuật", emoji: "📈", status: "Active",
    members: 28, memberDelta: -9, eventsHeld: 2, eventsCancelled: 2,
    avgFeedback: 3.4, attendanceRate: 61, reportOnTime: 50, disciplineCount: 1, applications: 15,
    scores: { scale: 44, activity: 38, quality: 52, compliance: 45, appeal: 40 },
    history: [58, 51, 44],
    redFlags: ["Giảm 9 thành viên so với kỳ trước", "50% sự kiện bị huỷ", "Nộp báo cáo trễ 2 lần"],
  },
  {
    clubID: 5, clubName: "Photography Club", category: "Nghệ thuật", emoji: "📷", status: "Active",
    members: 33, memberDelta: +1, eventsHeld: 0, eventsCancelled: 0,
    avgFeedback: null, attendanceRate: null, reportOnTime: null, disciplineCount: 0, applications: 21,
    scores: { scale: 55, activity: 10, quality: 30, compliance: 60, appeal: 48 },
    history: [64, 49, 37],
    redFlags: ["Không tổ chức sự kiện nào trong kỳ", "Tier D 2 kỳ liên tiếp"],
  },
  {
    clubID: 6, clubName: "Board Game Club", category: "Giải trí", emoji: "🎲", status: "Inactive",
    members: 4, memberDelta: -11, eventsHeld: 0, eventsCancelled: 0,
    avgFeedback: null, attendanceRate: null, reportOnTime: null, disciplineCount: 0, applications: 3,
    scores: { scale: 8, activity: 5, quality: 20, compliance: 55, appeal: 12 },
    history: [42, 25, 14],
    redFlags: ["Dưới 5 thành viên (BR-B07)", "Đã bị hệ thống tự tạm dừng"],
    suspendReason: "Tự động tạm dừng: số thành viên dưới mức tối thiểu 5 người (BR-B07).",
  },
];

const MOCK_SEMESTERS = ["Summer 2026", "Spring 2026", "Fall 2025"];

const totalScore = (scores) =>
  Math.round(SCORE_GROUPS.reduce((sum, g) => sum + (scores[g.key] ?? 0) * g.weight, 0) / 100);

/* ── Small pieces ─────────────────────────────────────────────── */

function TierBadge({ tier }) {
  const cfg = TIER_CFG[tier];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-bold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}
    >
      {cfg.label}
    </span>
  );
}

function TrendIcon({ history }) {
  if (history.length < 2) return <Minus size={14} className="text-gray-400" />;
  const diff = history[history.length - 1] - history[history.length - 2];
  if (diff > 2)  return <TrendingUp size={14} className="text-emerald-500" />;
  if (diff < -2) return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

function ScoreBar({ value, color }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

/** Cột lịch sử điểm 3 kỳ gần nhất (mini bar chart). */
function HistoryBars({ history }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {history.map((v, i) => {
        const isLast = i === history.length - 1;
        return (
          <div
            key={i}
            title={`${MOCK_SEMESTERS[MOCK_SEMESTERS.length - history.length + i] ?? ""}: ${v} điểm`}
            className="w-2.5 rounded-sm"
            style={{
              height: `${Math.max(v, 6)}%`,
              minHeight: 3,
              background: isLast ? TIER_CFG[tierOf(v)].color : "#e5e7eb",
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Suspend reason modal ─────────────────────────────────────── */

function SuspendModal({ club, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const isValid = reason.trim().length >= 10;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-1">
          <PauseCircle size={19} className="text-red-500" />
          <h3 className="text-[15px] font-bold text-gray-900 m-0">Tạm dừng hoạt động CLB</h3>
        </div>
        <p className="text-[13px] text-gray-500 m-0 mb-4">
          {club.emoji} <strong>{club.clubName}</strong> sẽ chuyển sang trạng thái Inactive —
          ẩn khỏi danh sách công khai và không thể tổ chức hoạt động mới.
        </p>
        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
          Lý do tạm dừng <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Tối thiểu 10 ký tự — lý do sẽ được ghi log và gửi cho Leader CLB..."
          className="w-full rounded-[10px] border-[1.5px] border-gray-200 p-3 text-[13px] outline-none focus:border-red-400 box-border font-[inherit] resize-y"
        />
        {touched && !isValid && (
          <p className="text-[12px] text-red-500 mt-1 m-0">⚠ Vui lòng nhập lý do tối thiểu 10 ký tự.</p>
        )}
        <div className="flex justify-end gap-2.5 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] border-[1.5px] border-gray-200 bg-white text-gray-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={() => (isValid ? onConfirm(reason.trim()) : setTouched(true))}
            className="px-4 py-2 rounded-[10px] border-none text-white text-[13px] font-bold cursor-pointer font-[inherit]"
            style={{ background: isValid ? "#dc2626" : "#fca5a5" }}
          >
            Xác nhận tạm dừng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Detail panel ─────────────────────────────────────────────── */

function DetailPanel({ club, onClose, onSuspend, onReactivate, onKeep }) {
  const score = totalScore(club.scores);
  const tier = tierOf(score);
  const cfg = TIER_CFG[tier];

  const metricRows = [
    { label: "Thành viên", value: `${club.members} (${club.memberDelta >= 0 ? "+" : ""}${club.memberDelta} so với kỳ trước)` },
    { label: "Sự kiện đã tổ chức", value: `${club.eventsHeld}${club.eventsCancelled ? ` (huỷ ${club.eventsCancelled})` : ""}` },
    { label: "Feedback trung bình", value: club.avgFeedback != null ? `${club.avgFeedback}/5` : "Chưa có dữ liệu" },
    { label: "Tỷ lệ điểm danh", value: club.attendanceRate != null ? `${club.attendanceRate}%` : "Chưa có dữ liệu" },
    { label: "Báo cáo đúng hạn", value: club.reportOnTime != null ? `${club.reportOnTime}%` : "Chưa có dữ liệu" },
    { label: "Vụ kỷ luật trong kỳ", value: String(club.disciplineCount) },
    { label: "Đơn ứng tuyển kỳ này", value: String(club.applications) },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="text-[28px]">{club.emoji}</span>
            <div>
              <h3 className="text-[17px] font-bold text-gray-900 m-0">{club.clubName}</h3>
              <p className="text-[12.5px] text-gray-400 m-0">{club.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-none border-none cursor-pointer text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Score hero */}
          <div className="flex items-center gap-5 rounded-2xl p-4 mb-5" style={{ background: cfg.bg }}>
            <div
              className="w-[76px] h-[76px] rounded-full flex flex-col items-center justify-center shrink-0 bg-white"
              style={{ border: `4px solid ${cfg.color}` }}
            >
              <span className="text-[22px] font-extrabold leading-none" style={{ color: cfg.color }}>{score}</span>
              <span className="text-[10px] text-gray-400 font-semibold">/100</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TierBadge tier={tier} />
                <span className="text-[12.5px] font-semibold" style={{ color: cfg.color }}>{cfg.desc}</span>
                {club.status === "Inactive" && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-200 text-gray-600">Đang tạm dừng</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <HistoryBars history={club.history} />
                <span className="text-[11.5px] text-gray-500">Điểm 3 kỳ gần nhất</span>
              </div>
            </div>
          </div>

          {/* Red flags */}
          {club.redFlags.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 mb-5">
              <p className="text-[13px] font-bold text-red-600 m-0 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Cảnh báo
              </p>
              <ul className="m-0 pl-5 flex flex-col gap-1">
                {club.redFlags.map((f) => (
                  <li key={f} className="text-[12.5px] text-red-500">{f}</li>
                ))}
              </ul>
              {club.suspendReason && (
                <p className="text-[12px] text-gray-500 m-0 mt-2 pt-2 border-t border-red-100">
                  Lý do tạm dừng: {club.suspendReason}
                </p>
              )}
            </div>
          )}

          {/* Breakdown 5 nhóm */}
          <p className="text-[13px] font-bold text-gray-700 mb-2.5">Điểm thành phần</p>
          <div className="flex flex-col gap-3 mb-5">
            {SCORE_GROUPS.map((g) => {
              const v = club.scores[g.key] ?? 0;
              const color = TIER_CFG[tierOf(v)].color;
              return (
                <div key={g.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12.5px] text-gray-600 flex items-center gap-1.5">
                      <g.icon size={13} className="text-gray-400" />
                      {g.label}
                      <span className="text-[10.5px] text-gray-300 font-semibold">({g.weight}%)</span>
                    </span>
                    <span className="text-[12.5px] font-bold" style={{ color }}>{v}</span>
                  </div>
                  <ScoreBar value={v} color={color} />
                </div>
              );
            })}
          </div>

          {/* Metrics chi tiết */}
          <p className="text-[13px] font-bold text-gray-700 mb-2">Chỉ số trong kỳ</p>
          <div className="rounded-xl border border-gray-100 mb-6">
            {metricRows.map((r, i) => (
              <div
                key={r.label}
                className={`flex justify-between items-center px-3.5 py-2.5 ${i > 0 ? "border-t border-gray-50" : ""}`}
              >
                <span className="text-[12.5px] text-gray-500">{r.label}</span>
                <span className="text-[12.5px] font-semibold text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Quyết định */}
          <div className="flex gap-2.5">
            {club.status === "Active" ? (
              <>
                <button
                  onClick={onKeep}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] border-[1.5px] border-emerald-200 bg-emerald-50 text-emerald-600 text-[13px] font-bold cursor-pointer font-[inherit] hover:bg-emerald-100"
                >
                  <CheckCircle2 size={15} /> Duy trì hoạt động
                </button>
                <button
                  onClick={onSuspend}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none bg-red-500 text-white text-[13px] font-bold cursor-pointer font-[inherit] hover:bg-red-600"
                >
                  <PauseCircle size={15} /> Tạm dừng CLB
                </button>
              </>
            ) : (
              <button
                onClick={onReactivate}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none bg-emerald-500 text-white text-[13px] font-bold cursor-pointer font-[inherit] hover:bg-emerald-600"
              >
                <PlayCircle size={15} /> Khôi phục hoạt động
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */

/**
 * @param embedded — true khi được nhúng làm tab trong trang Quản Lý CLB:
 *                   ẩn tiêu đề trang riêng, chỉ giữ dropdown chọn học kỳ.
 */
export default function IcpdpClubQuality({ embedded = false }) {
  const toast = useToast();
  const [clubs, setClubs] = useState(MOCK_CLUBS);
  const [semester, setSemester] = useState(MOCK_SEMESTERS[0]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const ranked = useMemo(
    () => [...clubs].sort((a, b) => totalScore(b.scores) - totalScore(a.scores)),
    [clubs],
  );

  const filtered = ranked.filter((c) => {
    if (tierFilter !== "ALL" && tierOf(totalScore(c.scores)) !== tierFilter) return false;
    const q = search.trim().toLowerCase();
    return !q || c.clubName.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  const stats = useMemo(() => {
    const scores = clubs.map((c) => totalScore(c.scores));
    return {
      total: clubs.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1)),
      alert: clubs.filter((c) => tierOf(totalScore(c.scores)) === "D").length,
      inactive: clubs.filter((c) => c.status === "Inactive").length,
    };
  }, [clubs]);

  const updateClub = (clubID, patch) =>
    setClubs((prev) => prev.map((c) => (c.clubID === clubID ? { ...c, ...patch } : c)));

  const handleSuspendConfirm = (reason) => {
    updateClub(suspendTarget.clubID, { status: "Inactive", suspendReason: reason });
    setSuspendTarget(null);
    setSelected(null);
    toast.success(`Đã tạm dừng hoạt động ${suspendTarget.clubName}. (Mock — chưa gọi API)`);
  };

  const handleReactivate = (club) => {
    updateClub(club.clubID, { status: "Active", suspendReason: undefined });
    setSelected(null);
    toast.success(`Đã khôi phục hoạt động ${club.clubName}. (Mock — chưa gọi API)`);
  };

  const handleKeep = (club) => {
    setSelected(null);
    toast.success(`Đã ghi nhận quyết định duy trì hoạt động ${club.clubName}. (Mock — chưa gọi API)`);
  };

  const STAT_TILES = [
    { label: "CLB được đánh giá", value: stats.total, color: "#E6430A", bg: "#FFF3EE", Icon: Gauge },
    { label: "Điểm trung bình",   value: stats.avg,   color: "#2563eb", bg: "#eff6ff", Icon: Star },
    { label: "CLB báo động (Tier D)", value: stats.alert, color: "#dc2626", bg: "#fef2f2", Icon: AlertTriangle },
    { label: "Đang tạm dừng",     value: stats.inactive, color: "#6b7280", bg: "#f3f4f6", Icon: PauseCircle },
  ];

  return (
    <div>
      {/* Header — khi nhúng vào tab của Quản Lý CLB thì chỉ giữ dropdown học kỳ */}
      <div className={`flex items-start justify-between flex-wrap gap-3 ${embedded ? "mb-4" : "page-header"}`}>
        {embedded ? (
          <p className="text-[13px] text-gray-500 m-0 self-center">
            Đánh giá KPI từng câu lạc bộ — cơ sở quyết định duy trì hay tạm dừng hoạt động
          </p>
        ) : (
          <div>
            <h1 className="page-title">Tổng Quan CLB</h1>
            <p className="page-subtitle">Đánh giá KPI từng câu lạc bộ — cơ sở quyết định duy trì hay tạm dừng hoạt động</p>
          </div>
        )}
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="px-3.5 py-2 rounded-[10px] border-[1.5px] border-gray-200 bg-white text-[13px] font-semibold text-gray-700 outline-none cursor-pointer font-[inherit]"
        >
          {MOCK_SEMESTERS.map((s) => <option key={s} value={s}>Học kỳ: {s}</option>)}
        </select>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-4 mb-5 max-[900px]:grid-cols-2">
        {STAT_TILES.map((t) => (
          <div key={t.label} className="bg-white rounded-[14px] p-4 border border-[#f0f0f0] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg }}>
              <t.Icon size={18} color={t.color} />
            </div>
            <div>
              <p className="text-[1.25rem] font-bold text-gray-900 m-0 leading-tight">{t.value}</p>
              <p className="text-[11.5px] text-gray-400 m-0">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên CLB, lĩnh vực..."
            className="w-full pl-8 pr-3 py-2 rounded-[10px] border-[1.5px] border-gray-200 text-[13px] outline-none box-border font-[inherit] focus:border-[#E6430A]"
          />
        </div>
        {["ALL", "A", "B", "C", "D"].map((t) => {
          const active = tierFilter === t;
          const color = t === "ALL" ? "#E6430A" : TIER_CFG[t].color;
          return (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className="px-3 py-1.5 rounded-full text-[12px] font-bold cursor-pointer font-[inherit] transition-colors"
              style={{
                border: `1.5px solid ${active ? color : "#e5e7eb"}`,
                background: active ? color : "#fff",
                color: active ? "#fff" : "#6b7280",
              }}
            >
              {t === "ALL" ? "Tất cả" : `Tier ${t}`}
            </button>
          );
        })}
      </div>

      {/* Ranking table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 w-10">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500">Câu lạc bộ</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 w-[180px]">Điểm KPI</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500">Tier</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-500">Thành viên</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-500">Sự kiện</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-500">Xu hướng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500">Trạng thái</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => {
              const score = totalScore(c.scores);
              const tier = tierOf(score);
              const cfg = TIER_CFG[tier];
              return (
                <tr
                  key={c.clubID}
                  onClick={() => setSelected(c)}
                  className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-orange-50/40 transition-colors"
                  style={{ opacity: c.status === "Inactive" ? 0.65 : 1 }}
                >
                  <td className="px-4 py-3.5 text-gray-400 font-semibold">{idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[20px]">{c.emoji}</span>
                      <div>
                        <p className="font-semibold text-gray-900 m-0 flex items-center gap-1.5">
                          {c.clubName}
                          {c.redFlags.length > 0 && (
                            <AlertTriangle size={13} className="text-red-500" title={c.redFlags.join(" · ")} />
                          )}
                        </p>
                        <p className="text-[11.5px] text-gray-400 m-0">{c.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-[15px] w-8 text-right" style={{ color: cfg.color }}>{score}</span>
                      <div className="flex-1"><ScoreBar value={score} color={cfg.color} /></div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><TierBadge tier={tier} /></td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-gray-800">{c.members}</span>
                    <span className={`text-[11px] font-bold ml-1 ${c.memberDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {c.memberDelta >= 0 ? `+${c.memberDelta}` : c.memberDelta}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-semibold text-gray-800">{c.eventsHeld}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <TrendIcon history={c.history} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.status === "Active" ? (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Tạm dừng
                      </span>
                    )}
                  </td>
                  <td className="pr-3"><ChevronRight size={15} className="text-gray-300" /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400 text-[13px]">
                  Không có CLB nào khớp bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail */}
      {selected && (
        <DetailPanel
          club={clubs.find((c) => c.clubID === selected.clubID) ?? selected}
          onClose={() => setSelected(null)}
          onSuspend={() => setSuspendTarget(selected)}
          onReactivate={() => handleReactivate(selected)}
          onKeep={() => handleKeep(selected)}
        />
      )}

      {/* Suspend reason */}
      {suspendTarget && (
        <SuspendModal
          club={suspendTarget}
          onConfirm={handleSuspendConfirm}
          onClose={() => setSuspendTarget(null)}
        />
      )}
    </div>
  );
}
