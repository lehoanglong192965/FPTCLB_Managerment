import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useBlocker } from "react-router-dom";
import { X, AlertTriangle, ArrowLeft, Pencil, Check } from "lucide-react";
import eventApi from "../../services/api/events/eventApi";
import { TokenService, getServerOrigin } from "../../services/api/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import LocationPicker from "../../components/events/LocationPicker";
import RichTextEditor from "../../components/ui/RichTextEditor";
import RichTextView from "../../components/ui/RichTextView";
import FinishEventModal from "../../components/events/FinishEventModal";
import CloseEventButton from "../../components/events/CloseEventButton";
import RegistrationMgmtPage from "./RegistrationMgmtPage";
import AttendanceDashboardPage from "./AttendanceDashboardPage";
import ReportSubmitPage from "./ReportSubmitPage";
import ContributionManagementPage from "./ContributionManagementPage";
import FeedbackSummaryPage from "../feedback/FeedbackSummaryPage";

/* ─── Status config (đồng bộ với ClubEventsMgmt) ─────────────── */
const STATUS_DEFS = [
  { keys: ["Draft", "DRAFT"], label: "Bản nháp", color: "#6b7280", bg: "#f3f4f6" },
  { keys: ["Pending", "PENDING", "pending"], label: "Chờ duyệt (cũ)", color: "#d97706", bg: "#fffbeb" },
  { keys: ["PendingApproval", "PENDING_APPROVAL", "PENDINGAPPROVAL"], label: "Chờ ICPDP duyệt", color: "#b45309", bg: "#fef3c7" },
  { keys: ["Approved", "APPROVED"], label: "Đã duyệt", color: "#059669", bg: "#d1fae5" },
  { keys: ["RegistrationOpen", "REGISTRATION_OPEN", "REGISTRATIONOPEN"], label: "Mở đăng ký", color: "#0891b2", bg: "#cffafe" },
  { keys: ["RegistrationClosed", "REGISTRATION_CLOSED", "REGISTRATIONCLOSED"], label: "Đóng đăng ký", color: "#0e7490", bg: "#e0f2fe" },
  { keys: ["CheckinOpen", "CHECKIN_OPEN", "CHECKINOPEN"], label: "Đang điểm danh", color: "#0284c7", bg: "#bae6fd" },
  { keys: ["Upcoming", "UPCOMING"], label: "Sắp diễn ra", color: "#16a34a", bg: "#dcfce7" },
  { keys: ["Ongoing", "ONGOING"], label: "Đang diễn ra", color: "#2563eb", bg: "#dbeafe" },
  { keys: ["Completed", "COMPLETED"], label: "Đã kết thúc", color: "#7c3aed", bg: "#ede9fe" },
  { keys: ["ReportUploaded", "REPORT_UPLOADED", "REPORTUPLOADED"], label: "Đã nộp báo cáo", color: "#9333ea", bg: "#f3e8ff" },
  { keys: ["ReportPendingApproval", "REPORT_PENDING_APPROVAL", "REPORTPENDINGAPPROVAL"], label: "Báo cáo chờ duyệt", color: "#c026d3", bg: "#fae8ff" },
  { keys: ["ReportApproved", "REPORT_APPROVED", "REPORTAPPROVED"], label: "Báo cáo đã duyệt", color: "#0f766e", bg: "#ccfbf1" },
  { keys: ["ReportRejected", "REPORT_REJECTED", "REPORTREJECTED"], label: "Báo cáo bị từ chối", color: "#b91c1c", bg: "#fee2e2" },
  { keys: ["ContributionDraft", "CONTRIBUTION_DRAFT", "CONTRIBUTIONDRAFT"], label: "Đóng góp — Nháp", color: "#475569", bg: "#f1f5f9" },
  { keys: ["ContributionScoring", "CONTRIBUTION_SCORING", "CONTRIBUTIONSCORING"], label: "Đang chấm điểm", color: "#7c2d12", bg: "#fff7ed" },
  { keys: ["ContributionPendingApproval", "CONTRIBUTION_PENDING_APPROVAL", "CONTRIBUTIONPENDINGAPPROVAL"], label: "Đóng góp chờ duyệt", color: "#a16207", bg: "#fefce8" },
  { keys: ["ContributionApproved", "CONTRIBUTION_APPROVED", "CONTRIBUTIONAPPROVED"], label: "Đóng góp đã duyệt", color: "#15803d", bg: "#f0fdf4" },
  { keys: ["ContributionFinalized", "CONTRIBUTION_FINALIZED", "CONTRIBUTIONFINALIZED"], label: "Đóng góp hoàn tất", color: "#166534", bg: "#dcfce7" },
  { keys: ["Closed", "CLOSED"], label: "Đã đóng", color: "#374151", bg: "#e5e7eb" },
  { keys: ["Cancelled", "CANCELLED", "CANCELED"], label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
  { keys: ["Rejected", "REJECTED"], label: "Bị từ chối", color: "#b91c1c", bg: "#fff1f2" },
  { keys: ["Withdrawn", "WITHDRAWN"], label: "Đã rút", color: "#9f1239", bg: "#fff1f2" },
];
const STATUS_CFG = Object.fromEntries(
  STATUS_DEFS.flatMap(({ keys, label, color, bg }) => keys.map((k) => [k, { label, color, bg }]))
);

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

const fmtBudget = (val) => {
  const n = Number(val);
  return isNaN(n) || n === 0 ? null : n.toLocaleString("vi-VN") + " đ";
};

/* Hành động chính: nút đặc, đại diện cho bước tiếp theo trong quy trình. */
const btnStyle = (bg, disabled = false) => ({
  padding: "11px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
  background: bg, color: "#fff", border: "none", cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
});

/* Hành động phụ: điều hướng sang trang con (xem/quản lý chi tiết) — nhẹ hơn để không cạnh tranh với hành động chính. */
const secondaryBtnStyle = (color, disabled = false) => ({
  padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
  background: "#fff", color, border: `1.5px solid ${color}`, cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
});

const labelStyle = { fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", boxSizing: "border-box", outline: "none" };
const accentInputStyle = { ...inputStyle, borderLeft: "3px solid #E6430A", overflowWrap: "anywhere", wordBreak: "break-word" };

/* Thanh tiêu đề nhóm trường, kiểu "Information" / "Venue" trong ảnh tham khảo. */
function SectionHeader({ children }) {
  return (
    <div style={{ background: "#eef2ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 14px", borderRadius: 8 }}>
      {children}
    </div>
  );
}

/* Các mốc chính trong vòng đời sự kiện — dùng để vẽ thanh tiến trình ở tab Quản lý. */
const REPORT_PHASE_STATUSES = ["COMPLETED", "REPORTUPLOADED", "REPORTPENDINGAPPROVAL", "REPORTAPPROVED", "REPORTREJECTED", "CONTRIBUTIONDRAFT", "CONTRIBUTIONSCORING", "CONTRIBUTIONPENDINGAPPROVAL", "CONTRIBUTIONAPPROVED", "CONTRIBUTIONFINALIZED", "CLOSED"];

const STEPS = [
  { key: "registration", label: "Đăng ký",    statuses: ["APPROVED", "UPCOMING", "REGISTRATIONOPEN", "REGISTRATIONCLOSED", "CHECKINOPEN"] },
  { key: "ongoing",      label: "Diễn ra",    statuses: ["ONGOING"] },
  { key: "report",       label: "Báo cáo và đóng góp", statuses: REPORT_PHASE_STATUSES },
];

/* Thanh tiến trình ngang — không hiện với sự kiện đã Hủy/Bị từ chối (không còn theo quy trình tuyến tính). */
function StatusStepper({ status }) {
  const currentIndex = STEPS.findIndex((s) => s.statuses.includes(status));
  if (currentIndex === -1) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 22 }}>
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const color = done || active ? "#E6430A" : "#d1d5db";
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i === STEPS.length - 1 ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#E6430A" : active ? "#fff" : "#f3f4f6",
                border: `2px solid ${color}`, color: done ? "#fff" : active ? "#E6430A" : "#9ca3af",
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {done ? <Check size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 600, color: active ? "#E6430A" : "#9ca3af", whiteSpace: "nowrap" }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "#E6430A" : "#e5e7eb", margin: "0 6px", marginTop: -18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Hiển thị giá trị khi chưa bật chế độ sửa — chữ thường, không khung, để phân biệt rõ với lúc đang sửa. */
function ReadBox({ value, multiline = false }) {
  return (
    <div style={{
      fontSize: 13.5, color: value ? "#111827" : "#9ca3af",
      whiteSpace: multiline ? "pre-line" : "normal", lineHeight: 1.6, padding: "2px 0",
    }}>
      {value || "Chưa có"}
    </div>
  );
}

function resolveClubId() {
  const fromToken = TokenService.getClubId();
  if (fromToken) return fromToken;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.clubId ?? null;
  } catch { return null; }
}

