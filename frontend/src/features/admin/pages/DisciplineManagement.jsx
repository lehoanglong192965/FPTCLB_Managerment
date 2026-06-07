import { useState, useMemo } from "react";
import { Search, Plus, ShieldOff, ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import "../../../assets/css/disciplineManagement.css";

/* ── Severity helpers ───────────────────────────────────────── */
const SEVERITY_MAP = {
  light:   { label: "Nhẹ",       cls: "dm-severity--light" },
  medium:  { label: "Trung bình", cls: "dm-severity--medium" },
  serious: { label: "Nghiêm trọng", cls: "dm-severity--serious" },
};

/* ── Mock data ──────────────────────────────────────────────── */
const INITIAL_RECORDS = [
  { id: 1, userID: 2, fullName: "Trần Thị B",  email: "b.tranthi@fpt.edu.vn",  major: "AI", accountStatus: "Active",    severity: "light",   type: "Đi trễ sinh hoạt",        description: "Đến trễ 15 phút buổi sinh hoạt CLB ngày 12/3",      date: "2026-03-12" },
  { id: 2, userID: 3, fullName: "Lê Văn C",    email: "c.levan@fpt.edu.vn",    major: "SE", accountStatus: "Suspended", severity: "serious", type: "Vi phạm nội quy nghiêm trọng", description: "Gây rối trong sự kiện Tech Talk, không tuân thủ nội quy", date: "2026-02-20" },
  { id: 3, userID: 5, fullName: "Hoàng Văn E",  email: "e.hoangvan@fpt.edu.vn", major: "GD", accountStatus: "Suspended", severity: "medium",  type: "Bỏ sự kiện không phép",   description: "Đăng ký nhưng không tham gia sự kiện Workshop AI",  date: "2026-04-05" },
  { id: 4, userID: 6, fullName: "Đinh Thị F",   email: "f.dinhthi@fpt.edu.vn",  major: "IA", accountStatus: "Active",    severity: "light",   type: "Không hoàn thành nhiệm vụ", description: "Chưa nộp báo cáo tổng kết hoạt động tháng 4",       date: "2026-04-30" },
  { id: 5, userID: 7, fullName: "Vũ Minh G",    email: "g.vuminh@fpt.edu.vn",   major: "SE", accountStatus: "Active",    severity: "medium",  type: "Sử dụng tài khoản sai mục đích", description: "Đăng nội dung không liên quan trên kênh CLB", date: "2026-05-10" },
];

const STUDENTS_FOR_SELECT = [
  { userID: 2, fullName: "Trần Thị B",  email: "b.tranthi@fpt.edu.vn" },
  { userID: 3, fullName: "Lê Văn C",    email: "c.levan@fpt.edu.vn" },
  { userID: 5, fullName: "Hoàng Văn E", email: "e.hoangvan@fpt.edu.vn" },
  { userID: 6, fullName: "Đinh Thị F",  email: "f.dinhthi@fpt.edu.vn" },
  { userID: 7, fullName: "Vũ Minh G",   email: "g.vuminh@fpt.edu.vn" },
  { userID: 8, fullName: "Bùi Thị H",   email: "h.buithi@fpt.edu.vn" },
];

function SeverityBadge({ severity }) {
  const info = SEVERITY_MAP[severity] ?? SEVERITY_MAP.light;
  return (
    <span className={`dm-severity ${info.cls}`}>
      <span className="dm-severity-dot" />
      {info.label}
    </span>
  );
}

/* ── Nút Tạm khóa / Mở khóa — tái sử dụng thiết kế từ UserManagement ── */
function LockAccountButton({ record, onToggle }) {
  const isActive = record.accountStatus === "Active";
  return (
    <div className="dm-action-wrap">
      {isActive ? (
        <button className="dm-btn-suspend" onClick={() => onToggle(record, "suspend")}>
          <ShieldOff size={13} /> Tạm khóa
        </button>
      ) : (
        <button className="dm-btn-activate" onClick={() => onToggle(record, "activate")}>
          <ShieldCheck size={13} /> Mở khóa
        </button>
      )}
    </div>
  );
}

const EMPTY_FORM = { userID: "", type: "", severity: "light", description: "" };

export default function DisciplineManagement() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");   // severity filter
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  /* ── Toggle account status ──────────────────────────────── */
  function handleToggleAccount(record, type) {
    const msg = type === "suspend"
      ? `Tạm khóa tài khoản "${record.fullName}"?`
      : `Mở khóa tài khoản "${record.fullName}"?`;
    if (!window.confirm(msg)) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id
          ? { ...r, accountStatus: type === "suspend" ? "Suspended" : "Active" }
          : r
      )
    );
  }

  /* ── Delete record ──────────────────────────────────────── */
  function handleDelete(record) {
    if (!window.confirm(`Xoá bản ghi kỷ luật của "${record.fullName}"?\nThao tác này không thể hoàn tác.`)) return;
    setRecords((prev) => prev.filter((r) => r.id !== record.id));
  }

  /* ── Add new violation ──────────────────────────────────── */
  function openModal() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.userID || !form.type) {
      setFormError("Vui lòng chọn sinh viên và nhập loại vi phạm.");
      return;
    }

    const student = STUDENTS_FOR_SELECT.find((s) => s.userID === Number(form.userID));
    if (!student) {
      setFormError("Sinh viên không hợp lệ.");
      return;
    }

    const newRecord = {
      id: Date.now(),
      userID: student.userID,
      fullName: student.fullName,
      email: student.email,
      major: "—",
      accountStatus: "Active",
      severity: form.severity,
      type: form.type,
      description: form.description,
      date: new Date().toISOString().slice(0, 10),
    };

    setRecords((prev) => [newRecord, ...prev]);
    closeModal();
  }

  /* ── Filtering ──────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.type?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" || r.severity === filter;
      return matchSearch && matchFilter;
    });
  }, [records, search, filter]);

  /* ── Stats ──────────────────────────────────────────────── */
  const totalRecords  = records.length;
  const lightCount    = records.filter((r) => r.severity === "light").length;
  const mediumCount   = records.filter((r) => r.severity === "medium").length;
  const seriousCount  = records.filter((r) => r.severity === "serious").length;
  const lockedCount   = records.filter((r) => r.accountStatus === "Suspended").length;

  return (
    <div>
      <div className="dm-header">
        <h1 className="page-title">Quản lý Kỷ luật</h1>
        <div className="dm-controls">
          <div className="dm-search-wrap">
            <Search size={15} className="dm-search-icon" />
            <input
              className="dm-search"
              type="text"
              placeholder="Tìm tên, email hoặc loại vi phạm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="dm-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả mức độ</option>
            <option value="light">Nhẹ</option>
            <option value="medium">Trung bình</option>
            <option value="serious">Nghiêm trọng</option>
          </select>
          <button className="dm-btn-add" onClick={openModal}>
            <Plus size={16} /> Ghi lỗi kỷ luật
          </button>
        </div>
      </div>

      {/* ── Stats cards ───────────────────────────────────── */}
      <div className="dm-stats">
        <div className="dm-stat-card dm-stat-card--total">
          <div className="dm-stat-value">{totalRecords}</div>
          <div className="dm-stat-label">Tổng bản ghi</div>
        </div>
        <div className="dm-stat-card dm-stat-card--warning">
          <div className="dm-stat-value">{lightCount + mediumCount}</div>
          <div className="dm-stat-label">Nhẹ + TB</div>
        </div>
        <div className="dm-stat-card dm-stat-card--danger">
          <div className="dm-stat-value">{seriousCount}</div>
          <div className="dm-stat-label">Nghiêm trọng</div>
        </div>
        <div className="dm-stat-card dm-stat-card--locked">
          <div className="dm-stat-value">{lockedCount}</div>
          <div className="dm-stat-label">Đã tạm khóa</div>
        </div>
      </div>

      <p className="dm-count">
        Hiển thị <strong>{filtered.length}</strong> / {records.length} bản ghi
      </p>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="dm-table-wrap">
        <table className="dm-table">
          <thead>
            <tr>
              <th>Sinh viên</th>
              <th>Loại vi phạm</th>
              <th>Mức độ</th>
              <th>Ngày ghi nhận</th>
              <th>Tài khoản</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="dm-empty">Không tìm thấy bản ghi kỷ luật nào.</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="dm-user-cell">
                      <div className="dm-avatar">{r.fullName?.[0]?.toUpperCase() ?? "?"}</div>
                      <div>
                        <p className="dm-user-name">{r.fullName ?? "—"}</p>
                        <p className="dm-user-email">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="dm-violation-type">{r.type}</p>
                    <p className="dm-violation-desc" title={r.description}>{r.description}</p>
                  </td>
                  <td><SeverityBadge severity={r.severity} /></td>
                  <td>{r.date}</td>
                  <td>
                    {/* Nút Tạm khóa tài khoản — import từ thiết kế UserManagement */}
                    <LockAccountButton record={r} onToggle={handleToggleAccount} />
                  </td>
                  <td>
                    <button className="dm-btn-delete" title="Xoá bản ghi" onClick={() => handleDelete(r)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add violation modal ───────────────────────────── */}
      {showModal && (
        <div className="dm-modal-overlay" onClick={closeModal}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dm-modal-title">
              <AlertTriangle size={20} style={{ color: "#e6430a", marginRight: 8, verticalAlign: "middle" }} />
              Ghi lỗi kỷ luật mới
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="dm-form-label">Sinh viên</label>
                <select
                  className="dm-form-select"
                  value={form.userID}
                  onChange={(e) => setForm((f) => ({ ...f, userID: e.target.value }))}
                >
                  <option value="">— Chọn sinh viên —</option>
                  {STUDENTS_FOR_SELECT.map((s) => (
                    <option key={s.userID} value={s.userID}>
                      {s.fullName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="dm-form-label">Loại vi phạm</label>
                <input
                  type="text"
                  className="dm-form-input"
                  placeholder="VD: Đi trễ sinh hoạt, Vi phạm nội quy..."
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
              </div>

              <div>
                <label className="dm-form-label">Mức độ</label>
                <select
                  className="dm-form-select"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                >
                  <option value="light">Nhẹ</option>
                  <option value="medium">Trung bình</option>
                  <option value="serious">Nghiêm trọng</option>
                </select>
              </div>

              <div>
                <label className="dm-form-label">Mô tả chi tiết</label>
                <textarea
                  className="dm-form-textarea"
                  placeholder="Ghi rõ lỗi vi phạm, thời gian, bối cảnh..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {formError && (
                <div className="dm-warning">{formError}</div>
              )}

              <div className="dm-modal-footer">
                <button type="button" className="dm-btn-cancel" onClick={closeModal}>
                  Huỷ
                </button>
                <button type="submit" className="dm-btn-submit">
                  Ghi nhận vi phạm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
