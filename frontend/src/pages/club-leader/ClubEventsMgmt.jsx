import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Clock, MapPin, Search, X, AlertTriangle, Users, ChevronRight } from "lucide-react";
import { TokenService, getServerOrigin } from "../../services/api/axiosClient";
import clubApi from "../../services/api/clubs/clubApi";
import eventApi from "../../services/api/events/eventApi";
import FinishEventModal from "../../components/events/FinishEventModal";
import CloseEventButton from "../../components/events/CloseEventButton";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

const STATUS_DEFS = [
  { keys: ["Draft",                   "DRAFT"],                        label: "Bản nháp",                    color: "#6b7280", bg: "#f3f4f6" },
  { keys: ["Pending",                 "PENDING",          "pending"],  label: "Chờ duyệt (cũ)",              color: "#d97706", bg: "#fffbeb" },
  { keys: ["PendingApproval",         "PENDING_APPROVAL", "PENDINGAPPROVAL"], label: "Chờ ICPDP duyệt",     color: "#b45309", bg: "#fef3c7" },
  { keys: ["Approved",                "APPROVED"],                     label: "Đã duyệt",                    color: "#059669", bg: "#d1fae5" },
  { keys: ["RegistrationOpen",        "REGISTRATION_OPEN",   "REGISTRATIONOPEN"],   label: "Mở đăng ký",    color: "#0891b2", bg: "#cffafe" },
  { keys: ["RegistrationClosed",      "REGISTRATION_CLOSED", "REGISTRATIONCLOSED"], label: "Đóng đăng ký",  color: "#0e7490", bg: "#e0f2fe" },
  { keys: ["CheckinOpen",             "CHECKIN_OPEN",    "CHECKINOPEN"],            label: "Đang điểm danh",color: "#0284c7", bg: "#bae6fd" },
  { keys: ["Upcoming",                "UPCOMING"],                     label: "Sắp diễn ra",                 color: "#16a34a", bg: "#dcfce7" },
  { keys: ["Ongoing",                 "ONGOING"],                      label: "Đang diễn ra",                color: "#2563eb", bg: "#dbeafe" },
  { keys: ["Completed",               "COMPLETED"],                    label: "Đã kết thúc",                 color: "#7c3aed", bg: "#ede9fe" },
  { keys: ["ReportUploaded",          "REPORT_UPLOADED",     "REPORTUPLOADED"],     label: "Đã nộp báo cáo",color: "#9333ea", bg: "#f3e8ff" },
  { keys: ["ReportPendingApproval",   "REPORT_PENDING_APPROVAL", "REPORTPENDINGAPPROVAL"], label: "Báo cáo chờ duyệt", color: "#c026d3", bg: "#fae8ff" },
  { keys: ["ReportApproved",          "REPORT_APPROVED", "REPORTAPPROVED"],         label: "Báo cáo đã duyệt",color: "#0f766e", bg: "#ccfbf1" },
  { keys: ["ReportRejected",          "REPORT_REJECTED", "REPORTREJECTED"],         label: "Báo cáo bị từ chối",color: "#b91c1c", bg: "#fee2e2" },
  { keys: ["ContributionDraft",       "CONTRIBUTION_DRAFT",        "CONTRIBUTIONDRAFT"],        label: "Đóng góp — Nháp",     color: "#475569", bg: "#f1f5f9" },
  { keys: ["ContributionCalculated",  "CONTRIBUTION_CALCULATED",   "CONTRIBUTIONCALCULATED"],   label: "Đã tính điểm",        color: "#0369a1", bg: "#e0f2fe" },
  { keys: ["ContributionScoring",     "CONTRIBUTION_SCORING",      "CONTRIBUTIONSCORING"],      label: "Đang chấm điểm",      color: "#7c2d12", bg: "#fff7ed" },
  { keys: ["ContributionPendingApproval","CONTRIBUTION_PENDING_APPROVAL","CONTRIBUTIONPENDINGAPPROVAL"], label: "Đóng góp chờ duyệt", color: "#a16207", bg: "#fefce8" },
  { keys: ["ContributionApproved",    "CONTRIBUTION_APPROVED",     "CONTRIBUTIONAPPROVED"],     label: "Đóng góp đã duyệt",   color: "#15803d", bg: "#f0fdf4" },
  { keys: ["ContributionFinalized",   "CONTRIBUTION_FINALIZED",    "CONTRIBUTIONFINALIZED"],    label: "Đóng góp hoàn tất",   color: "#166534", bg: "#dcfce7" },
  { keys: ["Closed",                  "CLOSED"],                       label: "Đã đóng",                     color: "#374151", bg: "#e5e7eb" },
  { keys: ["Cancelled",               "CANCELLED",        "CANCELED"],label: "Đã hủy",                      color: "#dc2626", bg: "#fee2e2" },
  { keys: ["Rejected",                "REJECTED"],                     label: "Bị từ chối",                  color: "#b91c1c", bg: "#fff1f2" },
];

