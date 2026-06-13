import { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert, Plus, Search, ChevronDown, X,
  CheckCircle2, FileText, Clock, RefreshCw,
} from "lucide-react";
import "../../../assets/css/icpdpEventApproval.css";
import "../../../assets/css/icpdpClubOverview.css";
import "../../../assets/css/icpdpPersonnelReassign.css";
import "../../../assets/css/icpdpDisciplineLog.css";
import disciplineLogApi from "../api/disciplineLogApi";

const STATUS_CONFIG = {
  Active:   { label: "Đang xử lý",    color: "orange" },
  Resolved: { label: "Đã giải quyết", color: "green"  },
};

const TABS = [
  { key: "all",      label: "Tất cả" },
  { key: "Active",   label: "Đang xử lý" },
  { key: "Resolved", label: "Đã giải quyết" },
];

const INIT_FORM = { userID: "", semesterID: "", reason: "" };

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function IcpdpDisciplineLog() {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setTab]         = useState("all");
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [detail, setDetail]         = useState(null);
  const [form, setForm]             = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await disciplineLogApi.getAll();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      showToast("Không thể tải dữ liệu nhật ký.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAdd = async () => {
    if (!form.userID || !form.semesterID || !form.reason.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await disciplineLogApi.create({
        userID: parseInt(form.userID, 10),
        semesterID: parseInt(form.semesterID, 10),
        reason: form.reason.trim(),
        disciplineStatus: "Active",
      });
      setForm(INIT_FORM);
      setShowModal(false);
      showToast("Đã ghi nhận vi phạm vào nhật ký.");
      loadLogs();
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Ghi nhận thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async (log) => {
    try {
      await disciplineLogApi.update(log.disciplineID, {
        userID: log.userID,
        semesterID: log.semesterID,
        reason: log.reason,
        disciplineStatus: "Resolved",
      });
      setDetail(null);
      showToast("Đã đánh dấu vi phạm là Đã giải quyết.");
      loadLogs();
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Cập nhật thất bại.", "error");
    }
  };

  const filtered = useMemo(() => {
    let list = logs;
    if (activeTab !== "all") list = list.filter((l) => l.disciplineStatus === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          String(l.userID).includes(q) ||
          l.reason?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, activeTab, search]);

  const tabCount = (key) => {
    if (key === "all") return logs.length;
    return logs.filter((l) => l.disciplineStatus === key).length;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Nhật Ký Kỷ Luật</h1>
        <p className="page-subtitle">
          Ghi nhận và tra cứu lịch sử vi phạm của sinh viên trong hệ thống CLB
        </p>
      </div>

      {toast && <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>}

      {/* Summary stats */}
      <div className="dl-stats-row">
        <div className="dl-stat-card dl-stat-orange">
          <ShieldAlert size={22} />
          <div>
            <p className="dl-stat-label">Đang xử lý</p>
            <p className="dl-stat-value">{logs.filter((l) => l.disciplineStatus === "Active").length}</p>
          </div>
        </div>
        <div className="dl-stat-card dl-stat-green">
          <CheckCircle2 size={22} />
          <div>
            <p className="dl-stat-label">Đã giải quyết</p>
            <p className="dl-stat-value">{logs.filter((l) => l.disciplineStatus === "Resolved").length}</p>
          </div>
        </div>
        <div className="dl-stat-card dl-stat-gray">
          <FileText size={22} />
          <div>
            <p className="dl-stat-label">Tổng cộng</p>
            <p className="dl-stat-value">{logs.length}</p>
          </div>
        </div>
      </div>

      <div className="content-card">
        {/* Toolbar */}
        <div className="dl-toolbar">
          <div className="dl-toolbar-left">
            <div className="co-search-wrap">
              <Search size={15} className="co-search-icon" />
              <input
                className="co-search-input"
                placeholder="Tìm User ID, lý do..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="pr-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={loadLogs}>
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
          <button className="dl-btn-add" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Ghi nhận vi phạm
          </button>
        </div>

        {/* Tabs */}
        <div className="approval-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`approval-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setTab(tab.key)}
            >
              {tab.label}
              {tabCount(tab.key) > 0 && (
                <span className="approval-tab-badge">{tabCount(tab.key)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Log list */}
        {loading ? (
          <p className="approval-empty">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="approval-empty">Không có vi phạm nào phù hợp.</p>
        ) : (
          <div className="dl-log-list">
            {filtered.map((log) => {
              const statusCfg = STATUS_CONFIG[log.disciplineStatus] ?? STATUS_CONFIG.Active;
              return (
                <div
                  key={log.disciplineID}
                  className={`dl-log-item dl-log-${statusCfg.color}`}
                  onClick={() => setDetail(log)}
                >
                  <div className={`dl-log-type-icon dl-icon-${statusCfg.color}`}>
                    <ShieldAlert size={18} />
                  </div>
                  <div className="dl-log-body">
                    <div className="dl-log-top">
                      <div className="dl-log-person">
                        <span className="dl-log-name">User #{log.userID}</span>
                        <span className="dl-log-student-id">Học kỳ #{log.semesterID}</span>
                      </div>
                      <div className="dl-log-badges">
                        <span className={`dl-badge dl-badge-type dl-badge-${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <p className="dl-log-desc">{log.reason}</p>
                    <div className="dl-log-meta">
                      <span className="dl-log-date">
                        <Clock size={11} /> {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add modal */}
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
                  <label className="pr-label">User ID <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    className="pr-select" style={{ padding: "9px 12px" }}
                    type="number" placeholder="VD: 42"
                    value={form.userID} onChange={set("userID")}
                  />
                </div>
                <div className="dl-form-field">
                  <label className="pr-label">Học kỳ ID <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    className="pr-select" style={{ padding: "9px 12px" }}
                    type="number" placeholder="VD: 1"
                    value={form.semesterID} onChange={set("semesterID")}
                  />
                </div>
              </div>

              <div className="dl-form-field">
                <label className="pr-label">Lý do vi phạm <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea
                  className="pr-textarea" rows={4}
                  placeholder="Mô tả chi tiết hành vi vi phạm..."
                  value={form.reason} onChange={set("reason")}
                />
              </div>
            </div>

            <div className="dl-modal-footer">
              <button className="pr-btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>Hủy</button>
              <button className="pr-btn-primary" style={{ width: "auto" }} onClick={handleAdd} disabled={submitting}>
                <FileText size={15} />
                {submitting ? "Đang lưu..." : "Lưu vào nhật ký"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
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
              <div className="dl-drawer-meta">
                {[
                  ["Mã vi phạm",  `#${detail.disciplineID}`],
                  ["User ID",     `#${detail.userID}`],
                  ["Học kỳ ID",   `#${detail.semesterID}`],
                  ["Trạng thái",  STATUS_CONFIG[detail.disciplineStatus]?.label ?? detail.disciplineStatus],
                  ["Ngày tạo",    formatDate(detail.createdAt)],
                ].map(([key, val]) => (
                  <div key={key} className="pr-meta-item">
                    <span className="pr-meta-key">{key}</span>
                    <span className="pr-meta-val">{val}</span>
                  </div>
                ))}
              </div>

              <div className="dl-drawer-desc">
                <p className="pr-label">Lý do vi phạm</p>
                <p className="dl-drawer-desc-text">{detail.reason}</p>
              </div>
            </div>

            {detail.disciplineStatus === "Active" && (
              <div className="dl-drawer-footer">
                <button className="pr-btn-primary" onClick={() => resolve(detail)}>
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
