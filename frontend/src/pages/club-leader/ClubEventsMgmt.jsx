import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Search, X, AlertTriangle, Users } from "lucide-react";
import { TokenService } from "../../services/api/axiosClient";
import clubService from "../../services/api/clubs/clubService";
import eventService from "../../services/api/events/eventService";
import FinishEventModal from "../../components/events/FinishEventModal";
import CloseEventButton from "../icpdp/CloseEventButton";

const STATUS_CFG = {
  // Title case (localStorage / frontend)
  Draft:     { label: "Bản nháp",      color: "#6b7280", bg: "#f3f4f6" },
  Pending:   { label: "Chờ duyệt",     color: "#d97706", bg: "#fffbeb" },
  Approved:  { label: "Đã duyệt",      color: "#059669", bg: "#ecfdf5" },
  Upcoming:  { label: "Sắp diễn ra",   color: "#059669", bg: "#ecfdf5" },
  Ongoing:   { label: "Đang diễn ra",  color: "#2563eb", bg: "#eff6ff" },
  Completed: { label: "Đã kết thúc",   color: "#7c3aed", bg: "#f5f3ff" },
  Closed:    { label: "Đã đóng",       color: "#374151", bg: "#e5e7eb" },
  Cancelled: { label: "Đã hủy",        color: "#dc2626", bg: "#fef2f2" },
  // UPPERCASE (trực tiếp từ backend DB)
  DRAFT:     { label: "Bản nháp",      color: "#6b7280", bg: "#f3f4f6" },
  PENDING:   { label: "Chờ duyệt",     color: "#d97706", bg: "#fffbeb" },
  APPROVED:  { label: "Đã duyệt",      color: "#059669", bg: "#ecfdf5" },
  UPCOMING:  { label: "Sắp diễn ra",   color: "#059669", bg: "#ecfdf5" },
  ONGOING:   { label: "Đang diễn ra",  color: "#2563eb", bg: "#eff6ff" },
  COMPLETED: { label: "Đã kết thúc",   color: "#7c3aed", bg: "#f5f3ff" },
  CLOSED:    { label: "Đã đóng",       color: "#374151", bg: "#e5e7eb" },
  CANCELLED: { label: "Đã hủy",        color: "#dc2626", bg: "#fef2f2" },
  // lowercase (CreateEventPage saveToLocal)
  pending:   { label: "Chờ duyệt",     color: "#d97706", bg: "#fffbeb" },
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
    onConfirm(event.eventID, reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
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

        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            Bạn sắp hủy sự kiện{" "}
            <span className="font-semibold text-gray-900">"{event.eventName}"</span>.
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

// Lấy clubId từ nhiều nguồn: TokenService → localStorage.user → null
function resolveClubId() {
  const fromToken = TokenService.getClubId();
  if (fromToken) return fromToken;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.clubId ?? null;
  } catch {
    return null;
  }
}

// Chuẩn hóa event từ cả 2 nguồn (localStorage format cũ & API format mới)
function normalizeEvent(ev) {
  return {
    eventID:     ev.eventID     ?? ev.id     ?? null,
    eventName:   ev.eventName   ?? ev.name   ?? "",
    eventStatus: ev.eventStatus ?? ev.status ?? "Draft",
    startDate:   ev.startDate   ?? null,
    date:        ev.date        ?? "",
    time:        ev.time        ?? "",
    location:    ev.location    ?? "",
  };
}

function loadLocal(clubId) {
  try {
    const raw = JSON.parse(localStorage.getItem(`club_events_${clubId}`) || "[]");
    return raw.map(normalizeEvent);
  } catch {
    return [];
  }
}

export default function ClubEventsMgmt() {
  const clubId   = resolveClubId();
  const navigate = useNavigate();

  const [search, setSearch]             = useState("");
  const [events, setEvents]             = useState(() => loadLocal(clubId));
  const [cancelTarget, setCancelTarget] = useState(null);
  const [finishTarget, setFinishTarget] = useState(null);
  const [startingId, setStartingId]     = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await clubService.getAllEvents(clubId);
        // axiosClient interceptor đã unwrap response.data, nên response IS the data
        // Hỗ trợ: plain array, { content: [...] } (paginated), { data: [...] }
        let raw;
        if (Array.isArray(response)) {
          raw = response;
        } else if (response?.content && Array.isArray(response.content)) {
          raw = response.content;
        } else if (response?.data && Array.isArray(response.data)) {
          raw = response.data;
        } else {
          raw = [];
        }
        const normalized = raw.map(normalizeEvent);
        setEvents(normalized);
        localStorage.setItem(`club_events_${clubId}`, JSON.stringify(raw));
      } catch (error) {
        console.error("[ClubEventsMgmt] Lỗi tải sự kiện:", error);
      }
    };
    if (clubId) fetchEvents();
  }, [clubId]);

  const filtered = events.filter((e) =>
    (e.eventName || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelConfirm = async (eventID, reason) => {
    try {
      await eventService.cancel(clubId, eventID, reason);
      setEvents((prev) =>
        prev.map((e) => e.eventID === eventID ? { ...e, eventStatus: "Cancelled" } : e)
      );
      setCancelTarget(null);
    } catch (error) {
      alert("Lỗi khi hủy sự kiện: " + (error.response?.data?.message || error.message));
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sự kiện..."
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <Calendar size={40} style={{ color: "#e5e7eb", margin: "0 auto 14px", display: "block" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>
              {search ? "Không tìm thấy sự kiện phù hợp." : (!clubId ? "Không xác định được câu lạc bộ." : "Chưa có sự kiện nào.")}
            </p>
            {!search && !clubId && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 10px" }}>
                Vui lòng đăng xuất và đăng nhập lại để làm mới phiên.
              </p>
            )}
            {!search && !!clubId && (
              <>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 18px" }}>
                  Tạo đề xuất sự kiện để bắt đầu.
                </p>
                <button
                  onClick={() => navigate("../event-create", { relative: "path" })}
                  style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "#E6430A", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
                >
                  + Tạo sự kiện ngay
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((ev, index) => {
              const rawStatus = ev.eventStatus || "Draft";
              const status    = rawStatus.toUpperCase(); // chuẩn hóa để so sánh
              const cfg       = STATUS_CFG[rawStatus] || STATUS_CFG[status] || STATUS_CFG["Draft"];

              const dateStr = ev.startDate
                ? new Date(ev.startDate).toLocaleDateString("vi-VN")
                : (ev.date || "Chưa xác định");
              const timeStr = ev.startDate
                ? new Date(ev.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : (ev.time || "");

              return (
                <div
                  key={ev.eventID ?? `${ev.eventName}-${ev.startDate ?? ev.date ?? index}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "0.875rem 1.25rem", borderRadius: 12,
                    border: status === "CANCELLED" ? "1.5px solid #fecaca" : "1.5px solid #f0f0f0",
                    background: status === "CANCELLED" ? "#fff8f8" : "#fff",
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFF3EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={20} color="#E6430A" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 4px" }}>
                      {ev.eventName}
                    </p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={11} /> {dateStr} {timeStr}
                      </span>
                      {ev.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={11} /> {ev.location}
                        </span>
                      )}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>

                    {/* Draft/DRAFT: Gửi đề xuất + Hủy */}
                    {status === "DRAFT" && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await eventService.submit(ev.eventID);
                              setEvents((prev) =>
                                prev.map((e) => e.eventID === ev.eventID ? { ...e, eventStatus: "PENDING" } : e)
                              );
                            } catch (e) {
                              alert("Lỗi gửi đề xuất: " + e.message);
                            }
                          }}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#059669", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          Gửi đề xuất
                        </button>
                        <button
                          onClick={() => setCancelTarget(ev)}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {/* Approved/Upcoming: Phân công + Bắt đầu + Hủy */}
                    {(status === "APPROVED" || status === "UPCOMING") && (
                      <>
                        <button
                          onClick={() => navigate(`${ev.eventID}/assignments`, { relative: "path" })}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <Users size={12} /> Phân công
                        </button>
                        <button
                          disabled={startingId === ev.eventID}
                          onClick={async () => {
                            setStartingId(ev.eventID);
                            try {
                              await eventService.start(ev.eventID);
                              setEvents((prev) =>
                                prev.map((e) => e.eventID === ev.eventID ? { ...e, eventStatus: "ONGOING" } : e)
                              );
                            } catch (e) {
                              alert("Lỗi bắt đầu sự kiện: " + (e.response?.data?.message || e.message));
                            } finally {
                              setStartingId(null);
                            }
                          }}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: startingId === ev.eventID ? "#86efac" : "#059669", color: "#fff", border: "none", cursor: startingId === ev.eventID ? "not-allowed" : "pointer" }}
                        >
                          {startingId === ev.eventID ? "Đang xử lý..." : "Bắt đầu sự kiện"}
                        </button>
                        <button
                          onClick={() => setCancelTarget(ev)}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {/* Ongoing: Điểm danh + Kết thúc */}
                    {status === "ONGOING" && (
                      <>
                        <button
                          onClick={() => navigate(`${ev.eventID}/checkin`, { relative: "path" })}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#0891b2", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          Điểm danh
                        </button>
                        <button
                          onClick={() => setFinishTarget(ev.eventID)}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          Kết thúc
                        </button>
                      </>
                    )}

                    {/* Completed: Báo cáo + Đóng */}
                    {status === "COMPLETED" && (
                      <>
                        <button
                          onClick={() => navigate(`../contributions/${ev.eventID}`, { relative: "path" })}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          Báo cáo
                        </button>
                        <CloseEventButton
                          eventId={ev.eventID}
                          eventStatus="Completed"
                          onCloseSuccess={() => window.location.reload()}
                        />
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

      {finishTarget && (
        <FinishEventModal
          eventId={finishTarget}
          isOpen={true}
          onClose={() => setFinishTarget(null)}
          onFinishSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
