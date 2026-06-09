import { useState, useEffect } from "react";
import { Ban, Plus, Trash2, RefreshCw, X } from "lucide-react";
import blacklistApi from "../api/blacklistApi";
import "../../../assets/css/icpdpEventApproval.css";
import "../../../assets/css/icpdpClubOverview.css";

const INIT_FORM = { userID: "", reason: "" };

export default function IcpdpBlacklist() {
  const [clubID, setClubID]         = useState("");
  const [list, setList]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const load = async (id) => {
    const cid = id ?? clubID;
    if (!cid) return;
    setLoading(true);
    try {
      const data = await blacklistApi.getAll(cid);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Không thể tải danh sách blacklist.", "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAdd = async () => {
    if (!form.userID || !form.reason.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await blacklistApi.add(clubID, { userID: parseInt(form.userID, 10), reason: form.reason.trim() });
      setForm(INIT_FORM);
      setShowModal(false);
      showToast("Đã thêm vào danh sách đen.");
      load();
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Thêm thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (item) => {
    if (!window.confirm(`Xóa User #${item.userID} khỏi blacklist?`)) return;
    try {
      await blacklistApi.remove(clubID, item.blacklistID ?? item.id);
      showToast("Đã xóa khỏi danh sách đen.");
      load();
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Xóa thất bại.", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Danh Sách Đen CLB</h1>
        <p className="page-subtitle">Quản lý sinh viên bị cấm tham gia câu lạc bộ</p>
      </div>

      {toast && <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>}

      {/* Club ID selector */}
      <div className="content-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="number"
            placeholder="Nhập Club ID..."
            value={clubID}
            onChange={(e) => setClubID(e.target.value)}
            style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, width: 180 }}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <button
            className="pr-btn-primary" style={{ width: "auto" }}
            onClick={() => load()} disabled={!clubID || loading}
          >
            Xem blacklist
          </button>
        </div>
      </div>

      {clubID && (
        <div className="content-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <button className="pr-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={() => load()} disabled={loading}>
              <RefreshCw size={14} /> Làm mới
            </button>
            <button className="dl-btn-add" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Thêm vào blacklist
            </button>
          </div>

          {loading ? (
            <p className="approval-empty">Đang tải...</p>
          ) : list.length === 0 ? (
            <p className="approval-empty">Danh sách đen trống.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {list.map((item, idx) => (
                <div key={item.blacklistID ?? item.id ?? idx} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1.25rem", borderRadius: 12,
                  border: "1.5px solid #fee2e2", background: "#fff5f5",
                }}>
                  <Ban size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 2px" }}>
                      User #{item.userID}
                    </p>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{item.reason}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item)}
                    style={{ background: "none", border: "1.5px solid #fee2e2", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#ef4444" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="dl-overlay" onClick={() => setShowModal(false)}>
          <div className="dl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dl-modal-header">
              <div className="dl-modal-title-row">
                <Ban size={18} className="dl-modal-icon" />
                <h3 className="dl-modal-title">Thêm vào danh sách đen</h3>
              </div>
              <button className="dl-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <div className="dl-modal-body">
              <div className="dl-form-field" style={{ marginBottom: "1rem" }}>
                <label className="pr-label">User ID <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="pr-select" style={{ padding: "9px 12px" }} type="number" placeholder="VD: 42" value={form.userID} onChange={set("userID")} />
              </div>
              <div className="dl-form-field">
                <label className="pr-label">Lý do <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea className="pr-textarea" rows={3} placeholder="Lý do đưa vào danh sách đen..." value={form.reason} onChange={set("reason")} />
              </div>
            </div>

            <div className="dl-modal-footer">
              <button className="pr-btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>Hủy</button>
              <button className="pr-btn-primary" style={{ width: "auto" }} onClick={handleAdd} disabled={submitting}>
                {submitting ? "Đang thêm..." : "Thêm vào blacklist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
