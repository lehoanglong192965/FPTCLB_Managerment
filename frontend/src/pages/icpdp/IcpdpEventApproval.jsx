import { useState, useEffect } from "react";
import { X } from "lucide-react";
import eventService from "../../services/api/events/eventService";

const BUDGET_LIMIT = 5_000_000;

const STATUS_BADGE = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const TABS = [
  { key: "all",      label: "Tất cả"     },
  { key: "pending",  label: "Chờ duyệt"  },
  { key: "approved", label: "Đã duyệt"   },
  { key: "rejected", label: "Đã từ chối" },
];

function parseBudget(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  return parseInt(String(val).replace(/\./g, ""), 10) || 0;
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatBudget(val) {
  if (!val) return "0";
  return Number(val).toLocaleString("vi-VN");
}

/* ── Reject reason modal ───────────────────────────────── */
function RejectModal({ event, onConfirm, onClose }) {
  const [reason, setReason]   = useState("");
  const [touched, setTouched] = useState(false);

  const isValid   = reason.trim().length >= 10;
  const showError = touched && !isValid;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900 m-0">Từ chối sự kiện</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer border-none bg-transparent">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            Nhập lý do từ chối sự kiện <strong>"{event.name}"</strong>.
          </p>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
            Lý do <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }}
            placeholder="Nhập lý do từ chối..."
            rows={4}
            className={`w-full resize-none rounded-xl border text-[13.5px] text-gray-800 px-3.5 py-3 outline-none transition-colors leading-relaxed ${
              showError ? "border-red-400 bg-red-50/40" : "border-gray-200 focus:border-[#e6430a] bg-white"
            }`}
            style={{ boxSizing: "border-box" }}
          />
          {showError && <p className="text-[12px] text-red-600 mt-1">Lý do phải có ít nhất 10 ký tự.</p>}
        </div>

        <div className="flex gap-2.5 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[13.5px] font-semibold hover:bg-gray-50 cursor-pointer">
            Hủy
          </button>
          <button
            onClick={() => { setTouched(true); if (isValid) onConfirm(reason.trim()); }}
            className="flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold border-none bg-red-600 hover:bg-red-700 cursor-pointer"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

const LS_KEY = "icpdp_processed_events";

function loadProcessed() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}

function saveProcessed(events) {
  const processed = events.filter((e) => e.status !== "pending");
  localStorage.setItem(LS_KEY, JSON.stringify(processed));
}

const PUB_KEY = "public_approved_events";

function savePublicApproved(events) {
  const approved = events
    .filter((e) => e.status === "approved")
    .map((e) => ({
      id:                  e.id,
      title:               e.name,
      club:                e.club,
      emoji:               "🎉",
      color:               "#E6430A",
      badgeType:           "upcoming",
      date:                e.eventDate,
      location:            e.location ?? "",
      maxParticipants:     0,
      currentParticipants: 0,
    }));
  localStorage.setItem(PUB_KEY, JSON.stringify(approved));
}

