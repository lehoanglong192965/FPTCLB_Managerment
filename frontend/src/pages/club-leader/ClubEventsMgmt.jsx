import { useState } from "react";
import { Calendar, Plus, Clock, MapPin, Search, X, AlertTriangle } from "lucide-react";
import EventProposalForm from "./EventProposalForm";
import { useEvents } from "../../contexts/EventsContext";

const MOCK_EVENTS = [
  { id: 1, name: "Workshop UI/UX Design",  date: "15/07/2026", time: "14:00", location: "Hall A",         status: "approved", attendees: 45  },
  { id: 2, name: "Hackathon mùa hè 2026",  date: "20/07/2026", time: "08:00", location: "FPT Arena",      status: "approved", attendees: 120 },
  { id: 3, name: "Tech Talk: AI & LLM",    date: "01/06/2026", time: "15:00", location: "Phòng hội thảo", status: "done",     attendees: 67  },
  { id: 4, name: "CLB Anniversary Night",  date: "10/05/2026", time: "18:00", location: "Sân ngoài",      status: "done",     attendees: 200 },
];

const STATUS_CFG = {
  pending:   { label: "Chờ phê duyệt", color: "#d97706", bg: "#fffbeb" },
  upcoming:  { label: "Sắp diễn ra",   color: "#059669", bg: "#ecfdf5" },
  approved:  { label: "Đã phê duyệt",  color: "#2563eb", bg: "#eff6ff" },
  cancelled: { label: "Đã hủy",        color: "#dc2626", bg: "#fef2f2" },
  done:      { label: "Đã kết thúc",   color: "#6b7280", bg: "#f3f4f6" },
};

const REASON_MIN = 20;

function CancelModal({ event, onConfirm, onClose }) {
  const [reason, setReason]   = useState("");
  const [touched, setTouched] = useState(false);

  const isValid   = reason.trim().length > REASON_MIN;
  const showError = touched && !isValid;
  const remaining = REASON_MIN - reason.trim().length;

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid) return;
    onConfirm(event.id, reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <h2 className="text-[15px] font-bold text-gray-900 m-0">Hủy sự kiện</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            Bạn sắp hủy sự kiện{" "}
            <span className="font-semibold text-gray-900">"{event.name}"</span>.
            Hành động này không thể hoàn tác.
          </p>

          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
            Lý do hủy <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }}
            onBlur={() => setTouched(true)}
            placeholder="Nhập lý do hủy sự kiện..."
            rows={4}
            className={`w-full resize-none rounded-xl border text-[13.5px] text-gray-800 px-3.5 py-3 outline-none transition-colors leading-relaxed ${
              showError
                ? "border-red-400 focus:border-red-500 bg-red-50/40"
                : "border-gray-200 focus:border-[#e6430a] bg-white"
            }`}
            style={{ boxSizing: "border-box" }}
          />

          <div className="flex items-center justify-between mt-1.5">
            {showError ? (
              <p className="text-[12px] text-red-600 font-medium">
                Lý do phải có hơn {REASON_MIN} ký tự
                {remaining > 0 && ` (còn thiếu ${remaining} ký tự)`}.
              </p>
            ) : (
              <span />
            )}
            <span className={`text-[11px] ml-auto font-medium ${isValid ? "text-green-600" : "text-gray-400"}`}>
              {reason.trim().length} / {REASON_MIN}+
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Quay lại
          </button>
          <button
            onClick={handleSubmit}
            disabled={touched && !isValid}
            className={`flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-colors border-none ${
              touched && !isValid
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 cursor-pointer"
            }`}
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClubEventsMgmt() {
  const [search, setSearch]             = useState("");
  const [events, setEvents]             = useState(MOCK_EVENTS);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const { proposeEvent }                = useEvents();

  const handleProposalSubmit = (formData) => {
    proposeEvent(formData, "CLB FPT");
    setEvents((prev) => [{
      id:       Date.now(),
      name:     formData.name,
      date:     formData.date,
      time:     formData.startTime,
      location: formData.location || "Online",
      status:   "pending",
      attendees: Number(formData.expectedCount),
    }, ...prev]);
    setShowForm(false);
  };

  const filtered = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelConfirm = (id, reason) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "cancelled", cancelReason: reason } : e
      )
    );
    setCancelTarget(null);
  };

  return (
    <div>
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
          <button className="dl-btn-add" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Tạo sự kiện
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="approval-empty">Không tìm thấy sự kiện phù hợp.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((ev) => {
              const cfg = STATUS_CFG[ev.status];
              return (
                <div key={ev.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1.25rem", borderRadius: 12,
                  border: ev.status === "cancelled" ? "1.5px solid #fecaca" : "1.5px solid #f0f0f0",
                  background: ev.status === "cancelled" ? "#fff8f8" : "#fff",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFF3EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={20} color="#E6430A" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 4px" }}>{ev.name}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {ev.date} {ev.time}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {ev.location}</span>
                    </p>
                    {ev.status === "cancelled" && ev.cancelReason && (
                      <p style={{ fontSize: 11.5, color: "#dc2626", margin: "5px 0 0", fontStyle: "italic" }}>
                        Lý do hủy: {ev.cancelReason}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{ev.attendees} người</span>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                    {ev.status === "approved" && (
                      <button
                        onClick={() => setCancelTarget(ev)}
                        style={{
                          padding: "4px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                          color: "#dc2626", background: "#fff", border: "1.5px solid #fca5a5",
                          cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#ef4444"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cancelTarget && (
        <CancelModal
          event={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {showForm && (
        <EventProposalForm
          onClose={() => setShowForm(false)}
          onSubmit={handleProposalSubmit}
        />
      )}
    </div>
  );
}
