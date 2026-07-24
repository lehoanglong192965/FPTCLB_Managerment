import { useState, useEffect } from "react";
import { X, ArrowLeft, ChevronRight, Search } from "lucide-react";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import { useToast } from "../../contexts/ToastContext";
import { getServerOrigin } from "../../services/api/axiosClient";
import LocationPicker from "../../components/events/LocationPicker";
import RichTextView from "../../components/ui/RichTextView";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

const BUDGET_LIMIT = 5_000_000;

// Cùng bố cục "Thông tin" của trang Quản lý sự kiện bên club-leader
// (EventManageDetailPage.jsx) — để ICPDP xem chi tiết theo giao diện quen thuộc.
const labelStyle = { fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", boxSizing: "border-box", outline: "none" };
const accentInputStyle = { ...inputStyle, borderLeft: "3px solid #E6430A", overflowWrap: "anywhere", wordBreak: "break-word" };

function SectionHeader({ children }) {
  return (
    <div style={{ background: "#eef2ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 14px", borderRadius: 8 }}>
      {children}
    </div>
  );
}

function ReadBox({ value, multiline = false }) {
  return (
    <div style={{
      ...accentInputStyle, borderLeft: inputStyle.border,
      color: value ? "#111827" : "#9ca3af", minHeight: multiline ? 90 : "auto",
      whiteSpace: multiline ? "pre-line" : "normal", lineHeight: multiline ? 1.6 : "normal", cursor: "default",
    }}>
      {value || "Chưa có"}
    </div>
  );
}

function formatTime(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_BADGE = {
  pending:  { cls: "bg-yellow-100 text-yellow-700", label: "Chờ IC-PDP duyệt" },
  approved: { cls: "bg-green-100 text-green-700",   label: "Đã phê duyệt"     },
  rejected: { cls: "bg-red-100 text-red-700",       label: "Đã từ chối"       },
};

// Nhãn giai đoạn của sự kiện đã duyệt (dựa trên eventStatus thô từ backend),
// giúp ICPDP phân biệt sự kiện đang mở với sự kiện đã kết thúc trong tab "Đã duyệt".
const PHASE_LABEL = {
  APPROVED:                      "Đã duyệt, chưa mở đăng ký",
  REGISTRATION_OPEN:             "Đang mở đăng ký",
  REGISTRATION_CLOSED:           "Đã đóng đăng ký",
  CHECKIN_OPEN:                  "Đang điểm danh",
  ONGOING:                       "Đang diễn ra",
  COMPLETED:                     "Đã kết thúc",
  CLOSED:                        "Đã đóng",
  REPORT_UPLOADED:               "Đã nộp báo cáo",
  REPORT_PENDING_APPROVAL:       "Chờ duyệt báo cáo",
  REPORT_APPROVED:               "Đã duyệt báo cáo",
  REPORT_REJECTED:               "Báo cáo bị từ chối",
  CONTRIBUTION_CALCULATED:       "Đã tính đóng góp",
  CONTRIBUTION_DRAFT:            "Nháp đóng góp",
  CONTRIBUTION_PENDING_APPROVAL: "Chờ duyệt đóng góp",
  CONTRIBUTION_APPROVED:         "Đã duyệt đóng góp",
  CONTRIBUTION_SCORING:          "Đang chấm đóng góp",
  CONTRIBUTION_FINALIZED:        "Đã chốt đóng góp",
};

// Các trạng thái coi là sự kiện đã kết thúc (tô nhãn xám thay vì xanh nhạt).
const FINISHED_STATUSES = new Set([
  "COMPLETED", "CLOSED", "REPORT_UPLOADED", "REPORT_PENDING_APPROVAL",
  "REPORT_APPROVED", "REPORT_REJECTED", "CONTRIBUTION_CALCULATED",
  "CONTRIBUTION_DRAFT", "CONTRIBUTION_PENDING_APPROVAL", "CONTRIBUTION_APPROVED",
  "CONTRIBUTION_SCORING", "CONTRIBUTION_FINALIZED",
]);

const TABS = [
  { key: "all",      label: "Tất cả"     },
  { key: "pending",  label: "Chờ duyệt"  },
  { key: "approved", label: "Đã duyệt"   },
  { key: "rejected", label: "Đã từ chối" },
];

function parseBudget(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  return parseInt(String(val).replace(/\./g, ""), 10) || 0;
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatBudget(val) {
  if (!val) return "0";
  return Number(val).toLocaleString("vi-VN");
}

// Mới nhất lên đầu: sort giảm dần theo thời điểm nộp (createdAt), hoà thì id lớn hơn (mới hơn) lên trước.
function sortByNewest(list) {
  return [...list].sort((a, b) => {
    const ta = a.createdAtRaw ? new Date(a.createdAtRaw).getTime() : 0;
    const tb = b.createdAtRaw ? new Date(b.createdAtRaw).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

/* ── Reject reason modal ───────────────────────────────── */
function RejectModal({ event, onConfirm, onClose }) {
  const [reason, setReason]   = useState("");
  const [touched, setTouched] = useState(false);

  const isValid   = reason.trim().length >= 10;
  const showError = touched && !isValid;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900 m-0">Từ chối sự kiện</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer border-none bg-transparent">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            Nhập lý do từ chối sự kiện <strong>"{event.name}"</strong>.
          </p>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
            Lý do <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }}
            placeholder="Nhập lý do từ chối..."
            rows={4}
            className={`w-full resize-none rounded-xl border text-[13.5px] text-gray-800 px-3.5 py-3 outline-none transition-colors leading-relaxed ${
              showError ? "border-red-400 bg-red-50/40" : "border-gray-200 focus:border-[#e6430a] bg-white"
            }`}
            style={{ boxSizing: "border-box" }}
          />
          {showError && <p className="text-[12px] text-red-600 mt-1">Lý do phải có ít nhất 10 ký tự.</p>}
        </div>

        <div className="flex gap-2.5 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50 cursor-pointer">
            Hủy
          </button>
          <button
            onClick={() => { setTouched(true); if (isValid) onConfirm(reason.trim()); }}
            className="flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold border-none bg-red-600 hover:bg-red-700 cursor-pointer"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Detail view — hiện nguyên trang thay vì popup, cùng bố cục tab "Thông tin" của
   EventManageDetailPage (club-leader) ── */
function EventDetailView({ event, onBack, onApprove, onReject }) {
  const hasBudgetWarning = parseBudget(event.budget) > BUDGET_LIMIT;
  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.pending;
  const timeStr = formatTime(event.startDateRaw);
  const endTimeStr = formatTime(event.endDateRaw);

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer hover:border-[#e6430a] hover:text-[#e6430a] transition-all"
      >
        <ArrowLeft size={15} /> Quay lại
      </button>

      <div
        style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 1px 3px rgba(13,27,62,0.07)", border: "1px solid #f0f0f0",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, marginBottom: 8 }}
            className={badge.cls}>
            {badge.label}
          </span>
          <span className={`inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${event.isInternal ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>
            {event.isInternal ? "Nội bộ CLB" : "Công khai"}
          </span>
          {event.status === "approved" && event.phaseLabel && (
            <span className={`inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.isFinished ? "bg-gray-200 text-gray-600" : "bg-blue-100 text-blue-700"
            }`}>
              {event.phaseLabel}
            </span>
          )}
          {hasBudgetWarning && event.status === "pending" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold ml-2">
              ⚠ Ngân sách vượt 5 triệu
            </span>
          )}
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827", lineHeight: 1.35 }}>
            {event.name}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#E6430A", fontWeight: 600 }}>{event.club}</p>
        </div>

        {/* Thông tin — cùng SectionHeader/ReadBox 2 cột như tab "Thông tin" bên club-leader */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
            {/* Cột trái: Banner → Thông tin → Thời gian */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Ảnh banner</label>
                {event.bannerUrl ? (
                  <img src={getImageUrl(event.bannerUrl)} alt="Banner" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, display: "block" }} />
                ) : (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13, border: "1.5px dashed #e5e7eb", borderRadius: 8 }}>Chưa có ảnh banner</div>
                )}
              </div>

              <SectionHeader>Thông tin</SectionHeader>
              <div>
                <label style={labelStyle}>Tên sự kiện</label>
                <ReadBox value={event.name} />
              </div>
              <div>
                <label style={labelStyle}>Mô tả sự kiện</label>
                <RichTextView html={event.description} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Số người tối đa</label>
                  <ReadBox value={event.maxParticipants ? `${event.maxParticipants} người` : null} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Quỹ dự kiến (VNĐ)</label>
                  <ReadBox value={event.budget ? `${event.budget} đ` : null} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Thông tin bán vé</label>
                <ReadBox value={event.isPaidEvent ? `${Number(event.ticketPrice || 0).toLocaleString("vi-VN")} ${event.ticketCurrency || "VND"} / vé` : "Miễn phí"} />
              </div>

              <SectionHeader>Thời gian</SectionHeader>
              <div>
                <label style={labelStyle}>Ngày tổ chức</label>
                <ReadBox value={event.eventDate} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Giờ bắt đầu</label>
                  <ReadBox value={timeStr || null} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Giờ kết thúc</label>
                  <ReadBox value={endTimeStr || null} />
                </div>
              </div>
            </div>

            {/* Cột phải: Địa điểm */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SectionHeader>Địa điểm</SectionHeader>
              <div>
                <label style={labelStyle}>Tên địa điểm / Toà nhà</label>
                <ReadBox value={event.venueName} />
              </div>
              <div>
                <label style={labelStyle}>Địa chỉ (định vị trên bản đồ)</label>
                <LocationPicker address={event.location} lat={event.latitude} lng={event.longitude} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Rejection reason */}
        {event.status === "rejected" && event.rejectionReason && (
          <div style={{ margin: "0 24px", marginTop: 16, padding: "14px 16px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fecaca" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Lý do từ chối
            </p>
            <p style={{ margin: 0, fontSize: 13.5, color: "#7f1d1d", lineHeight: 1.7 }}>
              {event.rejectionReason}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {event.status === "pending" ? (<>
            <button
              onClick={() => onReject(event)}
              style={{ padding: "11px 24px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Từ chối
            </button>
            <button
              onClick={() => onApprove(event.id)}
              style={{ padding: "11px 24px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Phê duyệt
            </button>
          </>) : (
            <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
              Không có thao tác khả dụng.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────── */
export default function IcpdpEventApproval({ embedded = false }) {
  const toast = useToast();
  const [activeTab, setActiveTab]       = useState("pending");
  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [search, setSearch]             = useState("");

  const fetchEvents = () => {
    setLoading(true);
    Promise.all([
      eventApi.getPendingForIcpdp().catch(() => []),
      eventApi.getApprovedForIcpdp().catch(() => []),
      eventApi.getRejectedForIcpdp().catch(() => []),
      clubApi.getAllPublic().catch(() => []),
    ])
      .then(([pendingRes, approvedRes, rejectedRes, clubsRes]) => {
        const pendingList   = Array.isArray(pendingRes)  ? pendingRes  : (pendingRes?.data  ?? []);
        const approvedList  = Array.isArray(approvedRes) ? approvedRes : (approvedRes?.content ?? approvedRes?.data ?? []);
        const rejectedList  = Array.isArray(rejectedRes) ? rejectedRes : (rejectedRes?.content ?? rejectedRes?.data ?? []);
        const clubList      = Array.isArray(clubsRes)    ? clubsRes    : (clubsRes?.content ?? clubsRes?.data ?? []);

        // Backend chỉ trả clubID trong Event — map sang tên CLB từ danh sách CLB công khai
        const clubNameById = {};
        clubList.forEach((c) => {
          const id = c.clubID ?? c.id;
          if (id != null) clubNameById[id] = c.clubName ?? c.name ?? "";
        });
        const resolveClubName = (e) =>
          e.clubName ?? clubNameById[e.clubID] ?? `CLB #${e.clubID}`;

        // Các trường thô còn lại — dùng để hiển thị popup chi tiết theo đúng bố cục
        // tab "Thông tin" của trang Quản lý sự kiện bên club-leader (SectionHeader/ReadBox).
        const rawInfo = (e) => ({
          venueName:       e.venueName,
          locationDetail:  e.locationDetail,
          maxParticipants: e.maxParticipants,
          latitude:        e.latitude,
          longitude:       e.longitude,
          startDateRaw:    e.startDate,
          endDateRaw:      e.endDate,
          isPaidEvent:     e.isPaidEvent === true,
          ticketPrice:     e.ticketPrice ?? null,
          ticketCurrency:  e.ticketCurrency || "VND",
          isInternal:      e.isInternal === true,
        });

        const fromPending = pendingList.map((e) => ({
          id:               e.eventID,
          status:           "pending",
          statusLabel:      "Chờ IC-PDP duyệt",
          name:             e.eventName,
          club:             resolveClubName(e),
          description:      e.description,
          eventDate:        formatDate(e.startDate),
          budget:           formatBudget(e.budget),
          location:         e.location,
          submittedAt:      formatDate(e.createdAt),
          createdAtRaw:     e.createdAt,
          bannerUrl:        e.bannerUrl ?? null,
          scheduleConflict: false,
          ...rawInfo(e),
        }));

        // Sự kiện đã duyệt lấy từ API ICPDP (gồm cả đã kết thúc: COMPLETED/CLOSED/báo cáo...)
        const fromApproved = approvedList.map((e) => ({
          id:               e.eventID,
          status:           "approved",
          statusLabel:      "Đã phê duyệt",
          eventStatus:      e.eventStatus,
          phaseLabel:       PHASE_LABEL[e.eventStatus] ?? null,
          isFinished:       FINISHED_STATUSES.has(e.eventStatus),
          name:             e.eventName,
          club:             resolveClubName(e),
          description:      e.description,
          eventDate:        formatDate(e.startDate),
          budget:           formatBudget(e.budget),
          location:         e.location,
          submittedAt:      formatDate(e.createdAt),
          createdAtRaw:     e.createdAt,
          bannerUrl:        e.bannerUrl ?? null,
          scheduleConflict: false,
          ...rawInfo(e),
        }));

        // Lịch sử từ chối lấy từ API thật (backend trả kèm rejectionReason)
        const fromRejected = rejectedList.map((e) => ({
          id:               e.eventID,
          status:           "rejected",
          statusLabel:      "Đã từ chối",
          name:             e.eventName,
          club:             resolveClubName(e),
          description:      e.description,
          eventDate:        formatDate(e.startDate),
          budget:           formatBudget(e.budget),
          location:         e.location,
          submittedAt:      formatDate(e.createdAt),
          createdAtRaw:     e.createdAt,
          bannerUrl:        e.bannerUrl ?? null,
          rejectionReason:  e.rejectionReason ?? "",
          scheduleConflict: false,
          ...rawInfo(e),
        }));

        setEvents(sortByNewest([...fromPending, ...fromApproved, ...fromRejected]));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const approve = async (id) => {
    try {
      await eventApi.approveForIcpdp(id);
      setEvents((prev) =>
        prev.map((e) => e.id === id ? { ...e, status: "approved", statusLabel: "Đã phê duyệt" } : e)
      );
      setSelectedEvent(null);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Phê duyệt thất bại.");
    }
  };

  const reject = async (id, reason) => {
    try {
      await eventApi.rejectForIcpdp(id, reason);
      setEvents((prev) =>
        prev.map((e) => e.id === id ? { ...e, status: "rejected", statusLabel: "Đã từ chối", rejectionReason: reason } : e)
      );
      setRejectTarget(null);
      setSelectedEvent(null);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Từ chối thất bại.");
    }
  };

  const byTab    = activeTab === "all" ? events : events.filter((e) => e.status === activeTab);
  const filtered = search.trim()
    ? byTab.filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()) || e.club?.toLowerCase().includes(search.toLowerCase()))
    : byTab;
  const countOf  = (key) => key === "all" ? events.length : events.filter((e) => e.status === key).length;

  return (
    <div>
      {!embedded && (
        <div className="page-header">
          <h1 className="page-title">Phê Duyệt Sự Kiện</h1>
          <p className="page-subtitle">Xét duyệt đề xuất tổ chức sự kiện từ các câu lạc bộ</p>
        </div>
      )}

      {selectedEvent ? (
        <EventDetailView
          event={selectedEvent}
          onBack={() => setSelectedEvent(null)}
          onApprove={approve}
          onReject={(ev) => { setRejectTarget(ev); }}
        />
      ) : (<>
      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên sự kiện hoặc câu lạc bộ..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors bg-white"
          style={{ border: '1px solid #E2E8F0', color: '#1E293B' }}
          onFocus={(e) => { e.target.style.borderColor = '#e6430a'; }}
          onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-gray-200 mb-6">
        {TABS.map((tab) => {
          const count    = countOf(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 ${
                isActive ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${isActive ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3.5">
        {loading && <p className="text-center py-16 text-gray-400 text-sm">Đang tải...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-center py-16 text-gray-400 text-sm">Không có sự kiện nào.</p>
        )}
        {!loading && filtered.map((event) => {
          const hasBudgetWarning = parseBudget(event.budget) > BUDGET_LIMIT;
          const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.pending;
          const isSelected = selectedEvent?.id === event.id;

          const borderColor =
            event.status === "approved" ? "#16a34a" :
            event.status === "rejected" ? "#dc2626" :
            hasBudgetWarning ? "#ef4444" : "#e5e7eb";

          const bgColor =
            isSelected ? "#fff7f3" :
            event.status === "approved" ? "#f0fdf4" :
            event.status === "rejected" ? "#fef2f2" :
            hasBudgetWarning ? "rgba(254,242,242,0.4)" : "#fff";

          return (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="rounded-xl px-6 py-5 shadow-sm flex justify-between items-center gap-6 transition-all cursor-pointer hover:shadow-md"
              style={{ borderLeft: `4px solid ${borderColor}`, background: bgColor }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${event.isInternal ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>
                    {event.isInternal ? "Nội bộ CLB" : "Công khai"}
                  </span>
                  {event.status === "approved" && event.phaseLabel && (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.isFinished ? "bg-gray-200 text-gray-600" : "bg-blue-100 text-blue-700"
                    }`}>
                      {event.phaseLabel}
                    </span>
                  )}
                  {hasBudgetWarning && event.status === "pending" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      ⚠ Ngân sách vượt 5 triệu
                    </span>
                  )}
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 m-0 mb-0.5 truncate">{event.name}</h3>
                <p className="text-[13px] text-[#e6430a] font-medium m-0">{event.club}</p>
                <p className="text-[12.5px] text-gray-400 m-0 mt-1">
                  {event.eventDate ? `Ngày tổ chức: ${event.eventDate}` : ""}
                  {event.eventDate && event.submittedAt ? "  ·  " : ""}
                  {event.submittedAt ? `Nộp ngày: ${event.submittedAt}` : ""}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </div>
          );
        })}
      </div>
      </>)}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          event={rejectTarget}
          onConfirm={(reason) => reject(rejectTarget.id, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
