import { useState } from "react";
import {
  AlertOctagon, ChevronDown, UserCheck, ArrowRightLeft,
  CheckCircle, Clock, XCircle, Search,
} from "lucide-react";
import "../../../assets/css/icpdpEventApproval.css";
import "../../../assets/css/icpdpClubOverview.css";
import "../../../assets/css/icpdpPersonnelReassign.css";

/* ── Mock data ───────────────────────────────────────────── */
const MOCK_CLUBS = [
  {
    id: 1,
    name: "FPTU IT Club",
    leader:      { id: 101, name: "Nguyễn Văn An",   studentId: "SE171234", avatar: "NA" },
    viceLeader:  { id: 102, name: "Trần Thị Bảo",    studentId: "SE171456", avatar: "TB" },
    members: [
      { id: 103, name: "Lê Hoàng Cường",  studentId: "SE172001", role: "member" },
      { id: 104, name: "Phạm Thị Diệu",   studentId: "SE172002", role: "member" },
      { id: 105, name: "Vũ Minh Đức",     studentId: "SE172003", role: "member" },
      { id: 106, name: "Hoàng Thị Giang", studentId: "SE172004", role: "member" },
    ],
  },
  {
    id: 2,
    name: "FPTU English Club",
    leader:     { id: 201, name: "Bùi Văn Hải",    studentId: "IB181001", avatar: "BH" },
    viceLeader: { id: 202, name: "Cao Thị Lan",    studentId: "IB181002", avatar: "CL" },
    members: [
      { id: 203, name: "Đinh Quốc Minh",  studentId: "IB181003", role: "member" },
      { id: 204, name: "Đỗ Thị Nga",      studentId: "IB181004", role: "member" },
      { id: 205, name: "Lý Văn Phong",    studentId: "IB181005", role: "member" },
    ],
  },
  {
    id: 3,
    name: "FPTU Dance Club",
    leader:     { id: 301, name: "Phan Thị Quỳnh", studentId: "DE191001", avatar: "PQ" },
    viceLeader: { id: 302, name: "Tống Minh Sơn",  studentId: "DE191002", avatar: "TS" },
    members: [
      { id: 303, name: "Trương Thị Tâm",  studentId: "DE191003", role: "member" },
      { id: 304, name: "Ngô Văn Toàn",    studentId: "DE191004", role: "member" },
    ],
  },
  {
    id: 4,
    name: "FPTU Music Club",
    leader:     { id: 401, name: "Vương Thị Uyên", studentId: "MU201001", avatar: "VU" },
    viceLeader: { id: 402, name: "Dương Văn Vinh", studentId: "MU201002", avatar: "DV" },
    members: [
      { id: 403, name: "Hà Thị Xuân",     studentId: "MU201003", role: "member" },
      { id: 404, name: "Kiều Văn Yên",    studentId: "MU201004", role: "member" },
      { id: 405, name: "Mai Thị Zung",    studentId: "MU201005", role: "member" },
    ],
  },
];

const DISCIPLINE_LEVELS = [
  { value: "warning",    label: "Nhắc nhở" },
  { value: "discipline", label: "Kỷ luật" },
  { value: "dismiss",    label: "Cách chức" },
];

const HISTORY_INITIAL = [
  {
    id: 1,
    date: "02/06/2026",
    club: "FPTU IT Club",
    action: "replace_leader",
    from: "Trương Văn Tuấn",
    to: "Nguyễn Văn An",
    reason: "Sinh viên Trương Văn Tuấn bị đình chỉ học tập 1 học kỳ do gian lận thi cử.",
    by: "IC-PDP",
    status: "completed",
  },
  {
    id: 2,
    date: "15/04/2026",
    club: "FPTU Dance Club",
    action: "replace_vice",
    from: "Lê Thị Minh",
    to: "Tống Minh Sơn",
    reason: "Phó trưởng CLB vi phạm nội quy hành vi sinh viên FPTU.",
    by: "IC-PDP",
    status: "completed",
  },
];

const INITIAL_FORM = {
  clubId:   "",
  position: "leader",
  reason:   "",
  level:    "dismiss",
  newPersonId: "",
};

