import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Search, X, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import { TokenService } from "../../services/api/axiosClient";
import clubService from "../../services/api/clubs/clubService";
import eventService from "../../services/api/events/eventService";

function loadEvents(clubId) {
  try {
    return JSON.parse(localStorage.getItem(`club_events_${clubId}`) || "[]");
  } catch {
    return [];
  }
}

function saveEvents(clubId, events) {
  if (!clubId) return;
  localStorage.setItem(`club_events_${clubId}`, JSON.stringify(events));
}

const STATUS_CFG = {
  Draft:     { label: "Bản nháp",      color: "#6b7280", bg: "#f3f4f6" },
  Upcoming:  { label: "Sắp diễn ra",   color: "#059669", bg: "#ecfdf5" },
  Ongoing:   { label: "Đang diễn ra",  color: "#2563eb", bg: "#eff6ff" },
  Completed: { label: "Đã kết thúc",   color: "#7c3aed", bg: "#f5f3ff" },
  Closed:    { label: "Đã đóng",       color: "#374151", bg: "#e5e7eb" },
  Cancelled: { label: "Đã hủy",        color: "#dc2626", bg: "#fef2f2" },
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

// Helper to normalize status for comparison
const normalizeStatus = (status) => status?.toUpperCase();

export default function ClubEventsMgmt() {
  const clubId  = TokenService.getClubId();
  const navigate = useNavigate();

  const [search, setSearch]             = useState("");
  const [events, setEvents]             = useState(() => loadEvents(clubId));
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await clubService.getAllEvents(clubId);
        // Safely extract array from response, which might be the response itself or response.data
        const data = Array.isArray(response) ? response : (response.data || []);
        setEvents(data);
        saveEvents(clubId, data);
      } catch (error) {
        console.error("Lỗi khi tải sự kiện:", error);
      }
    };

    fetchEvents();
  }, [clubId]);

  const filtered = events.filter((e) =>
    (e.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelConfirm = async (id, reason) => {
    try {
        await eventService.cancel(clubId, id, reason);
        const updated = events.map((e) =>
          e.id === id ? { ...e, status: "Cancelled", cancelReason: reason } : e
        );
        setEvents(updated);
        saveEvents(clubId, updated);
        setCancelTarget(null);
    } catch (error) {
        alert("Lỗi khi hủy sự kiện: " + error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Sự Kiện</h1>
        <p className="page-subtitle">Theo dõi trạng thái các sự kiện đã đề xuất</p>
      </div>

      <div className="content-card">
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ position: "relative", maxWidth: 360 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sự kiện..."
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <Calendar size={40} style={{ color: "#e5e7eb", margin: "0 auto 14px", display: "block" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>
              {search ? "Không tìm thấy sự kiện phù hợp." : "Chưa có sự kiện nào."}
            </p>
            {!search && (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 18px" }}>
                Tạo đề xuất sự kiện để bắt đầu.
              </p>
            )}
            {!search && (
              <button
                onClick={() => navigate("../event-create", { relative: "path" })}
                style={{
                  padding: "9px 22px", borderRadius: 10, border: "none",
                  background: "#E6430A", color: "#fff", fontSize: 13.5, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Tạo sự kiện ngay
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((ev) => {
              // Add defensive check for ev.status
              const statusValue = ev.status || 'Draft'; 
              const normalizedStatus = normalizeStatus(statusValue);
              const cfgKey = normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase();
              const cfg = STATUS_CFG[cfgKey] || STATUS_CFG[normalizedStatus] || STATUS_CFG['Draft'];

              return (
                <div key={ev.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1.25rem", borderRadius: 12,
                  border: normalizedStatus === "CANCELLED" ? "1.5px solid #fecaca" : "1.5px solid #f0f0f0",
                  background: normalizedStatus === "CANCELLED" ? "#fff8f8" : "#fff",
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
                    {normalizedStatus === "CANCELLED" && ev.cancelReason && (
                      <p style={{ fontSize: 11.5, color: "#dc2626", margin: "5px 0 0", fontStyle: "italic" }}>
                        Lý do hủy: {ev.cancelReason}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{ev.attendees} người</span>
                    {cfg && (
                      <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                    )}

                    {(normalizedStatus === 'DRAFT' || normalizedStatus === 'UPCOMING') && (
                        <button onClick={() => setCancelTarget(ev)}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer" }}>
                          Hủy
                        </button>
                    )}

                    {normalizedStatus === 'ONGOING' && (
                      <button onClick={() => eventService.finish(ev.id).then(() => window.location.reload()).catch(e => alert("Lỗi kết thúc: " + e.message))}
                        style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer" }}>
                          Kết thúc
                      </button>
                    )}

                    {normalizedStatus === 'COMPLETED' && (
                      <>
                        <button onClick={() => navigate(`../contributions/${ev.id}`, { relative: "path" })}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
                          Báo cáo
                        </button>
                        <button onClick={() => eventService.close(ev.id).then(() => window.location.reload()).catch(e => alert("Lỗi đóng: " + e.message))}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#374151", color: "#fff", border: "none", cursor: "pointer" }}>
                          Đóng sự kiện
                        </button>
                      </>
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
    </div>
  );
}