const STATUS_CFG = Object.fromEntries(
  STATUS_DEFS.flatMap(({ keys, label, color, bg }) =>
    keys.map((k) => [k, { label, color, bg }])
  )
);

const REASON_MIN = 20;

function CancelModal({ event, onConfirm, onClose }) {
  const [reason, setReason]   = useState("");
  const [touched, setTouched] = useState(false);

  const isValid   = reason.trim().length > REASON_MIN;
  const showError = touched && !isValid;
  const remaining = REASON_MIN - reason.trim().length;

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid) return;
    onConfirm(event.eventID, reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <h2 className="text-[15px] font-bold text-gray-900 m-0">Hủy sự kiện</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            Bạn sắp hủy sự kiện{" "}
            <span className="font-semibold text-gray-900">"{event.eventName}"</span>.
            Hành động này không thể hoàn tác.
          </p>

          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
            Lý do hủy <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }}
            onBlur={() => setTouched(true)}
            placeholder="Nhập lý do hủy sự kiện..."
            rows={4}
            className={`w-full resize-none rounded-xl border text-[13.5px] text-gray-800 px-3.5 py-3 outline-none transition-colors leading-relaxed ${
              showError
                ? "border-red-400 focus:border-red-500 bg-red-50/40"
                : "border-gray-200 focus:border-[#e6430a] bg-white"
            }`}
            style={{ boxSizing: "border-box" }}
          />

          <div className="flex items-center justify-between mt-1.5">
            {showError ? (
              <p className="text-[12px] text-red-600 font-medium">
                Lý do phải có hơn {REASON_MIN} ký tự
                {remaining > 0 && ` (còn thiếu ${remaining} ký tự)`}.
              </p>
            ) : (
              <span />
            )}
            <span className={`text-[11px] ml-auto font-medium ${isValid ? "text-green-600" : "text-gray-400"}`}>
              {reason.trim().length} / {REASON_MIN}+
            </span>
          </div>
        </div>

        <div className="flex gap-2.5 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Quay lại
          </button>
          <button
            onClick={handleSubmit}
            disabled={touched && !isValid}
            className={`flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-colors border-none ${
              touched && !isValid
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 cursor-pointer"
            }`}
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

// Lấy clubId từ nhiều nguồn: TokenService → localStorage.user → null
function resolveClubId() {
  const fromToken = TokenService.getClubId();
  if (fromToken) return fromToken;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.clubId ?? null;
  } catch {
    return null;
  }
}

function normalizeEvent(ev) {
  return {
    eventID:         ev.eventID         ?? ev.id          ?? null,
    eventName:       ev.eventName       ?? ev.name        ?? "",
    eventStatus:     ev.eventStatus     ?? ev.status      ?? "Draft",
    startDate:       ev.startDate       ?? null,
    endDate:         ev.endDate         ?? null,
    date:            ev.date            ?? "",
    time:            ev.time            ?? "",
    location:        ev.location        ?? "",
    description:     ev.description     ?? "",
    maxParticipants: ev.maxParticipants ?? null,
    budget:          ev.budget          ?? null,
    bannerUrl:        ev.bannerUrl        ?? null,
    bannerPublicId:   ev.bannerPublicId   ?? null,
    rejectionReason:  ev.rejectionReason  ?? null,
    createdAt:        ev.createdAt        ?? ev.createdDate ?? null,
  };
}

