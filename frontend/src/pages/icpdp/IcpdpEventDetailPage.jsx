import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Pencil, X } from "lucide-react";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import { getServerOrigin } from "../../services/api/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import LocationPicker from "../../components/events/LocationPicker";
import FinishEventModal from "../../components/events/FinishEventModal";
import RegistrationMgmtPage from "../club-leader/RegistrationMgmtPage";
import AttendanceDashboardPage from "../club-leader/AttendanceDashboardPage";

/* Cùng bố cục 2 tab "Thông tin"/"Quản lý" + thanh tiến trình với EventManageDetailPage.jsx
   (club-leader) — ICPDP có đầy đủ quyền quản lý vòng đời sự kiện giống leader (mở/đóng
   đăng ký, bắt đầu/kết thúc/huỷ sự kiện, sửa số người tham gia tối đa sau khi đã duyệt).
   Riêng phần báo cáo/đóng góp không nhúng lại form nộp/chấm điểm của club-leader ở đây —
   ICPDP đã có luồng riêng phù hợp vai trò (tab "Báo cáo" trong Quản Lý Sự Kiện, trang
   Đóng góp) để tránh chồng chéo quyền hạn. */

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

const fmtBudget = (val) => {
  const n = Number(val);
  return isNaN(n) || n === 0 ? null : n.toLocaleString("vi-VN") + " đ";
};

const STATUS_CFG = {
  APPROVED: { label: "Đã duyệt", color: "#059669", bg: "#d1fae5" },
  REGISTRATIONOPEN: { label: "Mở đăng ký", color: "#0891b2", bg: "#cffafe" },
  REGISTRATIONCLOSED: { label: "Đóng đăng ký", color: "#0e7490", bg: "#e0f2fe" },
  ONGOING: { label: "Đang diễn ra", color: "#2563eb", bg: "#dbeafe" },
  COMPLETED: { label: "Đã kết thúc", color: "#7c3aed", bg: "#ede9fe" },
  REPORTUPLOADED: { label: "Đã nộp báo cáo", color: "#9333ea", bg: "#f3e8ff" },
  REPORTPENDINGAPPROVAL: { label: "Báo cáo chờ duyệt", color: "#c026d3", bg: "#fae8ff" },
  REPORTAPPROVED: { label: "Báo cáo đã duyệt", color: "#0f766e", bg: "#ccfbf1" },
  REPORTREJECTED: { label: "Báo cáo bị từ chối", color: "#b91c1c", bg: "#fee2e2" },
  CLOSED: { label: "Đã đóng", color: "#374151", bg: "#e5e7eb" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

const REPORT_PHASE_STATUSES = ["COMPLETED", "REPORTUPLOADED", "REPORTPENDINGAPPROVAL", "REPORTAPPROVED", "REPORTREJECTED", "CONTRIBUTIONDRAFT", "CONTRIBUTIONSCORING", "CONTRIBUTIONPENDINGAPPROVAL", "CONTRIBUTIONAPPROVED", "CONTRIBUTIONFINALIZED", "CLOSED"];

const STEPS = [
  { key: "registration", label: "Đăng ký", statuses: ["APPROVED", "UPCOMING", "REGISTRATIONOPEN", "REGISTRATIONCLOSED", "CHECKINOPEN"] },
  { key: "ongoing", label: "Diễn ra", statuses: ["ONGOING"] },
  { key: "report", label: "Báo cáo và đóng góp", statuses: REPORT_PHASE_STATUSES },
];

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

const labelStyle = { fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", boxSizing: "border-box", outline: "none" };
const accentInputStyle = { ...inputStyle, borderLeft: "3px solid #E6430A" };

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
      ...accentInputStyle, color: value ? "#111827" : "#9ca3af", minHeight: multiline ? 90 : "auto",
      whiteSpace: multiline ? "pre-line" : "normal", lineHeight: multiline ? 1.6 : "normal",
    }}>
      {value || "Chưa có"}
    </div>
  );
}

const btnStyle = (bg, disabled = false) => ({
  padding: "11px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
  background: bg, color: "#fff", border: "none", cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
});

const secondaryBtnStyle = (color, disabled = false) => ({
  padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
  background: "#fff", color, border: `1.5px solid ${color}`, cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
});

