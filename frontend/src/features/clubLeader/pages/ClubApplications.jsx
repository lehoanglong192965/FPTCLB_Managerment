import { useState, useMemo } from "react";
import {
  Calendar, Users, Star, Send, AlertCircle, Clock,
  X, ChevronDown, Search, FileText, CheckCircle2,
  UserCheck, Hourglass,
} from "lucide-react";
import "../../../assets/css/ClubApplications.css";

// ── Mock data ────────────────────────────────────────────────────────────────

const now = new Date();
const RECRUITMENT_START = new Date(now);
RECRUITMENT_START.setDate(RECRUITMENT_START.getDate() - 10);
const RECRUITMENT_END = new Date(RECRUITMENT_START);
RECRUITMENT_END.setDate(RECRUITMENT_END.getDate() + 15);

// BR-R04: invitation may only be sent after the 15-day window closes
const isRecruitmentEnded = now > RECRUITMENT_END;

const fmtDate = (d) =>
  d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

// Format "2026-06-05 14:00" → "05/06/2026 – 14:00"
function fmtDateTime(raw) {
  if (!raw) return null;
  const [datePart, timePart] = raw.split(" ");
  if (!datePart) return raw;
  const [y, m, d] = datePart.split("-");
  const dateStr = `${d}/${m}/${y}`;
  return timePart ? `${dateStr} – ${timePart}` : dateStr;
}

// Format date input value 
// (storage format unchanged, only display changes)

const MOCK_INTERVIEWERS = [
  { id: 1, name: "Nguyễn Văn A", role: "Leader" },
  { id: 2, name: "Trần Thị B",   role: "Vice-Leader" },
  { id: 3, name: "Lê Văn C",     role: "Core Team" },
];

const INITIAL_APPLICATIONS = [
  { id: 1, studentId: "SE170001", name: "Phạm Minh D",  status: "PENDING",     interviewDate: null,               interviewerId: null, score: null },
  { id: 2, studentId: "SE170002", name: "Hoàng Thị E",  status: "PENDING",     interviewDate: null,               interviewerId: null, score: null },
  { id: 3, studentId: "SE170003", name: "Vũ Văn F",     status: "INTERVIEWED", interviewDate: "2026-06-05 14:00", interviewerId: 1,    score: 85   },
  { id: 4, studentId: "SE170004", name: "Đinh Thị G",   status: "PENDING",     interviewDate: null,               interviewerId: null, score: null },
  { id: 5, studentId: "SE170005", name: "Bùi Quang H",  status: "INTERVIEWED", interviewDate: "2026-06-04 09:00", interviewerId: 2,    score: 72   },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusMeta(status) {
  switch (status) {
    case "INTERVIEWED": return { label: "Đã phỏng vấn", cls: "ca-status--interviewed" };
    case "INVITED":     return { label: "Đã mời",        cls: "ca-status--invited" };
    default:            return { label: "Chờ xử lý",     cls: "ca-status--pending" };
  }
}

function getInterviewerObj(id) {
  return MOCK_INTERVIEWERS.find((i) => i.id === id) ?? null;
}

function getInitials(name) {
  return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  ["#dbeafe", "#1d4ed8"],
  ["#fce7f3", "#be185d"],
  ["#d1fae5", "#065f46"],
  ["#fef3c7", "#92400e"],
  ["#ede9fe", "#6d28d9"],
];
function avatarColor(name) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (type, text) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };
  return { toasts, success: (t) => push("success", t), error: (t) => push("error", t) };
}