function normalizeEvent(ev) {
  return {
    eventID: ev.eventID ?? ev.id ?? null,
    eventName: ev.eventName ?? ev.name ?? "",
    eventStatus: ev.eventStatus ?? ev.status ?? "Draft",
    startDate: ev.startDate ?? null,
    endDate: ev.endDate ?? null,
    venueName: ev.venueName ?? "",
    location: ev.location ?? "",
    locationDetail: ev.locationDetail ?? "",
    latitude: ev.latitude ?? null,
    longitude: ev.longitude ?? null,
    description: ev.description ?? "",
    maxParticipants: ev.maxParticipants ?? null,
    budget: ev.budget ?? null,
    isPaidEvent: ev.isPaidEvent === true,
    ticketPrice: ev.ticketPrice ?? null,
    ticketCurrency: ev.ticketCurrency || "VND",
    isInternal: ev.isInternal === true,
    registrationPolicies: Array.isArray(ev.registrationPolicies) ? ev.registrationPolicies : [],
    requiresManualApproval: Array.isArray(ev.registrationPolicies)
      && ev.registrationPolicies.some((policy) => policy.participantType === "PARTICIPANT" && policy.requiresManualApproval === true),
    bannerUrl: ev.bannerUrl ?? null,
    bannerPublicId: ev.bannerPublicId ?? null,
    rejectionReason: ev.rejectionReason ?? null,
    withdrawalReason: ev.withdrawalReason ?? null,
    withdrawnAt: ev.withdrawnAt ?? null,
    submissionAttemptCount: ev.submissionAttemptCount ?? 0,
    submissionMaxAttempts: ev.submissionMaxAttempts ?? 3,
    submissionCooldownHours: ev.submissionCooldownHours ?? 24,
    submissionAttemptsRemaining: ev.submissionAttemptsRemaining
      ?? Math.max(0, (ev.submissionMaxAttempts ?? 3) - (ev.submissionAttemptCount ?? 0)),
    lastSubmittedAt: ev.lastSubmittedAt ?? null,
    submissionBlockedUntil: ev.submissionBlockedUntil ?? null,
  };
}