/* ── Main ──────────────────────────────────────────────── */
export default function IcpdpEventApproval() {
  const [activeTab, setActiveTab]       = useState("pending");
  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchEvents = () => {
    setLoading(true);
    eventService.getPendingForIcpdp()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        const pendingIds = new Set(list.map((e) => e.eventID));

        const fromApi = list.map((e) => ({
          id:               e.eventID,
          status:           "pending",
          statusLabel:      "Chờ IC-PDP duyệt",
          name:             e.eventName,
          club:             e.clubName ?? `CLB #${e.clubID}`,
          description:      e.description,
          eventDate:        formatDate(e.startDate),
          budget:           formatBudget(e.budget),
          location:         e.location,
          submittedAt:      formatDate(e.createdAt),
          scheduleConflict: false,
        }));

        // Merge: giữ lại các sự kiện đã xử lý từ localStorage (trừ những sự kiện vẫn còn pending từ API)
        const processed = loadProcessed().filter((e) => !pendingIds.has(e.id));

        setEvents([...fromApi, ...processed]);
      })
      .catch(() => {
        // Nếu API lỗi, vẫn load processed từ localStorage
        setEvents(loadProcessed());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const updateAndPersist = (updater) => {
    setEvents((prev) => {
      const next = updater(prev);
      saveProcessed(next);
      savePublicApproved(next);
      return next;
    });
  };

  const filtered = activeTab === "all"
    ? events
    : events.filter((e) => e.status === activeTab);

  const countOf = (key) => key === "all"
    ? events.length
    : events.filter((e) => e.status === key).length;

  const approve = async (id) => {
    try {
      await eventService.approveForIcpdp(id);
      updateAndPersist((prev) =>
        prev.map((e) => e.id === id ? { ...e, status: "approved", statusLabel: "Đã phê duyệt" } : e)
      );
    } catch (err) {
      alert(err?.response?.data?.message ?? "Phê duyệt thất bại.");
    }
  };

  const reject = async (id, reason) => {
    try {
      await eventService.rejectForIcpdp(id, reason);
      updateAndPersist((prev) =>
        prev.map((e) => e.id === id
          ? { ...e, status: "rejected", statusLabel: "Đã từ chối", rejectionReason: reason }
          : e)
      );
    } catch (err) {
      alert(err?.response?.data?.message ?? "Từ chối thất bại.");
    }
    setRejectTarget(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Phê Duyệt Sự Kiện</h1>
        <p className="page-subtitle">Xét duyệt đề xuất tổ chức sự kiện từ các câu lạc bộ</p>
      </div>

      <div className="flex gap-0 border-b-2 border-gray-200 mb-6">
        {TABS.map((tab) => {
          const count    = countOf(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 ${
                isActive
                  ? "text-[#e6430a] border-[#e6430a] font-semibold"
                  : "text-gray-500 border-transparent hover:text-[#e6430a]"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${isActive ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3.5">
        {loading && (
          <p className="text-center py-16 text-gray-400 text-sm">Đang tải...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center py-16 text-gray-400 text-sm">Không có sự kiện nào.</p>
        )}
        {!loading && filtered.map((event) => {
          const hasBudgetWarning = parseBudget(event.budget) > BUDGET_LIMIT;
          const hasConflict      = event.scheduleConflict === true;

          const borderColor =
            event.status === "approved" ? "#16a34a" :
            event.status === "rejected" ? "#dc2626" :
            hasBudgetWarning || hasConflict ? "#ef4444" : "#e5e7eb";

          const bgColor =
            event.status === "approved" ? "#f0fdf4" :
            event.status === "rejected" ? "#fef2f2" :
            hasBudgetWarning || hasConflict ? "rgba(254,242,242,0.4)" : "#fff";

          return (
            <div
              key={event.id}
              className="rounded-xl px-6 py-5 shadow-sm flex justify-between items-start gap-6 transition-all"
              style={{ borderLeft: `4px solid ${borderColor}`, background: bgColor }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[event.status] ?? STATUS_BADGE.pending}`}>
                    {event.statusLabel}
                  </span>
                  {hasBudgetWarning && event.status === "pending" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      ⚠ Ngân sách vượt 5 triệu
                    </span>
                  )}
                  {hasConflict && event.status === "pending" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      ⚠ Trùng lịch
                    </span>
                  )}
                </div>

                <h3 className="text-[17px] font-bold text-gray-900 m-0 mb-0.5">{event.name}</h3>
                <p className="text-[13px] text-[#e6430a] font-medium m-0 mb-2">{event.club}</p>
                <p className="text-[13.5px] text-gray-600 m-0 mb-3 leading-relaxed">{event.description}</p>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-gray-500">
                  <span>Ngày tổ chức: <strong className={hasConflict ? "text-red-600" : "text-gray-900"}>{event.eventDate}</strong></span>
                  <span>Ngân sách: <strong className={hasBudgetWarning ? "text-red-600" : "text-gray-900"}>{event.budget} đ</strong></span>
                  {event.location && <span>Địa điểm: <strong className="text-gray-900">{event.location}</strong></span>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-gray-500 mt-1.5">
                  <span>Nộp ngày: {event.submittedAt}</span>
                </div>

                {event.status === "rejected" && event.rejectionReason && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[12.5px] text-red-700 leading-relaxed">
                    <span className="font-semibold">Lý do từ chối:</span> {event.rejectionReason}
                  </div>
                )}
              </div>

              {event.status === "pending" && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
                    onClick={() => approve(event.id)}
                  >
                    Phê duyệt
                  </button>
                  <button
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
                    onClick={() => setRejectTarget(event)}
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rejectTarget && (
        <RejectModal
          event={rejectTarget}
          onConfirm={(reason) => reject(rejectTarget.id, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