export default function ClubEventsMgmt() {
  const confirm  = useConfirm();
  const toast    = useToast();
  const clubId   = resolveClubId();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [events, setEvents]             = useState([]);
  const [cancelTarget, setCancelTarget]         = useState(null);
  const [finishTarget, setFinishTarget]         = useState(null);
  const [startingId, setStartingId]             = useState(null);
  const [openingRegId, setOpeningRegId]         = useState(null);
  const [closingRegId, setClosingRegId]         = useState(null);
  const [selectedEv, setSelectedEv]             = useState(null);
  const [isEditing, setIsEditing]               = useState(false);
  const [editForm, setEditForm]                 = useState({});
  const [saving, setSaving]                     = useState(false);
  const [reportModal, setReportModal]           = useState({ open: false, summary: "", file: null, uploading: false, error: null });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await clubApi.getAllEvents(clubId);
        // axiosClient interceptor đã unwrap response.data, nên response IS the data
        // Hỗ trợ: plain array, { content: [...] } (paginated), { data: [...] }
        let raw;
        if (Array.isArray(response)) {
          raw = response;
        } else if (response?.content && Array.isArray(response.content)) {
          raw = response.content;
        } else if (response?.data && Array.isArray(response.data)) {
          raw = response.data;
        } else {
          raw = [];
        }
        const normalized = raw.map(normalizeEvent);
        setEvents(normalized);

        // Khôi phục popup nếu URL có ?event= (ví dụ: quay lại từ trang phân công)
        const returnId = Number(new URLSearchParams(window.location.search).get("event"));
        if (returnId) {
          const ev = normalized.find((e) => e.eventID === returnId);
          if (ev) { setSelectedEv(ev); setIsEditing(false); }
        }
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        console.error("[ClubEventsMgmt] Lỗi tải sự kiện:", error);
      }
    };
    if (clubId) fetchEvents();
  }, [clubId]);

  // Thứ tự hiển thị chip lọc (chỉ các trạng thái Club Leader thực sự gặp)
  const STATUS_ORDER = [
    "DRAFT",
    "PENDING_APPROVAL", "PENDINGAPPROVAL",
    "REJECTED",
    "APPROVED",
    "REGISTRATION_OPEN", "REGISTRATIONOPEN",
    "REGISTRATION_CLOSED", "REGISTRATIONCLOSED",
    "ONGOING",
    "COMPLETED",
    "REPORT_UPLOADED", "REPORTUPLOADED",
    "REPORT_APPROVED", "REPORTAPPROVED",
    "CONTRIBUTION_FINALIZED", "CONTRIBUTIONFINALIZED",
    "CLOSED",
    "CANCELLED",
  ];

  const availableStatuses = [...new Set(events.map((e) => (e.eventStatus || "Draft").toUpperCase()))]
    .sort((a, b) => {
      const ia = STATUS_ORDER.indexOf(a);
      const ib = STATUS_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  const filtered = events
    .filter((e) => (e.eventName || "").toLowerCase().includes(search.toLowerCase()))
    .filter((e) => statusFilter === "ALL" || (e.eventStatus || "Draft").toUpperCase() === statusFilter)
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
      return (b.eventID ?? 0) - (a.eventID ?? 0);
    });

  const updateEvent = (eventID, patch) => {
    setEvents((prev) => prev.map((e) => e.eventID === eventID ? { ...e, ...patch } : e));
    setSelectedEv((prev) => prev?.eventID === eventID ? { ...prev, ...patch } : prev);
  };

  const handleDeleteDraft = async (ev) => {
    if (!(await confirm(`Xóa bản nháp "${ev.eventName}"? Hành động này không thể hoàn tác.`, { danger: true, confirmLabel: "Xóa bản nháp" }))) return;
    try {
      await eventApi.deleteDraft(ev.eventID);
      setEvents((prev) => prev.filter((e) => e.eventID !== ev.eventID));
      closeDetail();
      toast.success("Đã xóa bản nháp.");
    } catch (e) {
      toast.error("Lỗi xóa bản nháp: " + (e.response?.data?.message || e.message));
    }
  };

  const openDetail = (ev) => {
    setSelectedEv(ev);
    setIsEditing(false);
    setEditForm({});
    setSearchParams({ event: ev.eventID }, { replace: true });
  };

  const closeDetail = () => {
    setSelectedEv(null);
    setIsEditing(false);
    setSearchParams({}, { replace: true });
  };

  const startEdit = async (ev) => {
    // Fetch full detail để lấy các field không có trong list API (vd: budget)
    let full = { ...ev };
    try {
      const detail = await eventApi.getEventById(ev.eventID);
      if (detail) {
        const det = normalizeEvent(detail);
        // Chỉ ghi đè field nào detail trả về non-null, giữ nguyên giá trị cũ nếu detail null
        Object.entries(det).forEach(([k, v]) => { if (v != null) full[k] = v; });
        full.eventID = ev.eventID;
      }
    } catch { /* dùng data hiện có nếu fetch lỗi */ }

    const dt = full.startDate ? new Date(full.startDate) : null;
    const endDt = full.endDate ? new Date(full.endDate) : null;
    const pad = (n) => String(n).padStart(2, "0");
    setEditForm({
      name:            full.eventName || "",
      date:            dt ? `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}` : "",
      time:            dt ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}` : "",
      endTime:         endDt ? `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}` : "",
      location:        full.location || "",
      description:     full.description || "",
      maxParticipants: full.maxParticipants ?? "",
      budget:          full.budget ?? "",
      bannerFile:      null,
      bannerPublicId:  full.bannerPublicId ?? "",
    });
    // Cập nhật selectedEv với data đầy đủ hơn
    setSelectedEv((prev) => prev?.eventID === full.eventID ? { ...prev, ...full } : prev);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const startDate = editForm.date && editForm.time
        ? `${editForm.date}T${editForm.time}:00`
        : null;
      const endDate = editForm.date && editForm.endTime
        ? `${editForm.date}T${editForm.endTime}:00`
        : null;
      if (startDate && endDate && endDate <= startDate) {
        toast.error("Giờ kết thúc phải sau giờ bắt đầu.");
        return;
      }
      await eventApi.update(selectedEv.eventID, {
        eventName:       editForm.name || undefined,
        description:     editForm.description || undefined,
        location:        editForm.location || undefined,
        startDate:       startDate || undefined,
        endDate:         endDate || undefined,
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : undefined,
        budget:          editForm.budget ? Number(editForm.budget) : undefined,
      });

      let newBannerUrl = selectedEv.bannerUrl;
      let newBannerPublicId = selectedEv.bannerPublicId;
      if (editForm.bannerFile) {
        try {
          const res = await eventApi.uploadBanner(selectedEv.eventID, editForm.bannerFile);
          newBannerUrl = res?.bannerUrl ?? res?.url ?? newBannerUrl;
          newBannerPublicId = res?.publicId ?? res?.data?.publicId ?? newBannerPublicId;
        } catch {
          // Banner upload thất bại không chặn lưu thông tin khác
        }
      }

      if (editForm.bannerFile && newBannerUrl) {
        await eventApi.update(selectedEv.eventID, {
          bannerUrl: newBannerUrl,
          bannerPublicId: newBannerPublicId,
        });
      }

      updateEvent(selectedEv.eventID, {
        eventName:       editForm.name,
        description:     editForm.description,
        location:        editForm.location,
        startDate:       startDate || selectedEv.startDate,
        endDate:         endDate || selectedEv.endDate,
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : selectedEv.maxParticipants,
        budget:          editForm.budget ? Number(editForm.budget) : selectedEv.budget,
        bannerUrl:       newBannerUrl,
        bannerPublicId:  newBannerPublicId,
      });
      setIsEditing(false);
    } catch (e) {
      toast.error("Lỗi lưu thay đổi: " + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  const btnStyle = (bg, disabled = false) => ({
    padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
    background: bg, color: "#fff", border: "none", cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
  });

  const handleCancelConfirm = async (eventID, reason) => {
    try {
      await eventApi.cancel(clubId, eventID, reason);
      updateEvent(eventID, { eventStatus: "Cancelled" });
      setCancelTarget(null);
    } catch (error) {
      toast.error("Lỗi khi hủy sự kiện: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Sự Kiện</h1>
        <p className="page-subtitle">Theo dõi trạng thái các sự kiện đã đề xuất</p>
      </div>

      <div className="content-card">
        <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ position: "relative", maxWidth: 360 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sự kiện..."
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex gap-0 border-b-2 border-gray-200 mb-1">
            {[{ key: "ALL", label: "Tất cả" },
              ...availableStatuses.map((s) => {
                const cfg = STATUS_CFG[s] || STATUS_CFG["Draft"];
                return { key: s, label: cfg.label };
              })
            ].map(({ key, label }) => {
              const active = statusFilter === key;
              const count  = key === "ALL" ? events.length : events.filter((e) => (e.eventStatus || "Draft").toUpperCase() === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
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

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <Calendar size={40} style={{ color: "#e5e7eb", margin: "0 auto 14px", display: "block" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>
              {search ? "Không tìm thấy sự kiện phù hợp." : (!clubId ? "Không xác định được câu lạc bộ." : "Chưa có sự kiện nào.")}
            </p>
            {!search && !clubId && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 10px" }}>
                Vui lòng đăng xuất và đăng nhập lại để làm mới phiên.
              </p>
            )}
            {!search && !!clubId && (
              <>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 18px" }}>
                  Tạo đề xuất sự kiện để bắt đầu.
                </p>
                <button
                  onClick={() => navigate("../../event-create", { relative: "path" })}
                  style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "#E6430A", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
                >
                  + Tạo sự kiện ngay
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((ev, index) => {
              const rawStatus = ev.eventStatus || "Draft";
              const status    = rawStatus.toUpperCase().replace(/_/g, "");
              const cfg       = STATUS_CFG[rawStatus] || STATUS_CFG[status] || STATUS_CFG["Draft"];
              const dateStr = ev.startDate
                ? new Date(ev.startDate).toLocaleDateString("vi-VN")
                : (ev.date || "Chưa xác định");
              const timeStr = ev.startDate
                ? new Date(ev.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : (ev.time || "");
              const isSelected = selectedEv?.eventID === ev.eventID;
              return (
                <div
                  key={ev.eventID ?? `${ev.eventName}-${ev.startDate ?? ev.date ?? index}`}
                  onClick={() => openDetail(ev)}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "0.875rem 1.25rem", borderRadius: 12, cursor: "pointer",
                    border: isSelected ? "1.5px solid #F37021" : (status === "CANCELLED" ? "1.5px solid #fecaca" : "1.5px solid #f0f0f0"),
                    background: isSelected ? "#fff7f3" : (status === "CANCELLED" ? "#fff8f8" : "#fff"),
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FFF3EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={18} color="#E6430A" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13.5, color: "#111827", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.eventName}
                    </p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={10} /> {dateStr}{timeStr ? ` · ${timeStr}` : ""}
                      </span>
                      {ev.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={10} /> {ev.location}
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                    <ChevronRight size={15} color="#d1d5db" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer chi tiết sự kiện */}
      {selectedEv && (() => {
        const rawStatus = selectedEv.eventStatus || "Draft";
        const status    = rawStatus.toUpperCase().replace(/_/g, "");
        const cfg       = STATUS_CFG[rawStatus] || STATUS_CFG[status] || STATUS_CFG["Draft"];
        const dateStr    = selectedEv.startDate
          ? new Date(selectedEv.startDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : (selectedEv.date || "Chưa xác định");
        const timeStr    = selectedEv.startDate
          ? new Date(selectedEv.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          : (selectedEv.time || "");
        const endTimeStr = selectedEv.endDate
          ? new Date(selectedEv.endDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          : "";
        const fmtBudget = (val) => {
          const n = Number(val);
          return isNaN(n) || n === 0 ? null : n.toLocaleString("vi-VN") + " đ";
        };

        return (
          <>
            <div
              onClick={() => closeDetail()}
              style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 520, maxHeight: "90vh",
                background: "#fff", borderRadius: 16, overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                display: "flex", flexDirection: "column",
                margin: "0 16px",
              }}>
              {/* Banner */}
              {selectedEv.bannerUrl && !isEditing && (
                <div style={{
                  height: 160, flexShrink: 0,
                  backgroundImage: `url(${getImageUrl(selectedEv.bannerUrl)})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                }} />
              )}

              {/* Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, marginBottom: 8 }}>
                    {cfg.label}
                  </span>
                  {isEditing ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      style={{ width: "100%", fontSize: 16, fontWeight: 700, color: "#111827", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", boxSizing: "border-box", outline: "none" }}
                    />
                  ) : (
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827", lineHeight: 1.35 }}>
                      {selectedEv.eventName}
                    </h2>
                  )}
                </div>
                <button
                  onClick={() => closeDetail()}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6, color: "#6b7280", flexShrink: 0, borderRadius: 8 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Thông tin */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: 12 }}>
                {isEditing ? (<>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>Ngày tổ chức</label>
                    <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      style={{ width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>Giờ bắt đầu</label>
                      <input type="time" value={editForm.time} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
                        style={{ width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>Giờ kết thúc</label>
                      <input type="time" value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                        style={{ width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>Địa điểm</label>
                    <input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                      style={{ width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>Số người tối đa</label>
                    <input type="number" min={1} value={editForm.maxParticipants} onChange={(e) => setEditForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                      style={{ width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>Quỹ dự kiến (VNĐ)</label>
                    <input
                      type="number" min={0} step={1000}
                      value={editForm.budget}
                      onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
                      placeholder="0"
                      style={{ width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 6 }}>Ảnh banner</label>
                    <label style={{ display: "block", position: "relative", cursor: "pointer", borderRadius: 8, overflow: "hidden" }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setEditForm((prev) => ({ ...prev, bannerFile: f }));
                        }}
                      />
                      {(editForm.bannerFile || selectedEv.bannerUrl) ? (
                        <img
                          src={editForm.bannerFile ? URL.createObjectURL(editForm.bannerFile) : getImageUrl(selectedEv.bannerUrl)}
                          alt="Banner"
                          style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: 120, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1.5px dashed #d1d5db" }}>
                          <span style={{ fontSize: 13, color: "#9ca3af" }}>Chưa có ảnh banner</span>
                        </div>
                      )}
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(0,0,0,0.55)", borderRadius: 6,
                        padding: "5px 10px", display: "flex", alignItems: "center", gap: 5,
                        backdropFilter: "blur(4px)",
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>Sửa</span>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>Mô tả</label>
                    <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={4}
                      style={{ width: "100%", fontSize: 13, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", boxSizing: "border-box", outline: "none", resize: "vertical", lineHeight: 1.6 }} />
                  </div>
                </>) : (<>
                  {(() => {
                    const rows = [
                      {
                        icon: <Calendar size={14} color="#E6430A" />,
                        label: "Ngày tổ chức",
                        value: dateStr,
                      },
                      {
                        icon: <Clock size={14} color="#E6430A" />,
                        label: "Thời gian",
                        value: timeStr ? (endTimeStr ? `${timeStr} – ${endTimeStr}` : timeStr) : null,
                      },
                      {
                        icon: <MapPin size={14} color="#E6430A" />,
                        label: "Địa điểm",
                        value: selectedEv.location || null,
                      },
                      {
                        icon: <Users size={14} color="#E6430A" />,
                        label: "Số lượng",
                        value: selectedEv.maxParticipants ? `${selectedEv.maxParticipants} người` : null,
                      },
                      {
                        icon: <span style={{ fontSize: 13, fontWeight: 700, color: "#E6430A", lineHeight: 1 }}>₫</span>,
                        label: "Quỹ dự kiến",
                        value: fmtBudget(selectedEv.budget),
                      },
                    ];
                    return rows.filter(r => r.value).map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 20, display: "flex", justifyContent: "center", paddingTop: 1, flexShrink: 0 }}>{r.icon}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>{r.label}</span>
                          <span style={{ fontSize: 13.5, color: "#111827" }}>{r.value}</span>
                        </div>
                      </div>
                    ));
                  })()}
                  {selectedEv.description && (
                    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, marginTop: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 6 }}>Mô tả sự kiện</span>
                      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                        {selectedEv.description}
                      </p>
                    </div>
                  )}
                </>)}
              </div>

              {/* Lý do từ chối */}
              {status === "REJECTED" && selectedEv.rejectionReason && (
                <div style={{ margin: "0 24px", padding: "14px 16px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fecaca" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Lý do từ chối (ICPDP)
                  </p>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#7f1d1d", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {selectedEv.rejectionReason}
                  </p>
                </div>
              )}

              {/* Thao tác */}
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {!isEditing && (
                  <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 }}>
                    Thao tác
                  </p>
                )}

                 {[
                  "COMPLETED",
                  "REPORTUPLOADED",
                  "REPORTPENDINGAPPROVAL",
                  "REPORTAPPROVED",
                  "REPORTREJECTED",
                  "CONTRIBUTIONDRAFT",
                  "CONTRIBUTIONPENDINGAPPROVAL",
                  "CONTRIBUTIONAPPROVED",
                  "CONTRIBUTIONSCORING",
                  "CONTRIBUTIONFINALIZED",
                  "CLOSED",
                ].includes(status) && !isEditing && (
                  <button onClick={() => navigate(`${selectedEv.eventID}/feedback`, { relative: "path" })} style={btnStyle("#ea580c")}>
                    Feedback / Event Report
                  </button>
                )}
                {/* Draft */}
                {status === "DRAFT" && !isEditing && (<>
                  <button onClick={() => startEdit(selectedEv)} style={btnStyle("#f59e0b")}>
                    Chỉnh sửa thông tin
                  </button>
                  <button onClick={async () => {
                    try {
                      await eventApi.submit(selectedEv.eventID);
                      updateEvent(selectedEv.eventID, { eventStatus: "PendingApproval" });
                    } catch (e) {
                      toast.error("Lỗi gửi đề xuất: " + (e.response?.data?.message || e.message));
                    }
                  }} style={btnStyle("#059669")}>
                    Gửi đề xuất
                  </button>
                  <button onClick={() => handleDeleteDraft(selectedEv)} style={btnStyle("#dc2626")}>
                    Xóa bản nháp
                  </button>
                </>)}
                {status === "DRAFT" && isEditing && (<>
                  <button
                    disabled={saving}
                    onClick={handleSaveEdit}
                    style={btnStyle(saving ? "#86efac" : "#059669", saving)}
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={btnStyle("#6b7280")}>
                    Hủy chỉnh sửa
                  </button>
                </>)}

                {/* Approved */}
                {(status === "APPROVED" || status === "UPCOMING") && (<>
                  <button
                    disabled={openingRegId === selectedEv.eventID}
                    onClick={async () => {
                      if (!(await confirm("Bạn có chắc muốn mở đăng ký? Thành viên sẽ thấy và có thể đăng ký tham gia.", { confirmLabel: "Mở đăng ký" }))) return;
                      setOpeningRegId(selectedEv.eventID);
                      try {
                        await eventApi.openRegistration(selectedEv.eventID);
                        updateEvent(selectedEv.eventID, { eventStatus: "RegistrationOpen" });
                      } catch (e) {
                        toast.error("Lỗi mở đăng ký: " + (e.response?.data?.message || e.message));
                      } finally { setOpeningRegId(null); }
                    }}
                    style={btnStyle(openingRegId === selectedEv.eventID ? "#67e8f9" : "#0891b2", openingRegId === selectedEv.eventID)}
                  >
                    {openingRegId === selectedEv.eventID ? "Đang xử lý..." : "Mở đăng ký"}
                  </button>
                  <button onClick={() => setCancelTarget(selectedEv)} style={btnStyle("#dc2626")}>
                    Hủy sự kiện
                  </button>
                </>)}

                {/* RegistrationOpen */}
                {status === "REGISTRATIONOPEN" && (<>
                  <button onClick={() => navigate(`${selectedEv.eventID}/registrations`, { relative: "path" })} style={btnStyle("#0891b2")}>
                    Quản lý đăng ký
                  </button>
                  <button
                    disabled={closingRegId === selectedEv.eventID}
                    onClick={async () => {
                      if (!(await confirm("Bạn có chắc muốn đóng đăng ký? Thành viên sẽ không thể đăng ký thêm.", { danger: true, confirmLabel: "Đóng đăng ký" }))) return;
                      setClosingRegId(selectedEv.eventID);
                      try {
                        await eventApi.closeRegistration(selectedEv.eventID);
                        updateEvent(selectedEv.eventID, { eventStatus: "RegistrationClosed" });
                      } catch (e) {
                        toast.error("Lỗi đóng đăng ký: " + (e.response?.data?.message || e.message));
                      } finally { setClosingRegId(null); }
                    }}
                    style={btnStyle(closingRegId === selectedEv.eventID ? "#9ca3af" : "#f59e0b", closingRegId === selectedEv.eventID)}
                  >
                    {closingRegId === selectedEv.eventID ? "Đang xử lý..." : "Đóng đăng ký"}
                  </button>
                </>)}

                {/* RegistrationClosed */}
                {status === "REGISTRATIONCLOSED" && (<>
                  <button onClick={() => navigate(`${selectedEv.eventID}/registrations`, { relative: "path" })} style={btnStyle("#0891b2")}>
                    Quản lý đăng ký
                  </button>
                  <button
                    disabled={startingId === selectedEv.eventID}
                    onClick={async () => {
                      setStartingId(selectedEv.eventID);
                      try {
                        await eventApi.start(selectedEv.eventID);
                        updateEvent(selectedEv.eventID, { eventStatus: "Ongoing" });
                      } catch (e) {
                        toast.error("Lỗi bắt đầu sự kiện: " + (e.response?.data?.message || e.message));
                      } finally { setStartingId(null); }
                    }}
                    style={btnStyle(startingId === selectedEv.eventID ? "#86efac" : "#059669", startingId === selectedEv.eventID)}
                  >
                    {startingId === selectedEv.eventID ? "Đang xử lý..." : "Bắt đầu sự kiện"}
                  </button>
                </>)}

                {/* Ongoing */}
                {status === "ONGOING" && (<>
                  <button onClick={() => navigate(`${selectedEv.eventID}/checkin`, { relative: "path" })} style={btnStyle("#0891b2")}>
                    Điểm danh
                  </button>
                  <button onClick={() => navigate(`${selectedEv.eventID}/attendance`, { relative: "path" })} style={btnStyle("#2563eb")}>
                    Thống kê điểm danh
                  </button>
                  <button onClick={() => setFinishTarget(selectedEv.eventID)} style={btnStyle("#7c3aed")}>
                    Kết thúc sự kiện
                  </button>
                  <button onClick={() => setCancelTarget(selectedEv)} style={btnStyle("#dc2626")}>
                    Hủy sự kiện
                  </button>
                </>)}

                {/* Completed — cần nộp báo cáo trước */}
                {status === "COMPLETED" && (<>
                  <button
                    onClick={() => setReportModal({ open: true, summary: "", file: null, uploading: false, error: null })}
                    style={btnStyle("#7c3aed")}
                  >
                    Nộp báo cáo sự kiện
                  </button>
                  <button onClick={() => navigate(`../contributions/${selectedEv.eventID}`, { relative: "path" })} style={btnStyle("#2563eb")}>
                    Chốt đóng góp
                  </button>
                </>)}

                {/* ReportUploaded — đã nộp, chờ ICPDP */}
                {status === "REPORTUPLOADED" && (<>
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f5f3ff", border: "1.5px solid #ddd6fe", fontSize: 13, color: "#6d28d9", fontWeight: 600, textAlign: "center" }}>
                    ✓ Đã nộp báo cáo — đang chờ ICPDP duyệt
                  </div>
                  <button onClick={() => navigate(`../contributions/${selectedEv.eventID}`, { relative: "path" })} style={btnStyle("#2563eb")}>
                    Chốt đóng góp
                  </button>
                  <CloseEventButton
                    eventId={selectedEv.eventID}
                    eventStatus={selectedEv.eventStatus}
                    onCloseSuccess={() => window.location.reload()}
                  />
                </>)}

                {/* ReportApproved — ICPDP đã duyệt → chốt đóng góp */}
                {status === "REPORTAPPROVED" && (<>
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "#ecfdf5", border: "1.5px solid #a7f3d0", fontSize: 13, color: "#047857", fontWeight: 600 }}>
                    ✓ Báo cáo đã được ICPDP phê duyệt — có thể chốt đóng góp
                  </div>
                  <button onClick={() => navigate(`../contributions/${selectedEv.eventID}`, { relative: "path" })} style={btnStyle("#0f766e")}>
                    Chấm đóng góp thành viên
                  </button>
                  <button onClick={() => navigate(`../contributions/${selectedEv.eventID}?instant=1`, { relative: "path" })} style={btnStyle("#1d4ed8")}>
                    Chốt ngay
                  </button>
                </>)}

                {/* Cancelled / Closed / Rejected / PendingApproval — không có thao tác */}
                {["CANCELLED", "CLOSED", "REJECTED", "PENDINGAPPROVAL", "PENDING"].includes(status) && (
                  <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
                    Không có thao tác khả dụng.
                  </p>
                )}
              </div>
            </div>
            </div>
          </>
        );
      })()}

      {/* Modal nộp báo cáo */}
      {reportModal.open && selectedEv && (
        <div
          onClick={(e) => e.target === e.currentTarget && setReportModal((m) => ({ ...m, open: false }))}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", margin: "0 16px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Nộp báo cáo sự kiện</h3>
              <button
                onClick={() => setReportModal((m) => ({ ...m, open: false }))}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6, color: "#6b7280", borderRadius: 8 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Tóm tắt báo cáo <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={reportModal.summary}
                  onChange={(e) => setReportModal((m) => ({ ...m, summary: e.target.value, error: null }))}
                  rows={4}
                  placeholder="Mô tả ngắn gọn kết quả sự kiện..."
                  style={{ width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", resize: "vertical", outline: "none", lineHeight: 1.65 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  File báo cáo (PDF, tối đa 10MB) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <label style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  border: "1.5px dashed #d1d5db", borderRadius: 10, cursor: "pointer",
                  background: reportModal.file ? "#f5f3ff" : "#fafafa",
                  borderColor: reportModal.file ? "#a78bfa" : "#d1d5db",
                }}>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setReportModal((m) => ({ ...m, file: f, error: null }));
                    }}
                  />
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span style={{ fontSize: 13.5, color: reportModal.file ? "#6d28d9" : "#9ca3af", fontWeight: reportModal.file ? 600 : 400 }}>
                    {reportModal.file ? reportModal.file.name : "Chọn file PDF..."}
                  </span>
                </label>
              </div>

              {reportModal.error && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>
                  {reportModal.error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 10 }}>
              <button
                onClick={() => setReportModal((m) => ({ ...m, open: false }))}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                disabled={reportModal.uploading}
                onClick={async () => {
                  if (!reportModal.summary.trim()) {
                    setReportModal((m) => ({ ...m, error: "Vui lòng nhập tóm tắt báo cáo." }));
                    return;
                  }
                  if (!reportModal.file) {
                    setReportModal((m) => ({ ...m, error: "Vui lòng chọn file PDF." }));
                    return;
                  }
                  setReportModal((m) => ({ ...m, uploading: true, error: null }));
                  try {
                    await eventApi.uploadReport(selectedEv.eventID, reportModal.summary.trim(), reportModal.file);
                    updateEvent(selectedEv.eventID, { eventStatus: "ReportUploaded" });
                    setReportModal({ open: false, summary: "", file: null, uploading: false, error: null });
                  } catch (e) {
                    setReportModal((m) => ({
                      ...m,
                      uploading: false,
                      error: e.response?.data?.message || e.message || "Lỗi khi nộp báo cáo.",
                    }));
                  }
                }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                  background: reportModal.uploading ? "#c4b5fd" : "#7c3aed",
                  color: "#fff", fontSize: 13.5, fontWeight: 600,
                  cursor: reportModal.uploading ? "not-allowed" : "pointer",
                }}
              >
                {reportModal.uploading ? "Đang nộp..." : "Nộp báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <CancelModal
          event={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {finishTarget && (
        <FinishEventModal
          eventId={finishTarget}
          isOpen={true}
          onClose={() => setFinishTarget(null)}
          onFinishSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