function ToastList({ toasts }) {
  return (
    <div className="ca-toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`ca-toast ca-toast--${t.type}`}>
          <span className="ca-toast-icon">{t.type === "success" ? "✓" : "✕"}</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, icon, onClose, onConfirm, confirmLabel = "Lưu thay đổi", children }) {
  return (
    <div className="ca-overlay" onClick={onClose}>
      <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ca-modal-header">
          <div className="ca-modal-title-row">
            {icon && <span className="ca-modal-icon">{icon}</span>}
            <h3 className="ca-modal-title">{title}</h3>
          </div>
          <button className="ca-modal-close" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="ca-modal-body">{children}</div>
        <div className="ca-modal-footer">
          <button className="ca-btn ca-btn--ghost" onClick={onClose}>Hủy bỏ</button>
          <button className="ca-btn ca-btn--primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClubApplications() {
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const toast = useToast();
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // modal state
  const [modal, setModal]         = useState(null); // null | "schedule" | "assign" | "score"
  const [currentId, setCurrentId] = useState(null);

  // form fields
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [assignedIv, setAssignedIv]     = useState("");
  const [score, setScore]               = useState("");

  const currentApp = applications.find((a) => a.id === currentId);

  function openModal(type, id) {
    setCurrentId(id);
    setScheduleDate(""); setScheduleTime(""); setAssignedIv(""); setScore("");
    setModal(type);
  }
  function closeModal() { setModal(null); setCurrentId(null); }

  // ── Action handlers ────────────────────────────────────────────────────────

  function handleSchedule() {
    if (!scheduleDate || !scheduleTime) {
      toast.error("Vui lòng chọn ngày và giờ phỏng vấn");
      return;
    }
    setApplications((p) =>
      p.map((a) => a.id === currentId ? { ...a, interviewDate: `${scheduleDate} ${scheduleTime}` } : a)
    );
    toast.success("Đã xếp lịch phỏng vấn thành công!");
    closeModal();
  }

  function handleAssign() {
    if (!assignedIv) { toast.error("Vui lòng chọn người phỏng vấn"); return; }
    setApplications((p) =>
      p.map((a) => a.id === currentId ? { ...a, interviewerId: Number(assignedIv) } : a)
    );
    toast.success("Đã phân công người phỏng vấn thành công!");
    closeModal();
  }

  function handleScore() {
    const s = Number(score);
    if (score === "" || isNaN(s) || s < 0 || s > 100) {
      toast.error("Vui lòng nhập điểm hợp lệ (0–100)");
      return;
    }
    setApplications((p) =>
      p.map((a) => a.id === currentId ? { ...a, score: s, status: "INTERVIEWED" } : a)
    );
    toast.success("Đã cập nhật điểm thành công!");
    closeModal();
  }

  // BR-R04 guard
  function handleSendInvitation(id) {
    if (!isRecruitmentEnded) {
      toast.error("BR-R04: Đợt nhận đơn 15 ngày chưa kết thúc. Không thể gửi lời mời.");
      return;
    }
    setApplications((p) => p.map((a) => a.id === id ? { ...a, status: "INVITED" } : a));
    toast.success("Đã gửi lời mời phỏng vấn thành công!");
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total       = applications.length;
  const pending     = applications.filter((a) => a.status === "PENDING").length;
  const interviewed = applications.filter((a) => a.status === "INTERVIEWED").length;
  const invited     = applications.filter((a) => a.status === "INVITED").length;
  const daysLeft    = Math.max(0, Math.ceil((RECRUITMENT_END - now) / 86400000));

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.studentId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [applications, search, filterStatus]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="ca-page">
      <ToastList toasts={toast.toasts} />

      {/* Header */}
      <div className="ca-page-header">
        <div>
          <h1 className="page-title">Quản Lý Đơn Ứng Tuyển</h1>
          <p className="page-subtitle">
            Xếp lịch, phân công người chấm và nhập điểm phỏng vấn cho Ban Điều Hành
          </p>
        </div>
        <div className={`ca-campaign-tag ${isRecruitmentEnded ? "ca-campaign-tag--closed" : "ca-campaign-tag--open"}`}>
          <Clock size={12} />
          {fmtDate(RECRUITMENT_START)} → {fmtDate(RECRUITMENT_END)}
          <span className="ca-campaign-sep" />
          {isRecruitmentEnded ? "Đã đóng" : `Còn ${daysLeft} ngày`}
        </div>
      </div>

      {/* BR-R04 warning banner */}
      {!isRecruitmentEnded && (
        <div className="ca-br-banner">
          <AlertCircle size={14} />
          <span>
            — Nút <b>Gửi lời mời</b> bị vô hiệu hóa cho đến khi đợt nhận đơn 15 ngày
            kết thúc vào <b>{fmtDate(RECRUITMENT_END)}</b>.
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="ca-stats">
        <div className="ca-stat ca-stat--blue">
          <div className="ca-stat-icon-wrap"><FileText size={18} /></div>
          <div className="ca-stat-body">
            <div className="ca-stat-value">{total}</div>
            <div className="ca-stat-label">Tổng đơn</div>
          </div>
        </div>
        <div className="ca-stat ca-stat--orange">
          <div className="ca-stat-icon-wrap"><Hourglass size={18} /></div>
          <div className="ca-stat-body">
            <div className="ca-stat-value">{pending}</div>
            <div className="ca-stat-label">Chờ xử lý</div>
          </div>
        </div>
        <div className="ca-stat ca-stat--purple">
          <div className="ca-stat-icon-wrap"><UserCheck size={18} /></div>
          <div className="ca-stat-body">
            <div className="ca-stat-value">{interviewed}</div>
            <div className="ca-stat-label">Đã phỏng vấn</div>
          </div>
        </div>
        <div className="ca-stat ca-stat--green">
          <div className="ca-stat-icon-wrap"><CheckCircle2 size={18} /></div>
          <div className="ca-stat-body">
            <div className="ca-stat-value">{invited}</div>
            <div className="ca-stat-label">Đã gửi lời mời</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="ca-controls">
        <div className="ca-search-wrap">
          <Search size={13} className="ca-search-icon" />
          <input
            className="ca-search"
            type="text"
            placeholder="Tìm theo tên hoặc MSSV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ca-select-wrap ca-filter-wrap">
          <select
            className="ca-form-input ca-select ca-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="INTERVIEWED">Đã phỏng vấn</option>
            <option value="INVITED">Đã mời</option>
          </select>
          <ChevronDown size={13} className="ca-select-icon" />
        </div>
        <span className="ca-result-count">
          Hiển thị <strong>{filtered.length}</strong> / {total} đơn
        </span>
      </div>

      {/* Table */}
      <div className="ca-table-wrap">
        <table className="ca-table">
          <thead>
            <tr>
              <th>Ứng Viên</th>
              <th>Trạng Thái</th>
              <th>Lịch Phỏng Vấn</th>
              <th>Người Phỏng Vấn</th>
              <th className="ca-col-center">Điểm</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="ca-empty">Không tìm thấy đơn ứng tuyển nào.</td>
              </tr>
            ) : (
              filtered.map((app) => {
                const { label, cls } = getStatusMeta(app.status);
                const iv = getInterviewerObj(app.interviewerId);
                const [bgColor, textColor] = avatarColor(app.name);
                return (
                  <tr key={app.id}>
                    <td>
                      <div className="ca-user-cell">
                        <div className="ca-avatar" style={{ background: bgColor, color: textColor }}>
                          {getInitials(app.name)}
                        </div>
                        <div>
                          <p className="ca-user-name">{app.name}</p>
                          <p className="ca-user-id">{app.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ca-status ${cls}`}>
                        <span className="ca-status-dot" />
                        {label}
                      </span>
                    </td>
                    <td className="ca-cell-secondary">
                      {app.interviewDate
                        ? fmtDateTime(app.interviewDate)
                        : <em className="ca-unset">Chưa xếp lịch</em>}
                    </td>
                    <td className="ca-cell-secondary">
                      {iv ? (
                        <span>
                          {iv.name}
                          <span className="ca-iv-role"> · {iv.role}</span>
                        </span>
                      ) : (
                        <em className="ca-unset">Chưa phân công</em>
                      )}
                    </td>
                    <td className="ca-col-center">
                      {app.score !== null
                        ? <span className="ca-score">{app.score}</span>
                        : <span className="ca-score-empty">—</span>}
                    </td>
                    <td>
                      <div className="ca-actions">
                        <button
                          className="ca-btn ca-btn--sm ca-btn--ghost"
                          onClick={() => openModal("schedule", app.id)}
                          title="Xếp lịch phỏng vấn"
                        >
                          <Calendar size={12} /> Xếp Lịch
                        </button>
                        <button
                          className="ca-btn ca-btn--sm ca-btn--ghost"
                          onClick={() => openModal("assign", app.id)}
                          title="Phân công người phỏng vấn"
                        >
                          <Users size={12} /> Phân Công
                        </button>
                        <button
                          className="ca-btn ca-btn--sm ca-btn--ghost"
                          onClick={() => openModal("score", app.id)}
                          title="Nhập điểm phỏng vấn"
                        >
                          <Star size={12} /> Nhập Điểm
                        </button>

                        {/* BR-R04: locked span when recruitment still open */}
                        {isRecruitmentEnded ? (
                          <button
                            className={`ca-btn ca-btn--sm ca-btn--invite${app.status === "INVITED" ? " ca-btn--invited" : ""}`}
                            disabled={app.status === "INVITED"}
                            onClick={() => handleSendInvitation(app.id)}
                            title={app.status === "INVITED" ? "Đã gửi lời mời" : "Gửi lời mời"}
                          >
                            <Send size={12} />
                            {app.status === "INVITED" ? "Đã Mời" : "Mời"}
                          </button>
                        ) : (
                          <span
                            className="ca-btn-locked"
                            title="BR-R04: Đợt nhận đơn chưa kết thúc — không thể gửi lời mời"
                          >
                            <Send size={12} /> Mời
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Schedule modal ───────────────────────────────────────────── */}
      {modal === "schedule" && (
        <Modal
          title="Xếp Lịch Phỏng Vấn"
          icon={<Calendar size={16} />}
          onClose={closeModal}
          onConfirm={handleSchedule}
          confirmLabel="Lưu lịch phỏng vấn"
        >
          {currentApp && (
            <div className="ca-modal-app-info">
              <div className="ca-modal-app-name">{currentApp.name}</div>
              <div className="ca-modal-app-id">{currentApp.studentId}</div>
            </div>
          )}
          <div className="ca-form-row">
            <label className="ca-form-label">Ngày phỏng vấn</label>
            <input
              type="date"
              className="ca-form-input"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <div className="ca-form-row">
            <label className="ca-form-label">Giờ phỏng vấn</label>
            <input
              type="time"
              className="ca-form-input"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {/* ── Assign modal ─────────────────────────────────────────────── */}
      {modal === "assign" && (
        <Modal
          title="Phân Công Người Phỏng Vấn"
          icon={<Users size={16} />}
          onClose={closeModal}
          onConfirm={handleAssign}
          confirmLabel="Xác nhận phân công"
        >
          {currentApp && (
            <div className="ca-modal-app-info">
              <div className="ca-modal-app-name">{currentApp.name}</div>
              <div className="ca-modal-app-id">{currentApp.studentId}</div>
            </div>
          )}
          <div className="ca-form-row">
            <label className="ca-form-label">Thành viên Ban Điều Hành</label>
            <div className="ca-select-wrap">
              <select
                className="ca-form-input ca-select"
                value={assignedIv}
                onChange={(e) => setAssignedIv(e.target.value)}
              >
                <option value="">— Chọn người phỏng vấn —</option>
                {MOCK_INTERVIEWERS.map((iv) => (
                  <option key={iv.id} value={iv.id}>
                    {iv.name} ({iv.role})
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="ca-select-icon" />
            </div>
          </div>
        </Modal>
      )}

      {/* ── Score modal ──────────────────────────────────────────────── */}
      {modal === "score" && (
        <Modal
          title="Nhập Điểm Phỏng Vấn"
          icon={<Star size={16} />}
          onClose={closeModal}
          onConfirm={handleScore}
          confirmLabel="Cập nhật điểm"
        >
          {currentApp && (
            <div className="ca-modal-app-info">
              <div className="ca-modal-app-name">{currentApp.name}</div>
              <div className="ca-modal-app-id">{currentApp.studentId}</div>
            </div>
          )}
          <div className="ca-form-row">
            <label className="ca-form-label">Điểm phỏng vấn (0 – 100)</label>
            <input
              type="number"
              className="ca-form-input ca-score-input"
              min={0}
              max={100}
              placeholder="Nhập điểm số..."
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <p className="ca-score-hint">
            Điểm sẽ cập nhật trạng thái ứng viên sang <b>Đã phỏng vấn</b>
          </p>
        </Modal>
      )}
    </div>
  );
}