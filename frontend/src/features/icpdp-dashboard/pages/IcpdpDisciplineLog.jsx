import { useState, useMemo } from "react";
import {
  ShieldAlert, Plus, Search, ChevronDown, X,
  AlertTriangle, AlertOctagon, Ban, Clock, CheckCircle2,
  FileText, User,
} from "lucide-react";
import "../../../assets/css/icpdpEventApproval.css";
import "../../../assets/css/icpdpClubOverview.css";
import "../../../assets/css/icpdpPersonnelReassign.css";
import "../../../assets/css/icpdpDisciplineLog.css";

/* ── Mock data ───────────────────────────────────────────── */
const MOCK_LOGS = [
  {
    id: 1,
    studentId: "SE171234",
    name: "Nguyễn Văn An",
    club: "FPTU IT Club",
    role: "Trưởng CLB",
    type: "dismiss",
    severity: "high",
    description: "Gian lận trong bài kiểm tra học kỳ, bị nhà trường đình chỉ 1 học kỳ.",
    date: "02/06/2026",
    recordedBy: "IC-PDP",
    status: "active",
  },
  {
    id: 2,
    studentId: "DE191002",
    name: "Tống Minh Sơn",
    club: "FPTU Dance Club",
    role: "Phó Trưởng CLB",
    type: "warning",
    severity: "medium",
    description: "Vắng mặt 3 buổi sinh hoạt CLB liên tiếp mà không có lý do chính đáng.",
    date: "20/05/2026",
    recordedBy: "IC-PDP",
    status: "resolved",
  },
  {
    id: 3,
    studentId: "IB181003",
    name: "Đinh Quốc Minh",
    club: "FPTU English Club",
    role: "Thành viên",
    type: "discipline",
    severity: "high",
    description: "Sử dụng ngôn ngữ không phù hợp trong sự kiện chính thức của CLB, gây ảnh hưởng đến hình ảnh.",
    date: "10/05/2026",
    recordedBy: "IC-PDP",
    status: "active",
  },
  {
    id: 4,
    studentId: "MU201004",
    name: "Kiều Văn Yên",
    club: "FPTU Music Club",
    role: "Thành viên",
    type: "warning",
    severity: "low",
    description: "Nộp báo cáo sự kiện trễ hạn 2 lần trong học kỳ.",
    date: "01/05/2026",
    recordedBy: "IC-PDP",
    status: "resolved",
  },
  {
    id: 5,
    studentId: "SE172003",
    name: "Vũ Minh Đức",
    club: "FPTU IT Club",
    role: "Thành viên",
    type: "discipline",
    severity: "medium",
    description: "Thu phí thành viên trái phép, không minh bạch tài chính trong ban tổ chức sự kiện.",
    date: "15/04/2026",
    recordedBy: "IC-PDP",
    status: "active",
  },
];

const CLUBS = [
  "FPTU IT Club", "FPTU English Club", "FPTU Dance Club",
  "FPTU Music Club", "FPTU Chess Club", "FPTU Volunteer",
];

const TYPE_CONFIG = {
  warning:    { label: "Nhắc nhở",  icon: AlertTriangle,  color: "yellow" },
  discipline: { label: "Kỷ luật",   icon: AlertOctagon,   color: "orange" },
  dismiss:    { label: "Cách chức", icon: Ban,             color: "red"    },
};

const SEVERITY_CONFIG = {
  low:    { label: "Nhẹ",    color: "sev-low"    },
  medium: { label: "Trung bình", color: "sev-medium" },
  high:   { label: "Nặng",   color: "sev-high"   },
};

const TABS = [
  { key: "all",      label: "Tất cả" },
  { key: "active",   label: "Đang xử lý" },
  { key: "resolved", label: "Đã giải quyết" },
];

const INIT_FORM = {
  studentId: "", name: "", club: "", role: "member",
  type: "warning", severity: "medium", description: "",
};

