import { useState } from "react";
import {
  Bell, Info, CheckCircle2, AlertTriangle, Plus, X, Loader2,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationsContext";
import { TokenService } from "../../services/api/axiosClient";

/* ─── Mock data ──────────────────────────────────────────────────── */

const MOCK_NOTIFS = [
  { id: 1, type: "info",    title: "Nhắc nhở nộp báo cáo",         content: "Hạn nộp báo cáo hoạt động học kỳ: 31/07/2026",        time: "2 giờ trước" },
  { id: 2, type: "success", title: "Sự kiện được phê duyệt",        content: 'IC-PDP đã phê duyệt "Workshop UI/UX Design"',          time: "Hôm qua" },
  { id: 3, type: "warning", title: "Đơn tuyển thành viên mới",      content: "Có 3 đơn ứng tuyển đang chờ xem xét",                  time: "2 ngày trước" },
  { id: 4, type: "success", title: "Thành viên mới được phê duyệt", content: "Nguyễn Văn B đã được thêm vào CLB",                   time: "3 ngày trước" },
  { id: 5, type: "info",    title: "Thông báo lịch họp",             content: "Họp ban điều hành: 10/07/2026, 15:00 — Phòng lab IT", time: "1 tuần trước" },
];

const TYPE_CFG = {
  info:    { icon: Info,          color: "#3b82f6", bg: "#eff6ff" },
  success: { icon: CheckCircle2,  color: "#059669", bg: "#ecfdf5" },
  warning: { icon: AlertTriangle, color: "#d97706", bg: "#fffbeb" },
  general: { icon: Bell,          color: "#6366f1", bg: "#eef2ff" },
};

/* ─── Create Notification Modal ──────────────────────────────────── */

function NotifModal({ onClose, onSubmit, submitting }) {
  const [form,   setForm]   = useState({ title: "", content: "" });
  const [errors, setErrors] = useState({});

  const onChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = () => {
    const e = {};
    if (!form.title.trim())   e.title   = "Vui lòng nhập tiêu đề.";
    if (!form.content.trim()) e.content = "Vui lòng nhập nội dung.";
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({ title: form.title.trim(), content: form.content.trim() });
  };

  const iStyle = (hasErr) => ({
    width: "100%", padding: "9px 12px", fontSize: 14, color: "#111827",
    border: `1.5px solid ${hasErr ? "#f87171" : "#e5e7eb"}`,
    borderRadius: 10, outline: "none",
    background: hasErr ? "#fff5f5" : "#fff",
    boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color .15s",
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(13,27,62,0.46)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px 16px", borderBottom: "1.5px solid #f3f4f6",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
              Tạo thông báo mới
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6b7280" }}>
              Thông báo sẽ được gửi đến tất cả thành viên CLB.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "#f3f4f6", color: "#6b7280",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Tiêu đề <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <input
              style={iStyle(!!errors.title)}
              placeholder="Nhập tiêu đề thông báo..."
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              disabled={submitting}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            {errors.title && (
              <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>⚠ {errors.title}</p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Nội dung <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <textarea
              style={{ ...iStyle(!!errors.content), resize: "vertical", lineHeight: 1.65, minHeight: 100 }}
              placeholder="Nhập nội dung thông báo chi tiết..."
              rows={4}
              value={form.content}
              onChange={(e) => onChange("content", e.target.value)}
              disabled={submitting}
            />
            {errors.content && (
              <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>⚠ {errors.content}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "14px 24px", borderTop: "1.5px solid #f3f4f6", background: "#fafafa",
        }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "9px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
              border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151",
              cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#f3f4f6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 24px", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
              border: "none",
              background: submitting ? "#fba97d" : "#E6430A",
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background .15s",
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#c73a08"; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "#E6430A"; }}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi thông báo"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function ClubNotifications() {
  const { addNotification }             = useNotifications();
  const clubId                          = TokenService.getClubId();
  const [notifs,    setNotifs]    = useState(MOCK_NOTIFS);
  const [showModal, setShowModal] = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = ({ title, content }) => {
    setSubmitting(true);
    setTimeout(() => {
      const item = addNotification({ title, content, clubId });
      setNotifs((prev) => [{
        id:      item.id,
        type:    "general",
        title,
        content,
        time:    "Vừa xong",
      }, ...prev]);
      setShowModal(false);
      showToast("success", "Gửi thông báo thành công!");
      setSubmitting(false);
    }, 400);
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Thông Báo</h1>
          <p className="page-subtitle">Quản lý và gửi thông báo đến thành viên CLB</p>
        </div>
        <button className="dl-btn-add" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Tạo thông báo
        </button>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {notifs.map((n) => {
            const cfg  = TYPE_CFG[n.type] ?? TYPE_CFG.general;
            const Icon = cfg.icon;
            return (
              <div key={n.id} style={{
                display: "flex", gap: "1rem", padding: "1rem 1.25rem",
                borderRadius: 12, border: "1.5px solid #f0f0f0", background: "#fff",
                transition: "border-color .15s, box-shadow .15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fde0d0"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(230,67,10,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f0f0f0"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: cfg.bg, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", margin: "0 0 3px" }}>{n.title}</p>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 5px", lineHeight: 1.55 }}>{n.content}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <NotifModal
          onClose={() => !submitting && setShowModal(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