export default function IcpdpPersonnelReassign() {
  const [clubs]       = useState(MOCK_CLUBS);
  const [history, setHistory] = useState(HISTORY_INITIAL);
  const [form, setForm]       = useState(INITIAL_FORM);
  const [step, setStep]       = useState(1); // 1 = chọn CLB, 2 = xác nhận, 3 = done
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState(null);

  const selectedClub = clubs.find((c) => c.id === Number(form.clubId));
  const currentHolder = selectedClub
    ? form.position === "leader"
      ? selectedClub.leader
      : selectedClub.viceLeader
    : null;
  const candidates = selectedClub
    ? [
        ...(form.position === "leader" ? [selectedClub.viceLeader] : [selectedClub.leader]),
        ...selectedClub.members,
      ]
    : [];

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value, ...(field === "clubId" ? { newPersonId: "" } : {}) }));

  const canProceed =
    form.clubId && form.newPersonId && form.reason.trim().length >= 10;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleConfirm = () => {
    const newPerson = candidates.find((c) => c.id === Number(form.newPersonId));
    const posLabel  = form.position === "leader" ? "Trưởng CLB" : "Phó Trưởng CLB";
    setHistory((prev) => [
      {
        id: prev.length + 1,
        date: new Date().toLocaleDateString("vi-VN"),
        club: selectedClub.name,
        action: form.position === "leader" ? "replace_leader" : "replace_vice",
        from: currentHolder.name,
        to: newPerson?.name ?? "—",
        reason: form.reason,
        by: "IC-PDP",
        status: "completed",
      },
      ...prev,
    ]);
    setStep(3);
    showToast(`Đã điều động ${posLabel} ${selectedClub.name} thành công.`);
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(1);
  };

  const filteredHistory = history.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      h.club.toLowerCase().includes(q) ||
      h.from.toLowerCase().includes(q) ||
      h.to.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Điều Động Nhân Sự Khẩn Cấp</h1>
        <p className="page-subtitle">
          Can thiệp thủ công thay thế Trưởng / Phó Trưởng CLB giữa kỳ do kỷ luật
        </p>
      </div>

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* ── Main grid: form + history ────────────────────────── */}
      <div className="pr-grid">
        {/* LEFT — Intervention form */}
        <div className="content-card pr-form-card">
          <div className="pr-form-header">
            <AlertOctagon size={18} className="pr-form-header-icon" />
            <h2 className="content-card-title" style={{ margin: 0 }}>
              Can Thiệp Điều Động
            </h2>
          </div>

          {/* Step indicator */}
          <div className="pr-steps">
            {["Thông tin", "Xác nhận", "Hoàn tất"].map((label, i) => (
              <div
                key={label}
                className={`pr-step ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""}`}
              >
                <div className="pr-step-circle">
                  {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="pr-step-label">{label}</span>
                {i < 2 && <div className="pr-step-line" />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Select ─────────────────────────────── */}
          {step === 1 && (
            <div className="pr-step-body">
              <div className="pr-field">
                <label className="pr-label">Câu lạc bộ</label>
                <div className="pr-select-wrap">
                  <select className="pr-select" value={form.clubId} onChange={set("clubId")}>
                    <option value="">-- Chọn CLB --</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pr-select-arrow" />
                </div>
              </div>

              <div className="pr-field">
                <label className="pr-label">Vị trí cần thay thế</label>
                <div className="pr-radio-group">
                  <label className={`pr-radio-item ${form.position === "leader" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="position"
                      value="leader"
                      checked={form.position === "leader"}
                      onChange={set("position")}
                    />
                    Trưởng CLB
                  </label>
                  <label className={`pr-radio-item ${form.position === "vice" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="position"
                      value="vice"
                      checked={form.position === "vice"}
                      onChange={set("position")}
                    />
                    Phó Trưởng CLB
                  </label>
                </div>
              </div>

              {selectedClub && currentHolder && (
                <div className="pr-current-holder">
                  <p className="pr-field-hint">Người đang giữ chức vụ:</p>
                  <div className="pr-person-chip">
                    <div className="pr-avatar pr-avatar-red">
                      {currentHolder.avatar}
                    </div>
                    <div>
                      <div className="pr-person-name">{currentHolder.name}</div>
                      <div className="pr-person-id">{currentHolder.studentId}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pr-field">
                <label className="pr-label">Mức độ vi phạm</label>
                <div className="pr-select-wrap">
                  <select className="pr-select" value={form.level} onChange={set("level")}>
                    {DISCIPLINE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pr-select-arrow" />
                </div>
              </div>

              {selectedClub && (
                <div className="pr-field">
                  <label className="pr-label">Người thay thế</label>
                  <div className="pr-select-wrap">
                    <select
                      className="pr-select"
                      value={form.newPersonId}
                      onChange={set("newPersonId")}
                    >
                      <option value="">-- Chọn thành viên --</option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.studentId}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pr-select-arrow" />
                  </div>
                </div>
              )}

              <div className="pr-field">
                <label className="pr-label">
                  Lý do điều động
                  <span className="pr-label-hint"> (tối thiểu 10 ký tự)</span>
                </label>
                <textarea
                  className="pr-textarea"
                  placeholder="Mô tả vi phạm và lý do điều động khẩn cấp..."
                  value={form.reason}
                  onChange={set("reason")}
                  rows={4}
                />
                <span className="pr-char-count">{form.reason.length} ký tự</span>
              </div>

              <button
                className="pr-btn-primary"
                disabled={!canProceed}
                onClick={() => setStep(2)}
              >
                <ArrowRightLeft size={15} />
                Tiếp tục xác nhận
              </button>
            </div>
          )}

          {/* ── Step 2: Confirm ────────────────────────────── */}
          {step === 2 && selectedClub && currentHolder && (
            <div className="pr-step-body">
              <div className="pr-confirm-banner">
                <AlertOctagon size={20} className="pr-confirm-icon" />
                <p>
                  Hành động này sẽ <strong>lập tức có hiệu lực</strong> và được ghi nhận
                  vào nhật ký điều động. Vui lòng kiểm tra kỹ trước khi xác nhận.
                </p>
              </div>

              <div className="pr-confirm-row">
                <div className="pr-confirm-side">
                  <p className="pr-confirm-label">Bị thay thế</p>
                  <div className="pr-person-chip">
                    <div className="pr-avatar pr-avatar-red">{currentHolder.avatar}</div>
                    <div>
                      <div className="pr-person-name">{currentHolder.name}</div>
                      <div className="pr-person-id">{currentHolder.studentId}</div>
                    </div>
                  </div>
                </div>

                <ArrowRightLeft size={20} className="pr-arrow-between" />

                <div className="pr-confirm-side">
                  <p className="pr-confirm-label">Người thay thế</p>
                  {(() => {
                    const p = candidates.find((c) => c.id === Number(form.newPersonId));
                    return p ? (
                      <div className="pr-person-chip">
                        <div className="pr-avatar pr-avatar-green">
                          {p.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                        </div>
                        <div>
                          <div className="pr-person-name">{p.name}</div>
                          <div className="pr-person-id">{p.studentId}</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="pr-confirm-meta">
                <div className="pr-meta-item">
                  <span className="pr-meta-key">CLB</span>
                  <span className="pr-meta-val">{selectedClub.name}</span>
                </div>
                <div className="pr-meta-item">
                  <span className="pr-meta-key">Vị trí</span>
                  <span className="pr-meta-val">
                    {form.position === "leader" ? "Trưởng CLB" : "Phó Trưởng CLB"}
                  </span>
                </div>
                <div className="pr-meta-item">
                  <span className="pr-meta-key">Mức vi phạm</span>
                  <span className="pr-meta-val">
                    {DISCIPLINE_LEVELS.find((l) => l.value === form.level)?.label}
                  </span>
                </div>
                <div className="pr-meta-item">
                  <span className="pr-meta-key">Lý do</span>
                  <span className="pr-meta-val">{form.reason}</span>
                </div>
              </div>

              <div className="pr-confirm-actions">
                <button className="pr-btn-ghost" onClick={() => setStep(1)}>
                  Quay lại
                </button>
                <button className="pr-btn-danger" onClick={handleConfirm}>
                  <CheckCircle size={15} />
                  Xác nhận điều động
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ───────────────────────────────── */}
          {step === 3 && (
            <div className="pr-step-body pr-done-body">
              <CheckCircle size={52} className="pr-done-icon" />
              <h3 className="pr-done-title">Điều động thành công!</h3>
              <p className="pr-done-desc">
                Lệnh điều động đã được ghi nhận và sẽ được thông báo đến các bên liên quan.
              </p>
              <button className="pr-btn-primary" onClick={reset}>
                Tạo lệnh điều động mới
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — History */}
        <div className="content-card pr-history-card">
          <div className="pr-history-header">
            <h2 className="content-card-title" style={{ margin: 0 }}>
              Lịch Sử Điều Động
            </h2>
            <div className="co-search-wrap">
              <Search size={14} className="co-search-icon" />
              <input
                className="co-search-input"
                style={{ width: 180 }}
                placeholder="Tìm CLB, tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <p className="approval-empty">Không tìm thấy kết quả.</p>
          ) : (
            <div className="pr-history-list">
              {filteredHistory.map((h) => (
                <div key={h.id} className="pr-history-item">
                  <div className="pr-history-top">
                    <span className="pr-history-club">{h.club}</span>
                    <span className="pr-history-date">{h.date}</span>
                  </div>

                  <div className="pr-history-transfer">
                    <span className="pr-history-from">{h.from}</span>
                    <ArrowRightLeft size={12} className="pr-history-arrow" />
                    <span className="pr-history-to">{h.to}</span>
                  </div>

                  <p className="pr-history-reason">{h.reason}</p>

                  <div className="pr-history-footer">
                    <span className="pr-history-action-tag">
                      {h.action === "replace_leader" ? "Thay trưởng CLB" : "Thay phó trưởng CLB"}
                    </span>
                    <span className="pr-history-status">
                      <CheckCircle size={11} /> Hoàn tất
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