const REASON_MIN = 10;
function CancelModal({ eventName, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const isValid = reason.trim().length >= REASON_MIN;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900 m-0">Hủy sự kiện</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer border-none bg-transparent">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            Nhập lý do hủy sự kiện <strong>"{eventName}"</strong>.
          </p>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }}
            placeholder="Nhập lý do hủy..."
            rows={4}
            className={`w-full resize-none rounded-xl border text-[13.5px] text-gray-800 px-3.5 py-3 outline-none transition-colors leading-relaxed ${
              touched && !isValid ? "border-red-400 bg-red-50/40" : "border-gray-200 focus:border-[#e6430a] bg-white"
            }`}
            style={{ boxSizing: "border-box" }}
          />
          {touched && !isValid && <p className="text-[12px] text-red-600 mt-1">Lý do phải có ít nhất {REASON_MIN} ký tự.</p>}
        </div>
        <div className="flex gap-2.5 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50 cursor-pointer">
            Đóng
          </button>
          <button
            onClick={() => { setTouched(true); if (isValid) onConfirm(reason.trim()); }}
            className="flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold border-none bg-red-600 hover:bg-red-700 cursor-pointer"
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IcpdpEventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [ev, setEv] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ maxParticipants: "" });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [detail, clubRows] = await Promise.all([
          eventApi.getEventByIdForIcpdp(eventId),
          clubApi.getAll(),
        ]);
        if (!active) return;
        if (detail) setEv(detail?.data ?? detail);
        else setNotFound(true);
        setClubs(Array.isArray(clubRows) ? clubRows : (clubRows?.data ?? clubRows?.content ?? []));
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [eventId]);

  const patchEvent = (patch) => setEv((prev) => (prev ? { ...prev, ...patch } : prev));

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

  const handleCancelConfirm = async (reason) => {
    try {
      await eventApi.cancel(ev.clubID, ev.eventID, reason);
      patchEvent({ eventStatus: "Cancelled" });
      setCancelOpen(false);
      toast.success("Đã hủy sự kiện.");
    } catch (e) {
      toast.error("Lỗi khi hủy sự kiện: " + (e.response?.data?.message || e.message));
    }
  };

  const enterEdit = () => {
    setEditForm({ maxParticipants: ev.maxParticipants ?? "" });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await eventApi.update(ev.eventID, {
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : undefined,
      });
      patchEvent({ maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : ev.maxParticipants });
      setIsEditing(false);
      toast.success("Đã lưu thay đổi.");
    } catch (e) {
      toast.error("Lỗi lưu thay đổi: " + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Đang tải...</div>;
  if (notFound || !ev) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Không tìm thấy sự kiện.</div>;

  const rawStatus = ev.eventStatus ?? "";
  const status = rawStatus.toUpperCase().replace(/_/g, "");
  const cfg = STATUS_CFG[status] ?? { label: rawStatus, color: "#6b7280", bg: "#f3f4f6" };
  const club = clubs.find((c) => c.clubID === ev.clubID);
  const clubName = club?.name ?? club?.clubName ?? "CLB FPTU";

  const isLimitedEdit = ["APPROVED", "UPCOMING", "REGISTRATIONOPEN", "REGISTRATIONCLOSED"].includes(status);
  const canCancel = ["APPROVED", "REGISTRATIONOPEN", "REGISTRATIONCLOSED", "ONGOING"].includes(status);

  const dateStr = ev.startDate ? new Date(ev.startDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Chưa xác định";
  const timeStr = ev.startDate ? new Date(ev.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
  const endTimeStr = ev.endDate ? new Date(ev.endDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(-1)} title="Quay lại"
          style={{ border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151", flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Chi Tiết Sự Kiện</h1>
          <p className="page-subtitle">{clubName}</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(13,27,62,0.07)", border: "1px solid #f0f0f0", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, marginBottom: 8 }}>{cfg.label}</span>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827", lineHeight: 1.35, wordBreak: "break-word" }}>{ev.eventName}</h2>
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
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Ảnh banner</label>
                  {ev.bannerUrl ? (
                    <img src={getImageUrl(ev.bannerUrl)} alt="Banner" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, display: "block" }} />
                  ) : (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13, border: "1.5px dashed #e5e7eb", borderRadius: 8 }}>Chưa có ảnh banner</div>
                  )}
                </div>

                <SectionHeader>Thông tin</SectionHeader>
                <div>
                  <label style={labelStyle}>Tên sự kiện</label>
                  <ReadBox value={ev.eventName} />
                </div>
                <div>
                  <label style={labelStyle}>Mô tả sự kiện</label>
                  <ReadBox value={ev.description} multiline />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Số người tối đa</label>
                    {isEditing ? (
                      <input type="number" min={1} value={editForm.maxParticipants}
                        onChange={(e) => setEditForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                        style={accentInputStyle} />
                    ) : <ReadBox value={ev.maxParticipants ? `${ev.maxParticipants} người` : null} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Quỹ dự kiến (VNĐ)</label>
                    <ReadBox value={fmtBudget(ev.budget)} />
                  </div>
                </div>

                <SectionHeader>Thời gian</SectionHeader>
                <div>
                  <label style={labelStyle}>Ngày tổ chức</label>
                  <ReadBox value={dateStr} />
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

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <SectionHeader>Địa điểm</SectionHeader>
                <div>
                  <label style={labelStyle}>Tên địa điểm / Toà nhà</label>
                  <ReadBox value={ev.venueName} />
                </div>
                <div>
                  <label style={labelStyle}>Địa chỉ (định vị trên bản đồ)</label>
                  <LocationPicker address={ev.location} lat={ev.latitude} lng={ev.longitude} readOnly />
                </div>
                <div>
                  <label style={labelStyle}>Chi tiết cụ thể</label>
                  <ReadBox value={ev.locationDetail} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {!isLimitedEdit && !isEditing && (
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>Không thể chỉnh sửa thông tin ở trạng thái hiện tại.</p>
            )}
            {isLimitedEdit && !isEditing && (
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>Sự kiện đã được duyệt — chỉ có thể chỉnh sửa số người tham gia tối đa.</p>
            )}
            {isLimitedEdit && !isEditing && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={enterEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "#E6430A", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  <Pencil size={14} /> Chỉnh sửa
                </button>
              </div>
            )}
            {isLimitedEdit && isEditing && (
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
              <div style={{ padding: "14px 16px", borderRadius: 10, background: "#fffbeb", border: "1.5px solid #fde68a", fontSize: 13.5, color: "#92400e", fontWeight: 600, textAlign: "center" }}>
                Sự kiện chưa được duyệt.
              </div>
            ) : (<>
              <StatusStepper status={status} />

              {status === "APPROVED" && (<>
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "#ecfeff", border: "1.5px solid #a5f3fc", fontSize: 13.5, color: "#0e7490", fontWeight: 500, lineHeight: 1.6 }}>
                  Mở đăng ký để thành viên có thể đăng ký tham gia, đồng thời xem được trạng thái đăng ký của sự kiện.
                </div>
                <button disabled={busy} onClick={async () => {
                  if (!(await confirm("Bạn có chắc muốn mở đăng ký? Thành viên sẽ thấy và có thể đăng ký tham gia.", { confirmLabel: "Mở đăng ký" }))) return;
                  runAction(() => eventApi.openRegistration(ev.eventID), { eventStatus: "RegistrationOpen" }, "Lỗi mở đăng ký");
                }} style={btnStyle("#0891b2", busy)}>Mở đăng ký</button>
              </>)}

              {status === "REGISTRATIONOPEN" && (<>
                <RegistrationMgmtPage eventId={ev.eventID} embedded maxParticipants={ev.maxParticipants} />
                <button disabled={busy} onClick={async () => {
                  if (!(await confirm("Bạn có chắc muốn đóng đăng ký? Thành viên sẽ không thể đăng ký thêm.", { danger: true, confirmLabel: "Đóng đăng ký" }))) return;
                  runAction(() => eventApi.closeRegistration(ev.eventID), { eventStatus: "RegistrationClosed" }, "Lỗi đóng đăng ký");
                }} style={btnStyle("#f59e0b", busy)}>Đóng đăng ký</button>
              </>)}

              {status === "REGISTRATIONCLOSED" && (<>
                <RegistrationMgmtPage eventId={ev.eventID} embedded maxParticipants={ev.maxParticipants} />
                <button disabled={busy} onClick={() => runAction(() => eventApi.start(ev.eventID), { eventStatus: "Ongoing" }, "Lỗi bắt đầu sự kiện")} style={btnStyle("#059669", busy)}>Bắt đầu sự kiện</button>
              </>)}

              {status === "ONGOING" && (<>
                <AttendanceDashboardPage eventId={ev.eventID} embedded correctionBasePath={`/icpdp/events/${ev.eventID}/attendance`} />
                <button onClick={() => navigate(`/icpdp/events/${ev.eventID}/checkin`)} style={secondaryBtnStyle("#0891b2")}>Điểm danh</button>
                <button onClick={() => setFinishOpen(true)} style={btnStyle("#7c3aed")}>Kết thúc sự kiện</button>
              </>)}

              {REPORT_PHASE_STATUSES.includes(status) && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "#f5f3ff", border: "1.5px solid #ddd6fe", fontSize: 13.5, color: "#5b21b6", lineHeight: 1.6 }}>
                  Sự kiện đã kết thúc — vào tab <strong>"Báo cáo"</strong> (Quản Lý Sự Kiện) để xem/duyệt báo cáo, hoặc trang <strong>"Đóng góp"</strong> để xem điểm đóng góp thành viên.
                </div>
              )}

              {["CANCELLED", "REJECTED"].includes(status) && (
                <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Không có thao tác khả dụng.</p>
              )}

              {canCancel && (
                <button disabled={busy} onClick={() => setCancelOpen(true)} style={{ ...secondaryBtnStyle("#dc2626", busy), marginTop: 4 }}>Hủy sự kiện</button>
              )}
            </>)}
          </div>
        )}
      </div>

      {cancelOpen && <CancelModal eventName={ev.eventName} onConfirm={handleCancelConfirm} onClose={() => setCancelOpen(false)} />}
      {finishOpen && (
        <FinishEventModal eventId={ev.eventID} isOpen={true} onClose={() => setFinishOpen(false)} onFinishSuccess={() => { patchEvent({ eventStatus: "Completed" }); setFinishOpen(false); }} />
      )}
    </div>
  );
}