export default function IcpdpDisciplineLog() {
  const [logs, setLogs]       = useState(MOCK_LOGS);
  const [activeTab, setTab]   = useState("all");
  const [search, setSearch]   = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showModal, setShowModal]   = useState(false);
  const [detail, setDetail]         = useState(null);
  const [form, setForm]             = useState(INIT_FORM);
  const [toast, setToast]           = useState(null);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleAdd = () => {
    if (!form.studentId.trim() || !form.name.trim() || !form.club || !form.description.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }
    setLogs((prev) => [
      {
        id: prev.length + 1,
        ...form,
        date: new Date().toLocaleDateString("vi-VN"),
        recordedBy: "IC-PDP",
        status: "active",
      },
      ...prev,
    ]);
    setForm(INIT_FORM);
    setShowModal(false);
    showToast("Đã ghi nhận vi phạm vào nhật ký.");
  };

  const resolve = (id) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "resolved" } : l))
    );
    setDetail(null);
    showToast("Đã đánh dấu vi phạm là Đã giải quyết.");
  };

  const filtered = useMemo(() => {
    let list = logs;
    if (activeTab !== "all")    list = list.filter((l) => l.status === activeTab);
    if (filterType !== "all")   list = list.filter((l) => l.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.studentId.toLowerCase().includes(q) ||
          l.club.toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, activeTab, filterType, search]);

  const tabCount = (key) => {
    if (key === "all")      return logs.length;
    return logs.filter((l) => l.status === key).length;
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Nhật Ký Kỷ Luật</h1>
        <p className="page-subtitle">
          Ghi nhận và tra cứu lịch sử vi phạm của sinh viên trong hệ thống CLB
        </p>
      </div>

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* ── Summary stats ────────────────────────────────────── */}
      <div className="dl-stats-row">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
          const count = logs.filter((l) => l.type === key).length;
          const Icon  = cfg.icon;
          return (
            <div key={key} className={`dl-stat-card dl-stat-${cfg.color}`}>
              <Icon size={22} />
              <div>
                <p className="dl-stat-label">{cfg.label}</p>
                <p className="dl-stat-value">{count}</p>
              </div>
            </div>
          );
        })}
        <div className="dl-stat-card dl-stat-gray">
          <CheckCircle2 size={22} />
          <div>
            <p className="dl-stat-label">Đã giải quyết</p>
            <p className="dl-stat-value">{logs.filter((l) => l.status === "resolved").length}</p>
          </div>
        </div>
      </div>

      {/* ── Main card ────────────────────────────────────────── */}
      <div className="content-card">
        {/* Toolbar */}
        <div className="dl-toolbar">
          <div className="dl-toolbar-left">
            <div className="co-search-wrap">
              <Search size={15} className="co-search-icon" />
              <input
                className="co-search-input"
                placeholder="Tìm tên, MSSV, CLB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="dl-filter-wrap">
              <select
                className="dl-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="dl-filter-arrow" />
            </div>
          </div>

          <button className="dl-btn-add" onClick={() => setShowModal(true)}>
            <Plus size={15} />
            Ghi nhận vi phạm
          </button>
        </div>

        {/* Tabs */}
        <div className="approval-tabs">
          {TABS.map((tab) => {
            const count = tabCount(tab.key);
            return (
              <button
                key={tab.key}
                className={`approval-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setTab(tab.key)}
              >
                {tab.label}
                {count > 0 && <span className="approval-tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Log list */}
        {filtered.length === 0 ? (
          <p className="approval-empty">Không có vi phạm nào phù hợp.</p>
        ) : (
          <div className="dl-log-list">
            {filtered.map((log) => {
              const typeCfg = TYPE_CONFIG[log.type];
              const sevCfg  = SEVERITY_CONFIG[log.severity];
              const Icon    = typeCfg.icon;

              return (
                <div
                  key={log.id}
                  className={`dl-log-item dl-log-${typeCfg.color}`}
                  onClick={() => setDetail(log)}
                >
                  <div className={`dl-log-type-icon dl-icon-${typeCfg.color}`}>
                    <Icon size={18} />
                  </div>

                  <div className="dl-log-body">
                    <div className="dl-log-top">
                      <div className="dl-log-person">
                        <span className="dl-log-name">{log.name}</span>
                        <span className="dl-log-student-id">{log.studentId}</span>
                      </div>
                      <div className="dl-log-badges">
                        <span className={`dl-badge dl-badge-type dl-badge-${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <span className={`dl-badge ${sevCfg.color}`}>
                          {sevCfg.label}
                        </span>
                        {log.status === "resolved" && (
                          <span className="dl-badge dl-badge-resolved">Đã giải quyết</span>
                        )}
                      </div>
                    </div>

                    <p className="dl-log-desc">{log.description}</p>

                    <div className="dl-log-meta">
                      <span>{log.club} — {log.role}</span>
                      <span className="dl-log-date">
                        <Clock size={11} /> {log.date}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="dl-overlay" onClick={() => setShowModal(false)}>
          <div className="dl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dl-modal-header">
              <div className="dl-modal-title-row">
                <ShieldAlert size={18} className="dl-modal-icon" />
                <h3 className="dl-modal-title">Ghi nhận vi phạm mới</h3>
              </div>
              <button className="dl-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="dl-modal-body">
              <div className="dl-form-row">
                <div className="dl-form-field">
                  <label className="pr-label">Mã số sinh viên</label>
                  <input className="pr-select" style={{ padding: "9px 12px" }}
                    placeholder="VD: SE171234"
                    value={form.studentId}
                    onChange={set("studentId")}
                  />
                </div>
                <div className="dl-form-field">
                  <label className="pr-label">Họ và tên</label>
                  <input className="pr-select" style={{ padding: "9px 12px" }}
                    placeholder="Họ và tên sinh viên"
                    value={form.name}
                    onChange={set("name")}
                  />
                </div>
              </div>

              <div className="dl-form-row">
                <div className="dl-form-field">
                  <label className="pr-label">Câu lạc bộ</label>
                  <div className="pr-select-wrap">
                    <select className="pr-select" value={form.club} onChange={set("club")}>
                      <option value="">-- Chọn CLB --</option>
                      {CLUBS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="pr-select-arrow" />
                  </div>
                </div>
                <div className="dl-form-field">
                  <label className="pr-label">Chức vụ</label>
                  <div className="pr-select-wrap">
                    <select className="pr-select" value={form.role} onChange={set("role")}>
                      <option value="Trưởng CLB">Trưởng CLB</option>
                      <option value="Phó Trưởng CLB">Phó Trưởng CLB</option>
                      <option value="Ban điều hành">Ban điều hành</option>
                      <option value="Thành viên">Thành viên</option>
                    </select>
                    <ChevronDown size={14} className="pr-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="dl-form-row">
                <div className="dl-form-field">
                  <label className="pr-label">Loại vi phạm</label>
                  <div className="pr-select-wrap">
                    <select className="pr-select" value={form.type} onChange={set("type")}>
                      {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pr-select-arrow" />
                  </div>
                </div>
                <div className="dl-form-field">
                  <label className="pr-label">Mức độ nghiêm trọng</label>
                  <div className="pr-select-wrap">
                    <select className="pr-select" value={form.severity} onChange={set("severity")}>
                      {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pr-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="dl-form-field">
                <label className="pr-label">Mô tả vi phạm</label>
                <textarea
                  className="pr-textarea"
                  rows={4}
                  placeholder="Mô tả chi tiết hành vi vi phạm và bằng chứng liên quan..."
                  value={form.description}
                  onChange={set("description")}
                />
              </div>
            </div>

            <div className="dl-modal-footer">
              <button className="pr-btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="pr-btn-primary" style={{ width: "auto" }} onClick={handleAdd}>
                <FileText size={15} />
                Lưu vào nhật ký
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail drawer ─────────────────────────────────────── */}
      {detail && (
        <div className="dl-overlay" onClick={() => setDetail(null)}>
          <div className="dl-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="dl-drawer-header">
              <h3 className="dl-drawer-title">Chi tiết vi phạm</h3>
              <button className="dl-modal-close" onClick={() => setDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="dl-drawer-body">
              <div className="dl-drawer-person">
                <div className="pr-avatar pr-avatar-red">
                  {detail.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                </div>
                <div>
                  <div className="pr-person-name">{detail.name}</div>
                  <div className="pr-person-id">{detail.studentId}</div>
                </div>
              </div>

              <div className="dl-drawer-meta">
                {[
                  ["CLB",          detail.club],
                  ["Chức vụ",      detail.role],
                  ["Loại vi phạm", TYPE_CONFIG[detail.type].label],
                  ["Mức độ",       SEVERITY_CONFIG[detail.severity].label],
                  ["Ngày ghi",     detail.date],
                  ["Ghi bởi",      detail.recordedBy],
                  ["Trạng thái",   detail.status === "active" ? "Đang xử lý" : "Đã giải quyết"],
                ].map(([key, val]) => (
                  <div key={key} className="pr-meta-item">
                    <span className="pr-meta-key">{key}</span>
                    <span className="pr-meta-val">{val}</span>
                  </div>
                ))}
              </div>

              <div className="dl-drawer-desc">
                <p className="pr-label">Mô tả vi phạm</p>
                <p className="dl-drawer-desc-text">{detail.description}</p>
              </div>
            </div>

            {detail.status === "active" && (
              <div className="dl-drawer-footer">
                <button
                  className="pr-btn-primary"
                  onClick={() => resolve(detail.id)}
                >
                  <CheckCircle2 size={15} />
                  Đánh dấu đã giải quyết
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
