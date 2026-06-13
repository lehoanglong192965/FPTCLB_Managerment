import { useState, useEffect } from "react";
import { Calendar, Plus, Clock, MapPin, Search, X } from "lucide-react";
import eventApi from "../../../services/api/eventApi";
import { TokenService } from "../../../services/api/axiosClient";

const STATUS_CFG = {
  upcoming: { label: "Sắp diễn ra", color: "#059669", bg: "#ecfdf5" },
  done:     { label: "Đã kết thúc", color: "#6b7280", bg: "#f3f4f6" },
};

const INIT_FORM = { eventName: "", description: "", location: "", startDate: "", endDate: "", budget: "" };

export default function ClubEventsMgmt() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreate, setCreate] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const clubId = TokenService.getClubId();

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEvents = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const data = await eventApi.getByClubId(clubId);
      setEvents(data || []);
    } catch (err) {
      showToast("Lỗi khi tải sự kiện", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const handleCreate = async () => {
    if (!form.eventName || !form.startDate || !form.endDate) {
      showToast("Vui lòng nhập tên và thời gian sự kiện", "error");
      return;
    }
    try {
      await eventApi.create(clubId, form);
      showToast("Tạo sự kiện thành công!");
      setCreate(false);
      setForm(INIT_FORM);
      loadEvents();
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi tạo sự kiện", "error");
    }
  };

  const filtered = events.filter((e) =>
    e.eventName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="page-header">
        <h1 className="page-title">Sự Kiện CLB</h1>
        <p className="page-subtitle">Quản lý lịch sự kiện của câu lạc bộ</p>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.75rem" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sự kiện..."
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button className="dl-btn-add" onClick={() => setCreate(true)}>
            <Plus size={15} /> Tạo sự kiện
          </button>
        </div>

        {loading ? (
          <p className="approval-empty">Đang tải sự kiện...</p>
        ) : filtered.length === 0 ? (
          <p className="approval-empty">Không tìm thấy sự kiện phù hợp.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((ev) => {
              const cfg = STATUS_CFG[ev.eventStatus] || STATUS_CFG.upcoming;
              return (
                <div key={ev.eventID} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1.25rem", borderRadius: 12,
                  border: "1.5px solid #f0f0f0", background: "#fff",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFF3EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={20} color="#E6430A" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 4px" }}>{ev.eventName}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> Bắt đầu: {new Date(ev.startDate).toLocaleString()}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {ev.location || "Chưa cập nhật"}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="cm-overlay" onClick={() => setCreate(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3 className="cm-modal-title">Tạo Sự Kiện Mới</h3>
              <button className="dl-modal-close" onClick={() => setCreate(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="cm-modal-body">
              <div className="cm-form-field">
                <label className="pr-label">Tên Sự Kiện *</label>
                <input className="cm-input" value={form.eventName} onChange={set("eventName")} />
              </div>
              <div className="cm-form-row">
                <div className="cm-form-field">
                  <label className="pr-label">Thời gian bắt đầu *</label>
                  <input className="cm-input" type="datetime-local" value={form.startDate} onChange={set("startDate")} />
                </div>
                <div className="cm-form-field">
                  <label className="pr-label">Thời gian kết thúc *</label>
                  <input className="cm-input" type="datetime-local" value={form.endDate} onChange={set("endDate")} />
                </div>
              </div>
              <div className="cm-form-row">
                <div className="cm-form-field">
                  <label className="pr-label">Địa điểm</label>
                  <input className="cm-input" value={form.location} onChange={set("location")} />
                </div>
                <div className="cm-form-field">
                  <label className="pr-label">Ngân sách (VND)</label>
                  <input className="cm-input" type="number" value={form.budget} onChange={set("budget")} />
                </div>
              </div>
              <div className="cm-form-field">
                <label className="pr-label">Mô tả</label>
                <textarea className="pr-textarea" rows={3} value={form.description} onChange={set("description")} />
              </div>
            </div>
            <div className="cm-modal-footer">
              <button className="pr-btn-ghost" onClick={() => setCreate(false)}>Hủy</button>
              <button className="cm-btn-create cm-btn-modal-submit" onClick={handleCreate} disabled={loading}>
                <Plus size={15} /> Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
