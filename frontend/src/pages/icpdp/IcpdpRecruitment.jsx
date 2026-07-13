import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, Bell, X, ChevronDown } from "lucide-react";
import recruitmentApi from "../../services/api/icpdp/recruitmentApi";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

const STATUS_CONFIG = {
  Open:   { label: "Đang mở",   color: "#059669", bg: "#ecfdf5" },
  Closed: { label: "Đã đóng",   color: "#6b7280", bg: "#f3f4f6" },
  Draft:  { label: "Nháp",      color: "#d97706", bg: "#fffbeb" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

const INIT_FORM = { title: "", startDate: "", status: "Open", questionsJson: "" };

export default function IcpdpRecruitment() {
  const toast = useToast();
  const confirm = useConfirm();
  const [cycles, setCycles]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reminding, setReminding]   = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await recruitmentApi.getAll();
      setCycles(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách đợt tuyển dụng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleCreate = async () => {
    if (!form.title.trim() || !form.startDate) {
      toast.error("Vui lòng điền tiêu đề và ngày bắt đầu.");
      return;
    }
    setSubmitting(true);
    try {
      await recruitmentApi.create({
        title: form.title.trim(),
        startDate: form.startDate,
        status: form.status,
        questionsJson: form.questionsJson || null,
      });
      setForm(INIT_FORM);
      setShowModal(false);
      toast.success("Đã tạo đợt tuyển dụng mới.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Tạo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cycle) => {
    if (!(await confirm(`Xóa đợt tuyển dụng "${cycle.title}"?`, { danger: true, confirmLabel: "Xóa" }))) return;
    try {
      await recruitmentApi.delete(cycle.cycleID);
      toast.success("Đã xóa đợt tuyển dụng.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Xóa thất bại.");
    }
  };

  const handleRemind = async (cycle) => {
    setReminding((p) => ({ ...p, [cycle.cycleID]: true }));
    try {
      await recruitmentApi.sendReminder(cycle.cycleID);
      toast.success(`Đã gửi nhắc cho đợt "${cycle.title}".`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Gửi nhắc thất bại.");
    } finally {
      setReminding((p) => ({ ...p, [cycle.cycleID]: false }));
    }
  };

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Tuyển Dụng</h1>
        <p className="page-subtitle">Tạo và quản lý các đợt tuyển thành viên CLB</p>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <button className="pr-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="dl-btn-add" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Tạo đợt mới
          </button>
        </div>

        {loading ? (
          <p className="text-center py-16 text-gray-400 text-sm">Đang tải...</p>
        ) : cycles.length === 0 ? (
          <p className="text-center py-16 text-gray-400 text-sm">Chưa có đợt tuyển dụng nào.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {cycles.map((c) => (
              <div key={c.cycleID} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "0.875rem 1.25rem", borderRadius: 12,
                border: "1.5px solid #f0f0f0", background: "#fff",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 4px" }}>{c.title}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                    Bắt đầu: {formatDate(c.startDate)}
                    {c.closedAt && ` · Đóng: ${formatDate(c.closedAt)}`}
                  </p>
                </div>
                <StatusBadge status={c.status} />
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    title="Gửi nhắc"
                    onClick={() => handleRemind(c)}
                    disabled={reminding[c.cycleID]}
                    style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                  >
                    <Bell size={13} /> {reminding[c.cycleID] ? "..." : "Nhắc"}
                  </button>
                  <button
                    title="Xóa"
                    onClick={() => handleDelete(c)}
                    style={{ background: "none", border: "1.5px solid #fee2e2", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#ef4444" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="dl-overlay" onClick={() => setShowModal(false)}>
          <div className="dl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dl-modal-header">
              <div className="dl-modal-title-row">
                <Plus size={18} className="dl-modal-icon" />
                <h3 className="dl-modal-title">Tạo đợt tuyển dụng mới</h3>
              </div>
              <button className="dl-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <div className="dl-modal-body">
              <div className="dl-form-field" style={{ marginBottom: "1rem" }}>
                <label className="pr-label">Tiêu đề <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="pr-select" style={{ padding: "9px 12px" }} placeholder="VD: Tuyển thành viên HK1 2026" value={form.title} onChange={set("title")} />
              </div>

              <div className="dl-form-row">
                <div className="dl-form-field">
                  <label className="pr-label">Ngày bắt đầu <span style={{ color: "#ef4444" }}>*</span></label>
                  <input className="pr-select" style={{ padding: "9px 12px" }} type="date" value={form.startDate} onChange={set("startDate")} />
                </div>
                <div className="dl-form-field">
                  <label className="pr-label">Trạng thái</label>
                  <div className="pr-select-wrap">
                    <select className="pr-select" value={form.status} onChange={set("status")}>
                      <option value="Open">Đang mở</option>
                      <option value="Draft">Nháp</option>
                      <option value="Closed">Đã đóng</option>
                    </select>
                    <ChevronDown size={14} className="pr-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="dl-form-field">
                <label className="pr-label">Câu hỏi (JSON, tùy chọn)</label>
                <textarea className="pr-textarea" rows={3} placeholder='{"q1":"Tại sao bạn muốn tham gia?"}' value={form.questionsJson} onChange={set("questionsJson")} />
              </div>
            </div>

            <div className="dl-modal-footer">
              <button className="pr-btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>Hủy</button>
              <button className="pr-btn-primary" style={{ width: "auto" }} onClick={handleCreate} disabled={submitting}>
                {submitting ? "Đang tạo..." : "Tạo đợt tuyển dụng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