const REASON_MIN = 20;
function CancelModal({ event, onConfirm, onClose, withdrawal = false }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const isValid = reason.trim().length >= REASON_MIN;
  const showError = touched && !isValid;
  const remaining = REASON_MIN - reason.trim().length;
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <h2 className="text-[15px] font-bold text-gray-900 m-0">{withdrawal ? "Rút yêu cầu tổ chức" : "Hủy sự kiện"}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            {withdrawal
              ? <>Bạn sắp rút yêu cầu tổ chức <span className="font-semibold text-gray-900">"{event.eventName}"</span>. ICPDP sẽ không thể tiếp tục duyệt và thao tác này không thể hoàn tác trực tiếp.</>
              : <>Bạn sắp hủy sự kiện <span className="font-semibold text-gray-900">"{event.eventName}"</span>. Hành động này không thể hoàn tác.</>}
          </p>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">{withdrawal ? "Lý do rút yêu cầu" : "Lý do hủy"} <span className="text-red-500">*</span></label>
          <textarea value={reason} onChange={(e) => { setReason(e.target.value); setTouched(true); }} onBlur={() => setTouched(true)}
            placeholder={withdrawal ? "Nhập lý do không tiếp tục tổ chức..." : "Nhập lý do hủy sự kiện..."} rows={4}
            className={`w-full resize-none rounded-xl border text-[13.5px] text-gray-800 px-3.5 py-3 outline-none transition-colors leading-relaxed ${showError ? "border-red-400 bg-red-50/40" : "border-gray-200 focus:border-[#e6430a] bg-white"}`}
            style={{ boxSizing: "border-box" }} />
          <div className="flex items-center justify-between mt-1.5">
            {showError ? (
              <p className="text-[12px] text-red-600 font-medium">Lý do phải có ít nhất {REASON_MIN} ký tự{remaining > 0 && ` (còn thiếu ${remaining} ký tự)`}.</p>
            ) : <span />}
            <span className={`text-[11px] ml-auto font-medium ${isValid ? "text-green-600" : "text-gray-400"}`}>{reason.trim().length} / {REASON_MIN}+</span>
          </div>
        </div>
        <div className="flex gap-2.5 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Quay lại</button>
          <button onClick={() => { setTouched(true); if (isValid) onConfirm(event.eventID, reason.trim()); }} disabled={touched && !isValid}
            className={`flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-colors border-none ${touched && !isValid ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 cursor-pointer"}`}>
            {withdrawal ? "Xác nhận rút" : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function EventManageDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const confirm = useConfirm();
  const clubId = resolveClubId();

  const roleBase = location.pathname.startsWith("/vice-leader") ? "/vice-leader" : "/club-leader";
  const base = `${roleBase}/my-club`;
  const eventsListPath = `${base}/events`;

  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [reportSubTab, setReportSubTab] = useState("report");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [cancelOpen, setCancelOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  // Chặn mọi điều hướng (back, sidebar, đổi URL...) trong lúc đang sửa mà chưa lưu.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isEditing && currentLocation.pathname !== nextLocation.pathname);

  // Chặn đóng tab / F5 refresh trong lúc đang sửa mà chưa lưu (cảnh báo mặc định của trình duyệt).
  useEffect(() => {
    if (!isEditing) return;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isEditing]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const detail = await eventApi.getManagedEventById(eventId);
        if (!active) return;
        if (detail) setEv(normalizeEvent(detail?.data ?? detail));
        else setNotFound(true);
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [eventId]);

  // Quota submit có thể được Admin thay đổi trong khi Leader đang mở trang.
  // Khi tab được focus lại hoặc sau mỗi 15 giây, chỉ đồng bộ các trường quota
  // để mở nút gửi ngay mà không làm mất dữ liệu Leader đang chỉnh sửa.
  useEffect(() => {
    if (!ev?.submissionBlockedUntil || isEditing) return undefined;
    let active = true;
    const refreshSubmissionQuota = async () => {
      try {
        const detail = await eventApi.getManagedEventById(eventId);
        if (!active || !detail) return;
        const latest = normalizeEvent(detail?.data ?? detail);
        setEv((current) => (current ? {
          ...current,
          submissionAttemptCount: latest.submissionAttemptCount,
          submissionAttemptsRemaining: latest.submissionAttemptsRemaining,
          submissionMaxAttempts: latest.submissionMaxAttempts,
          submissionCooldownHours: latest.submissionCooldownHours,
          submissionBlockedUntil: latest.submissionBlockedUntil,
        } : current));
      } catch {
        // Backend vẫn kiểm tra quota khi submit; lỗi refresh nền không cần chặn trang.
      }
    };

    window.addEventListener("focus", refreshSubmissionQuota);
    const timer = window.setInterval(refreshSubmissionQuota, 15_000);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshSubmissionQuota);
      window.clearInterval(timer);
    };
  }, [eventId, ev?.submissionBlockedUntil, isEditing]);

  const patchEvent = (patch) => setEv((prev) => (prev ? { ...prev, ...patch } : prev));

  const enterEdit = () => {
    const dt = ev.startDate ? new Date(ev.startDate) : null;
    const endDt = ev.endDate ? new Date(ev.endDate) : null;
    const pad = (n) => String(n).padStart(2, "0");
    setEditForm({
      name: ev.eventName || "",
      date: dt ? `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` : "",
      time: dt ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}` : "",
      endTime: endDt ? `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}` : "",
      venueName: ev.venueName || "",
      location: ev.location || "",
      locationDetail: ev.locationDetail || "",
      latitude: typeof ev.latitude === "number" ? ev.latitude : null,
      longitude: typeof ev.longitude === "number" ? ev.longitude : null,
      description: ev.description || "",
      maxParticipants: ev.maxParticipants ?? "",
      budget: ev.budget ?? "",
      isPaidEvent: ev.isPaidEvent === true,
      ticketPrice: ev.ticketPrice ?? "",
      ticketCurrency: ev.ticketCurrency || "VND",
      isInternal: ev.isInternal === true,
      requiresManualApproval: ev.requiresManualApproval === true,
      bannerFile: null,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const startDate = editForm.date && editForm.time ? `${editForm.date}T${editForm.time}:00` : null;
      const endDate = editForm.date && editForm.endTime ? `${editForm.date}T${editForm.endTime}:00` : null;
      if (startDate && endDate && endDate <= startDate) {
        toast.error("Giờ kết thúc phải sau giờ bắt đầu.");
        setSaving(false);
        return;
      }
      if (isFullEdit && editForm.isPaidEvent && Number(editForm.ticketPrice) <= 0) {
        toast.error("Sự kiện bán vé phải có giá vé lớn hơn 0.");
        setSaving(false);
        return;
      }
      // Sau khi ICPDP đã duyệt (Approved/RegistrationOpen/RegistrationClosed), chỉ được
      // đổi số người tham gia tối đa — các trường khác giữ nguyên, không gửi lên nữa.
      const payload = isFullEdit ? {
        eventName: editForm.name || undefined,
        description: editForm.description || undefined,
        venueName: editForm.venueName ?? undefined,
        location: editForm.location || undefined,
        locationDetail: editForm.locationDetail ?? undefined,
        latitude: typeof editForm.latitude === "number" ? editForm.latitude : undefined,
        longitude: typeof editForm.longitude === "number" ? editForm.longitude : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : undefined,
        budget: editForm.budget ? Number(editForm.budget) : undefined,
        isPaidEvent: editForm.isPaidEvent === true,
        ticketPrice: editForm.isPaidEvent ? Number(editForm.ticketPrice) : null,
        ticketCurrency: editForm.ticketCurrency || "VND",
        isInternal: editForm.isInternal === true,
        registrationPolicies: [
          { participantType: "CORE_TEAM", isEnabled: true, waitlistEnabled: false, requiresManualApproval: false },
          { participantType: "SUPPORT_ORGANIZER", isEnabled: true, waitlistEnabled: false, requiresManualApproval: false },
          { participantType: "PARTICIPANT", isEnabled: true, waitlistEnabled: true, requiresManualApproval: editForm.requiresManualApproval === true },
        ],
      } : {
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : undefined,
      };
      await eventApi.update(ev.eventID, payload);

      let newBannerUrl = ev.bannerUrl;
      let newBannerPublicId = ev.bannerPublicId;
      if (isFullEdit && editForm.bannerFile) {
        try {
          const res = await eventApi.uploadBanner(ev.eventID, editForm.bannerFile);
          newBannerUrl = res?.bannerUrl ?? res?.url ?? newBannerUrl;
          newBannerPublicId = res?.publicId ?? res?.data?.publicId ?? newBannerPublicId;
          await eventApi.update(ev.eventID, { bannerUrl: newBannerUrl, bannerPublicId: newBannerPublicId });
        } catch { /* upload banner lỗi không chặn lưu phần còn lại */ }
      }

      patchEvent(isFullEdit ? {
        eventName: editForm.name,
        description: editForm.description,
        venueName: editForm.venueName,
        location: editForm.location,
        locationDetail: editForm.locationDetail,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
        startDate: startDate || ev.startDate,
        endDate: endDate || ev.endDate,
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : ev.maxParticipants,
        budget: editForm.budget ? Number(editForm.budget) : ev.budget,
        isPaidEvent: editForm.isPaidEvent === true,
        ticketPrice: editForm.isPaidEvent ? Number(editForm.ticketPrice) : null,
        ticketCurrency: editForm.ticketCurrency || "VND",
        isInternal: editForm.isInternal === true,
        requiresManualApproval: editForm.requiresManualApproval === true,
        bannerUrl: newBannerUrl,
        bannerPublicId: newBannerPublicId,
      } : {
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : ev.maxParticipants,
      });
      setIsEditing(false);
      toast.success("Đã lưu thay đổi.");
    } catch (e) {
      toast.error("Lỗi lưu thay đổi: " + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  // eslint-disable-next-line no-unused-vars -- giữ lại cho hướng sửa sau (nút đã tạm ẩn)
  const handleDeleteDraft = async () => {
    if (!(await confirm(`Xóa bản nháp "${ev.eventName}"? Hành động này không thể hoàn tác.`, { danger: true, confirmLabel: "Xóa bản nháp" }))) return;
    try {
      await eventApi.deleteDraft(ev.eventID);
      toast.success("Đã xóa bản nháp.");
      navigate(eventsListPath);
    } catch (e) {
      toast.error("Lỗi xóa bản nháp: " + (e.response?.data?.message || e.message));
    }
  };

  const handleCancelConfirm = async (id, reason) => {
    try {
      await eventApi.cancel(clubId, id, reason);
      patchEvent({ eventStatus: "Cancelled" });
      setCancelOpen(false);
    } catch (e) {
      toast.error("Lỗi khi hủy sự kiện: " + (e.response?.data?.message || e.message));
    }
  };

  const handleWithdrawConfirm = async (id, reason) => {
    setBusy(true);
    try {
      await eventApi.withdraw(id, reason);
      patchEvent({
        eventStatus: "Withdrawn",
        withdrawalReason: reason,
        withdrawnAt: new Date().toISOString(),
      });
      setWithdrawOpen(false);
      toast.success("Đã rút yêu cầu tổ chức sự kiện.");
    } catch (e) {
      toast.error("Không thể rút yêu cầu: " + (e.response?.data?.message || e.message));
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (fn, patch, errLabel) => {
    setBusy(true);
    try {
      await fn();
      if (patch) patchEvent(patch);
    } catch (e) {
      toast.error(`${errLabel}: ` + (e.response?.data?.message || e.message));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!(await confirm(`Gửi đề xuất sự kiện "${ev.eventName}" để ICPDP duyệt?`, { confirmLabel: "Gửi đề xuất" }))) return;
    setBusy(true);
    try {
      const response = await eventApi.submit(ev.eventID);
      const result = response?.data ?? response;
      patchEvent({
        eventStatus: result?.eventStatus ?? "PendingApproval",
        submissionAttemptCount: result?.submissionAttemptCount ?? ev.submissionAttemptCount + 1,
        submissionAttemptsRemaining: result?.attemptsRemaining,
        submissionMaxAttempts: result?.maxSubmissionAttempts ?? ev.submissionMaxAttempts,
        submissionCooldownHours: result?.submissionCooldownHours ?? ev.submissionCooldownHours,
        lastSubmittedAt: result?.lastSubmittedAt ?? new Date().toISOString(),
        submissionBlockedUntil: result?.submissionBlockedUntil ?? null,
        rejectionReason: null,
      });
      toast.success(result?.message ?? "Đã gửi đề xuất sự kiện.");
    } catch (e) {
      toast.error("Lỗi gửi đề xuất: " + (e.response?.data?.message || e.message));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>Đang tải...</div>;
  if (notFound || !ev) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
        <p>Không tìm thấy sự kiện.</p>
        <button onClick={() => navigate(eventsListPath)} style={{ marginTop: 12, padding: "9px 20px", borderRadius: 10, border: "none", background: "#E6430A", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          ← Về danh sách
        </button>
      </div>
    );
  }

  const rawStatus = ev.eventStatus || "Draft";
  const status = rawStatus.toUpperCase().replace(/_/g, "");
  // Sửa toàn bộ thông tin khi còn Bản nháp hoặc đã bị từ chối. Sau khi ICPDP duyệt (đến trước lúc
  // sự kiện bắt đầu diễn ra) chỉ được đổi số người tham gia tối đa.
  const isFullEdit = ["DRAFT", "REJECTED"].includes(status);
  const isLimitedEdit = ["APPROVED", "UPCOMING", "REGISTRATIONOPEN", "REGISTRATIONCLOSED"].includes(status);
  const canEdit = isFullEdit || isLimitedEdit;
  const blockedUntilMs = ev.submissionBlockedUntil ? new Date(ev.submissionBlockedUntil).getTime() : 0;
  const isSubmitBlocked = blockedUntilMs > clockNow;
  const blockedUntilLabel = isSubmitBlocked
    ? new Date(blockedUntilMs).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  const cfg = STATUS_CFG[rawStatus] || STATUS_CFG[status] || STATUS_CFG["Draft"];
  const dateStr = ev.startDate ? new Date(ev.startDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Chưa xác định";
  const timeStr = ev.startDate ? new Date(ev.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
  const endTimeStr = ev.endDate ? new Date(ev.endDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(eventsListPath)} title="Về danh sách"
          style={{ border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151", flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Chi Tiết Quản Lý Sự Kiện</h1>
          <p className="page-subtitle">Xem và chỉnh sửa thông tin sự kiện</p>
        </div>
      </div>

      <div className="content-card" style={{ width: "100%", padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, marginBottom: 8 }}>{cfg.label}</span>
          {isEditing && isFullEdit ? (
            <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              style={{ ...inputStyle, fontSize: 16, fontWeight: 700, color: "#111827" }} />
          ) : (
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827", lineHeight: 1.35, wordBreak: "break-word" }}>{ev.eventName}</h2>
          )}
        </div>

        {/* Tab: Thông tin / Quản lý */}
        <div style={{ display: "flex", gap: 4, padding: "0 24px", borderBottom: "1px solid #f0f0f0" }}>
          {[{ key: "info", label: "Thông tin" }, { key: "manage", label: "Quản lý" }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: "12px 18px", border: "none", borderBottom: `2.5px solid ${activeTab === key ? "#E6430A" : "transparent"}`,
                background: "transparent", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                color: activeTab === key ? "#E6430A" : "#6b7280", marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "info" && (<>
        {/* Thông tin — luôn hiện bố cục này, chỉ đổi input ↔ ô xem theo isEditing */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
            {/* Cột trái: Banner → Thông tin → Thời gian */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Ảnh banner</label>
                {isEditing && isFullEdit ? (
                  <label style={{ display: "block", position: "relative", cursor: "pointer", borderRadius: 8, overflow: "hidden", border: "1.5px dashed #d1d5db" }}>
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => setEditForm((f) => ({ ...f, bannerFile: e.target.files?.[0] || null }))} />
                    {(editForm.bannerFile || ev.bannerUrl) ? (
                      <img src={editForm.bannerFile ? URL.createObjectURL(editForm.bannerFile) : getImageUrl(ev.bannerUrl)} alt="Banner"
                        style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Chọn ảnh banner...</div>
                    )}
                  </label>
                ) : ev.bannerUrl ? (
                  <img src={getImageUrl(ev.bannerUrl)} alt="Banner" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, display: "block" }} />
                ) : (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13, border: "1.5px dashed #e5e7eb", borderRadius: 8 }}>Chưa có ảnh banner</div>
                )}
              </div>

              <SectionHeader>Thông tin</SectionHeader>
              <div>
                <label style={labelStyle}>Tên sự kiện</label>
                {isEditing && isFullEdit ? (
                  <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} style={accentInputStyle} />
                ) : <ReadBox value={ev.eventName} />}
              </div>
              <div>
                <label style={labelStyle}>Mô tả sự kiện</label>
                {isEditing && isFullEdit ? (
                  <RichTextEditor value={editForm.description} onChange={(html) => setEditForm((f) => ({ ...f, description: html }))} />
                ) : <RichTextView html={ev.description} />}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Số người tối đa</label>
                  {isEditing ? (
                    <input type="number" min={1} value={editForm.maxParticipants} onChange={(e) => setEditForm((f) => ({ ...f, maxParticipants: e.target.value }))} style={accentInputStyle} />
                  ) : <ReadBox value={ev.maxParticipants ? `${ev.maxParticipants} người` : null} />}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Quỹ dự kiến (VNĐ)</label>
                  {isEditing && isFullEdit ? (
                    <input type="number" min={0} step={1000} value={editForm.budget} onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))} placeholder="0" style={accentInputStyle} />
                  ) : <ReadBox value={fmtBudget(ev.budget)} />}
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 10, border: `1.5px solid ${ev.isPaidEvent ? "#fed7aa" : "#e5e7eb"}`, background: ev.isPaidEvent ? "#fff7ed" : "#f9fafb" }}>
                <label style={{ ...labelStyle, color: "#9a3412" }}>Thể loại sự kiện</label>
                {isEditing && isFullEdit ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, isPaidEvent: false, ticketPrice: "" }))}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                          border: `1.5px solid ${!editForm.isPaidEvent ? "#E6430A" : "#e5e7eb"}`,
                          background: !editForm.isPaidEvent ? "#FFF3EE" : "#fff",
                          color: !editForm.isPaidEvent ? "#E6430A" : "#6b7280",
                        }}
                      >
                        Miễn phí
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, isPaidEvent: true }))}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                          border: `1.5px solid ${editForm.isPaidEvent ? "#E6430A" : "#e5e7eb"}`,
                          background: editForm.isPaidEvent ? "#FFF3EE" : "#fff",
                          color: editForm.isPaidEvent ? "#E6430A" : "#6b7280",
                        }}
                      >
                        Bán vé
                      </button>
                    </div>
                    {editForm.isPaidEvent && (
                      <div style={{ position: "relative" }}>
                        <input
                          type="number" min={1000} step={1000} value={editForm.ticketPrice}
                          onChange={(e) => setEditForm((f) => ({ ...f, ticketPrice: e.target.value }))}
                          placeholder="Giá vé" style={{ ...accentInputStyle, paddingRight: 36 }}
                        />
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "#9ca3af", pointerEvents: "none" }}>đ</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <ReadBox value={ev.isPaidEvent ? `${Number(ev.ticketPrice || 0).toLocaleString("vi-VN")} đ / vé` : "Miễn phí"} />
                )}
              </div>

              <div style={{ padding: 14, borderRadius: 10, border: "1.5px solid #ddd6fe", background: "#f5f3ff" }}>
                <label style={{ ...labelStyle, color: "#6d28d9" }}>Phạm vi sự kiện</label>
                {isEditing && isFullEdit ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { value: false, label: "Công khai" },
                      { value: true, label: "Nội bộ CLB" },
                    ].map((option) => (
                      <button key={String(option.value)} type="button"
                        onClick={() => setEditForm((form) => ({ ...form, isInternal: option.value }))}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${editForm.isInternal === option.value ? "#7c3aed" : "#ddd6fe"}`, background: editForm.isInternal === option.value ? "#ede9fe" : "#fff", color: "#6d28d9" }}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : <ReadBox value={ev.isInternal ? "Nội bộ CLB — chỉ thành viên CLB được tham gia" : "Công khai — mở cho tất cả sinh viên"} />}
              </div>

              <div style={{ padding: 14, borderRadius: 10, border: "1.5px solid #bae6fd", background: "#f0f9ff" }}>
                <label style={{ ...labelStyle, color: "#0369a1" }}>Cách xác nhận đăng ký</label>
                {isEditing && isFullEdit ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { value: false, label: "Tự động xác nhận" },
                      { value: true, label: "Leader duyệt thủ công" },
                    ].map((option) => (
                      <button key={String(option.value)} type="button"
                        onClick={() => setEditForm((form) => ({ ...form, requiresManualApproval: option.value }))}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${editForm.requiresManualApproval === option.value ? "#0284c7" : "#bae6fd"}`, background: editForm.requiresManualApproval === option.value ? "#e0f2fe" : "#fff", color: "#0369a1" }}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : <ReadBox value={ev.requiresManualApproval ? "Leader duyệt thủ công" : "Tự động xác nhận"} />}
              </div>

              <SectionHeader>Thời gian</SectionHeader>
              <div>
                <label style={labelStyle}>Ngày tổ chức</label>
                {isEditing && isFullEdit ? (
                  <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} style={accentInputStyle} />
                ) : <ReadBox value={dateStr} />}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Giờ bắt đầu</label>
                  {isEditing && isFullEdit ? (
                    <input type="time" value={editForm.time} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))} style={accentInputStyle} />
                  ) : <ReadBox value={timeStr || null} />}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Giờ kết thúc</label>
                  {isEditing && isFullEdit ? (
                    <input type="time" value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))} style={accentInputStyle} />
                  ) : <ReadBox value={endTimeStr || null} />}
                </div>
              </div>
            </div>

            {/* Cột phải: Địa điểm (phần dưới để trống, cập nhật sau) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SectionHeader>Địa điểm</SectionHeader>
              <div>
                <label style={labelStyle}>Tên địa điểm / Toà nhà</label>
                {isEditing && isFullEdit ? (
                  <input value={editForm.venueName} onChange={(e) => setEditForm((f) => ({ ...f, venueName: e.target.value }))} placeholder="VD: Hội trường Beta – Đại học FPT" style={accentInputStyle} />
                ) : <ReadBox value={ev.venueName} />}
              </div>
              <div>
                <label style={labelStyle}>Địa chỉ (định vị trên bản đồ)</label>
                {isEditing && isFullEdit ? (
                  <LocationPicker
                    address={editForm.location} lat={editForm.latitude} lng={editForm.longitude}
                    onChange={({ address, lat, lng }) => setEditForm((f) => ({ ...f, location: address, latitude: typeof lat === "number" ? lat : null, longitude: typeof lng === "number" ? lng : null }))}
                  />
                ) : (
                  <LocationPicker address={ev.location} lat={ev.latitude} lng={ev.longitude} readOnly />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lý do từ chối */}
        {status === "REJECTED" && ev.rejectionReason && (
          <div style={{ margin: "16px 24px 0", padding: "14px 16px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fecaca" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: 0.5 }}>Lý do từ chối (ICPDP)</p>
            <p style={{ margin: 0, fontSize: 13.5, color: "#7f1d1d", lineHeight: 1.7, whiteSpace: "pre-line" }}>{ev.rejectionReason}</p>
          </div>
        )}

        {status === "WITHDRAWN" && ev.withdrawalReason && (
          <div style={{ margin: "16px 24px 0", padding: "14px 16px", borderRadius: 10, background: "#fff1f2", border: "1.5px solid #fecdd3" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: "#9f1239", textTransform: "uppercase", letterSpacing: 0.5 }}>Lý do rút yêu cầu tổ chức</p>
            <p style={{ margin: 0, fontSize: 13.5, color: "#881337", lineHeight: 1.7, whiteSpace: "pre-line" }}>{ev.withdrawalReason}</p>
            {ev.withdrawnAt && <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#9f1239" }}>Thời gian rút: {new Date(ev.withdrawnAt).toLocaleString("vi-VN")}</p>}
          </div>
        )}

        {isFullEdit && (
          <div style={{ margin: "16px 24px 0", padding: "10px 14px", borderRadius: 10, background: isSubmitBlocked ? "#fff7ed" : "#f8fafc", border: `1px solid ${isSubmitBlocked ? "#fdba74" : "#e2e8f0"}`, fontSize: 12.5, color: isSubmitBlocked ? "#9a3412" : "#475569" }}>
            {isSubmitBlocked
              ? `Bạn đã gửi đề xuất ${ev.submissionMaxAttempts} lần. Có thể gửi lại sau ${blockedUntilLabel}.`
              : `Còn ${ev.submissionAttemptsRemaining ?? Math.max(0, ev.submissionMaxAttempts - (ev.submissionAttemptCount ?? 0))}/${ev.submissionMaxAttempts} lượt gửi trước khi phải chờ ${ev.submissionCooldownHours} giờ.`}
          </div>
        )}

        {/* Chỉnh sửa thông tin — toàn bộ khi còn Bản nháp; chỉ số người tham gia tối đa sau khi ICPDP đã duyệt (trước khi diễn ra) */}
        <div style={{ padding: "20px 24px" }}>
          {!canEdit && !isEditing && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>Không thể chỉnh sửa thông tin ở trạng thái hiện tại.</p>
          )}
          {isLimitedEdit && !isEditing && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>Sự kiện đã được duyệt — chỉ có thể chỉnh sửa số người tham gia tối đa.</p>
          )}
          {canEdit && !isEditing && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {isFullEdit && (
                <button disabled={busy || isSubmitBlocked} onClick={handleSubmitProposal} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "1.5px solid #E6430A", background: "#fff", color: isSubmitBlocked ? "#9ca3af" : "#E6430A", fontWeight: 600, fontSize: 13, cursor: busy || isSubmitBlocked ? "not-allowed" : "pointer", opacity: isSubmitBlocked ? 0.65 : 1 }}>
                  {isSubmitBlocked ? "Đang tạm khóa gửi" : "Gửi đề xuất"}
                </button>
              )}
              <button onClick={enterEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "#E6430A", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <Pencil size={14} /> Chỉnh sửa
              </button>
            </div>
          )}
          {canEdit && isEditing && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#6b7280", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Hủy chỉnh sửa</button>
              <button disabled={saving} onClick={handleSaveEdit} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: saving ? "#86efac" : "#059669", color: "#fff", fontWeight: 600, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
            </div>
          )}
        </div>
        </>)}

        {activeTab === "manage" && (
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {["DRAFT", "PENDINGAPPROVAL", "PENDING"].includes(status) ? (
            <>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#fffbeb", border: "1.5px solid #fde68a", fontSize: 13.5, color: "#92400e", fontWeight: 600, textAlign: "center" }}>
              {status === "DRAFT" ? "Sự kiện chưa được gửi cho ICPDP duyệt." : "Sự kiện đang chờ ICPDP duyệt."}
            </div>
            {["PENDINGAPPROVAL", "PENDING"].includes(status) && (
              <button disabled={busy} onClick={() => setWithdrawOpen(true)} style={secondaryBtnStyle("#be123c", busy)}>Rút yêu cầu tổ chức</button>
            )}
            </>
          ) : (<>
          <StatusStepper status={status} />

          {/* Approved / Upcoming — hành động chính: mở đăng ký */}
          {(status === "APPROVED" || status === "UPCOMING") && (<>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#ecfeff", border: "1.5px solid #a5f3fc", fontSize: 13.5, color: "#0e7490", fontWeight: 500, lineHeight: 1.6 }}>
              Mở đăng ký để thành viên có thể đăng ký tham gia, đồng thời bạn sẽ xem được trạng thái đăng ký của sự kiện.
            </div>
            <button disabled={busy} onClick={async () => {
              if (!(await confirm("Bạn có chắc muốn mở đăng ký? Thành viên sẽ thấy và có thể đăng ký tham gia.", { confirmLabel: "Mở đăng ký" }))) return;
              runAction(() => eventApi.openRegistration(ev.eventID), { eventStatus: "RegistrationOpen" }, "Lỗi mở đăng ký");
            }} style={btnStyle("#0891b2", busy)}>Mở đăng ký</button>
          </>)}

          {/* RegistrationOpen — danh sách đăng ký hiện ngay tại đây; hành động chính: đóng đăng ký */}
          {status === "REGISTRATIONOPEN" && (<>
            <RegistrationMgmtPage eventId={ev.eventID} embedded maxParticipants={ev.maxParticipants} />
            <button disabled={busy} onClick={async () => {
              if (!(await confirm("Bạn có chắc muốn đóng đăng ký? Thành viên sẽ không thể đăng ký thêm.", { danger: true, confirmLabel: "Đóng đăng ký" }))) return;
              runAction(() => eventApi.closeRegistration(ev.eventID), { eventStatus: "RegistrationClosed" }, "Lỗi đóng đăng ký");
            }} style={btnStyle("#f59e0b", busy)}>Đóng đăng ký</button>
          </>)}

          {/* RegistrationClosed — danh sách đăng ký hiện ngay tại đây; hành động chính: bắt đầu sự kiện */}
          {status === "REGISTRATIONCLOSED" && (<>
            <RegistrationMgmtPage eventId={ev.eventID} embedded maxParticipants={ev.maxParticipants} />
            <button disabled={busy} onClick={() => runAction(() => eventApi.start(ev.eventID), { eventStatus: "Ongoing" }, "Lỗi bắt đầu sự kiện")} style={btnStyle("#059669", busy)}>Bắt đầu sự kiện</button>
          </>)}

          {/* Ongoing — thống kê điểm danh hiện ngay tại đây; hành động chính: kết thúc sự kiện */}
          {status === "ONGOING" && (<>
            <AttendanceDashboardPage eventId={ev.eventID} embedded correctionBasePath={`${eventsListPath}/${ev.eventID}/attendance`} />
            <button onClick={() => navigate(`${eventsListPath}/${ev.eventID}/checkin`)} style={secondaryBtnStyle("#0891b2")}>Điểm danh</button>
            <button onClick={() => setFinishOpen(true)} style={btnStyle("#7c3aed")}>Kết thúc sự kiện</button>
          </>)}

          {/* Completed trở đi — 3 tab con: Báo cáo / Đánh giá / Đóng góp, mỗi tab là 1 trang riêng */}
          {REPORT_PHASE_STATUSES.includes(status) && (<>
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #f0f0f0", marginBottom: 4 }}>
              {[
                { key: "report", label: "Báo cáo" },
                { key: "feedback", label: "Đánh giá" },
                { key: "contribution", label: "Đóng góp" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setReportSubTab(key)}
                  style={{
                    padding: "9px 14px", border: "none", borderBottom: `2.5px solid ${reportSubTab === key ? "#E6430A" : "transparent"}`,
                    background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    color: reportSubTab === key ? "#E6430A" : "#6b7280", marginBottom: -1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {reportSubTab === "report" && (
              <ReportSubmitPage eventId={ev.eventID} embedded onSubmitted={() => patchEvent({ eventStatus: "ReportUploaded" })} />
            )}
            {reportSubTab === "feedback" && <FeedbackSummaryPage eventId={ev.eventID} embedded />}
            {reportSubTab === "contribution" && (<>
              <ContributionManagementPage eventId={ev.eventID} embedded />
              <CloseEventButton eventId={ev.eventID} eventStatus={ev.eventStatus} onCloseSuccess={() => navigate(eventsListPath)} />
            </>)}
          </>)}

          {/* Trạng thái không có thao tác */}
          {status === "CANCELLED" && (
            <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Không có thao tác khả dụng.</p>
          )}

          {status === "WITHDRAWN" && (
            <p style={{ margin: 0, fontSize: 13, color: "#9f1239", fontStyle: "italic" }}>Yêu cầu đã được rút và chỉ còn ở chế độ xem lịch sử.</p>
          )}

          {["REGISTRATIONOPEN", "REGISTRATIONCLOSED"].includes(status) && (
            <button onClick={() => setCancelOpen(true)} style={secondaryBtnStyle("#dc2626")}>Hủy sự kiện</button>
          )}
          </>)}
        </div>
        )}
      </div>

      {/* Cảnh báo chưa lưu khi điều hướng đi nơi khác lúc đang sửa */}
      {blocker.state === "blocked" && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
          onClick={(e) => e.target === e.currentTarget && blocker.reset()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <h2 className="text-[15px] font-bold text-gray-900 m-0">Chưa lưu thay đổi</h2>
              </div>
              <button onClick={() => blocker.reset()} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-[13.5px] text-gray-600 m-0 leading-relaxed">
                Bạn đang chỉnh sửa sự kiện nhưng chưa lưu thông tin. Vui lòng bấm "Lưu thay đổi" trước khi rời khỏi trang này.
              </p>
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => blocker.reset()} className="w-full py-2.5 rounded-xl text-white text-[13.5px] font-bold border-0 cursor-pointer transition-colors bg-[#E6430A] hover:bg-[#c73a08]">
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal huỷ sự kiện */}
      {cancelOpen && <CancelModal event={ev} onConfirm={handleCancelConfirm} onClose={() => setCancelOpen(false)} />}
      {withdrawOpen && <CancelModal withdrawal event={ev} onConfirm={handleWithdrawConfirm} onClose={() => setWithdrawOpen(false)} />}

      {/* Modal kết thúc sự kiện */}
      {finishOpen && (
        <FinishEventModal eventId={ev.eventID} isOpen={true} onClose={() => setFinishOpen(false)} onFinishSuccess={() => navigate(eventsListPath)} />
      )}

    </div>
  );
}
