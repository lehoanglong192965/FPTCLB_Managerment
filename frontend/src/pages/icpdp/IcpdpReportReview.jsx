import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, FileText, ExternalLink, CheckCircle2, AlertCircle, Clock, Search, XCircle, ChevronRight, BarChart2 } from "lucide-react";
import reportService from "../../services/api/report/reportService";
import eventService from "../../services/api/events/eventService";

const LS_KEY = "icpdp_reviewed_events";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  return apiBase.replace(/\/api\/?$/, "") + url;
};

function formatDate(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_CFG = {
  pending:  { label: "Chờ duyệt", bg: "#EDE9FE", color: "#6D28D9", icon: Clock,         border: "#7C3AED" },
  approved: { label: "Đã duyệt",  bg: "#D1FAE5", color: "#065F46", icon: CheckCircle2,  border: "#10B981" },
  rejected: { label: "Đã từ chối",bg: "#FEE2E2", color: "#991B1B", icon: XCircle,       border: "#EF4444" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

/* ── Detail modal ── */
function DetailModal({ ev, report, onApprove, onReject, onClose, approving, onViewContributions }) {
  const [showReject, setShowReject]   = useState(false);
  const [reason, setReason]           = useState("");
  const [touched, setTouched]         = useState(false);
  const isValid = reason.trim().length >= 10;
  const reportUrl = report?.reportUrl ? getImageUrl(report.reportUrl) : null;
  const status    = ev._reviewStatus;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>

        {/* Top stripe */}
        <div className="h-1 w-full shrink-0" style={{ background: STATUS_CFG[status]?.border ?? "#7C3AED" }} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <StatusBadge status={status} />
            <h2 className="text-base font-bold mt-1.5 leading-snug" style={{ color: "#0D1B3E" }}>{ev.eventName}</h2>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              {ev.startDate ? `Tổ chức: ${formatDate(ev.startDate)}` : ""}
              {ev.location ? ` · ${ev.location}` : ""}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {report ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94A3B8", letterSpacing: "0.1em" }}>
                Tóm tắt báo cáo
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line rounded-xl px-4 py-3 mb-4"
                style={{ color: "#374151", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                {report.summary || "Không có tóm tắt."}
              </p>
              {reportUrl ? (
                <a href={reportUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ color: "#6D28D9", background: "#EDE9FE", border: "1px solid #DDD6FE" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#DDD6FE"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#EDE9FE"; }}>
                  <FileText size={14} /> Mở file PDF <ExternalLink size={12} />
                </a>
              ) : (
                <p className="text-xs italic" style={{ color: "#CBD5E1" }}>Không có file đính kèm</p>
              )}
            </>
          ) : (
            <p className="text-sm italic" style={{ color: "#CBD5E1" }}>Đang tải thông tin báo cáo...</p>
          )}

          {/* Reject inline form */}
          {showReject && status === "pending" && (
            <div className="mt-5 p-4 rounded-xl" style={{ background: "#FFF5F5", border: "1px solid #FECACA" }}>
              <p className="text-sm font-semibold mb-2" style={{ color: "#991B1B" }}>Lý do từ chối</p>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value); setTouched(true); }}
                placeholder="Mô tả cụ thể lý do..."
                rows={3}
                className="w-full resize-none rounded-xl border text-sm text-gray-800 px-3 py-2.5 outline-none"
                style={{ border: touched && !isValid ? "1px solid #EF4444" : "1px solid #FECACA", background: "#fff" }}
              />
              {touched && !isValid && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Lý do phải có ít nhất 10 ký tự.
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowReject(false)}
                  className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#E2E8F0" }}>
                  Huỷ
                </button>
                <button
                  onClick={() => { setTouched(true); if (isValid) onReject(ev.eventID, reason.trim()); }}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-semibold transition-colors"
                  style={{ background: "#EF4444" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#DC2626"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#EF4444"; }}>
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 shrink-0">
          {status === "approved" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "#D1FAE5", color: "#065F46" }}>
                <CheckCircle2 size={15} /> Đã phê duyệt báo cáo
              </div>
              <button
                onClick={() => onViewContributions(ev.eventID)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full"
                style={{ background: "#EDE9FE", color: "#6D28D9", border: "1px solid #DDD6FE" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#DDD6FE"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#EDE9FE"; }}>
                <BarChart2 size={14} /> Xem đóng góp thành viên
              </button>
            </div>
          ) : status === "rejected" ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#FEE2E2", color: "#991B1B" }}>
              <XCircle size={15} /> Đã từ chối báo cáo
            </div>
          ) : !showReject ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowReject(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: "#EF4444", background: "#FFF5F5", border: "1px solid #FECACA" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FFF5F5"; }}>
                Từ chối
              </button>
              <button
                disabled={approving}
                onClick={() => onApprove(ev.eventID)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "#F37021" }}
                onMouseEnter={(e) => { if (!approving) e.currentTarget.style.background = "#E06518"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F37021"; }}>
                {approving ? "Đang xử lý..." : "Phê duyệt báo cáo"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function IcpdpReportReview() {
  const navigate = useNavigate();
  const [events, setEvents]         = useState([]);
  const [reports, setReports]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const fetchReportFor = async (eventId) => {
    try {
      const res = await reportService.getByEventId(eventId);
      setReports((prev) => ({ ...prev, [eventId]: res?.data ?? res }));
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    try { localStorage.removeItem(LS_KEY); } catch {}
    eventService.getReportUploadedEvents()
      .then((res) => {
        const pending = (Array.isArray(res) ? res : (res?.data ?? res?.content ?? []))
          .map((e) => ({ ...e, _reviewStatus: "pending" }));
        setEvents(pending);
        pending.forEach((e) => fetchReportFor(e.eventID));
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      })
      .finally(() => setLoading(false));
  }, []);
  const handleApprove = async (eventId) => {
    if (!window.confirm("Xác nhận phê duyệt báo cáo? Hành động không thể hoàn tác.")) return;
    setApprovingId(eventId);
    try {
      await reportService.approve(eventId);
      setEvents((prev) => prev.map((e) => e.eventID === eventId ? { ...e, _reviewStatus: "approved" } : e));
      setSelected((prev) => prev?.eventID === eventId ? { ...prev, _reviewStatus: "approved" } : prev);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Lỗi khi phê duyệt báo cáo.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (eventId, reason) => {
    try {
      await reportService.reject(eventId, { reason });
      setEvents((prev) => prev.map((e) => e.eventID === eventId ? { ...e, _reviewStatus: "rejected" } : e));
      setSelected((prev) => prev?.eventID === eventId ? { ...prev, _reviewStatus: "rejected" } : prev);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Lỗi khi từ chối báo cáo.");
    }
  };

  const counts = {
    all:      events.length,
    pending:  events.filter((e) => e._reviewStatus === "pending").length,
    approved: events.filter((e) => e._reviewStatus === "approved").length,
    rejected: events.filter((e) => e._reviewStatus === "rejected").length,
  };

  const visible = events.filter((e) => {
    if (statusFilter === "pending"  && e._reviewStatus !== "pending")  return false;
    if (statusFilter === "approved" && e._reviewStatus !== "approved") return false;
    if (statusFilter === "rejected" && e._reviewStatus !== "rejected") return false;
    if (search.trim() && !e.eventName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Duyệt Báo Cáo Sự Kiện</h1>
        <p className="page-subtitle">Xem xét báo cáo đã nộp và xác nhận điểm cho các sự kiện đã hoàn thành</p>
      </div>

      {/* Search bar */}
      {!loading && events.length > 0 && (
        <div className="max-w-3xl mb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94A3B8" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên sự kiện..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B" }}
              onFocus={(e) => { e.target.style.borderColor = "#7C3AED"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#E2E8F0"; }}
            />
          </div>

          {/* Filter tabs — below search */}
          <div className="flex gap-0 border-b-2 border-gray-200 mt-3">
            {[
              { key: "all",      label: "Tất cả" },
              { key: "pending",  label: "Chờ duyệt" },
              { key: "approved", label: "Đã duyệt" },
              { key: "rejected", label: "Từ chối" },
            ].map(({ key, label }) => {
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 ${
                    isActive ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                  }`}
                >
                  {label}
                  {counts[key] > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${isActive ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                      {counts[key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#94A3B8" }}>Đang tải...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-20 text-center max-w-3xl">
          {search ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F1F5F9" }}>
                <Search size={24} style={{ color: "#94A3B8" }} />
              </div>
              <p className="font-semibold text-gray-600">Không tìm thấy kết quả.</p>
              <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>Thử thay đổi từ khoá hoặc bộ lọc.</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
                <CheckCircle2 size={26} style={{ color: "#10B981" }} />
              </div>
              <p className="font-semibold text-gray-600">Không có báo cáo nào cần duyệt.</p>
              <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>Tất cả báo cáo đã được xử lý.</p>
            </>
          )}
        </div>
      ) : (
        /* List items */
        <div className="flex flex-col gap-2 max-w-3xl">
          {visible.map((ev) => {
            const cfg = STATUS_CFG[ev._reviewStatus] ?? STATUS_CFG.pending;
            return (
              <button
                key={ev.eventID}
                onClick={() => setSelected(ev)}
                className="w-full text-left bg-white rounded-2xl px-5 py-4 flex items-center gap-4 transition-all group"
                style={{
                  boxShadow: "0 1px 3px rgba(13,27,62,0.07)",
                  borderLeft: `4px solid ${cfg.border}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(13,27,62,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(13,27,62,0.07)"; }}
              >
                {/* Status dot */}
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.border }} />

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate" style={{ color: "#0D1B3E" }}>{ev.eventName}</p>
                    <StatusBadge status={ev._reviewStatus} />
                  </div>
                  <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
                    {ev.startDate ? formatDate(ev.startDate) : ""}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: "#CBD5E1" }} />
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <DetailModal
          ev={selected}
          report={reports[selected.eventID]}
          approving={approvingId === selected.eventID}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelected(null)}
          onViewContributions={(eventId) => {
            setSelected(null);
            navigate(`/icpdp/events/${eventId}/contributions`);
          }}
        />
      )}
    </div>
  );
}
