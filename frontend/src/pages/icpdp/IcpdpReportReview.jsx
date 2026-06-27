import { useState, useEffect } from "react";
import { X, FileText, ExternalLink, CheckCircle } from "lucide-react";
import eventService from "../../services/api/events/eventService";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  return apiBase.replace(/\/api\/?$/, "") + url;
};

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function RejectModal({ event, onConfirm, onClose }) {
  const [reason, setReason]   = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = reason.trim().length >= 10;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900 m-0">Từ chối báo cáo</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer border-none bg-transparent">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13.5px] text-gray-600 mb-4 leading-relaxed">
            Báo cáo của sự kiện <strong>"{event.eventName}"</strong> sẽ bị từ chối.
            Ban tổ chức sẽ cần nộp lại báo cáo mới.
          </p>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }}
            placeholder="Nhập lý do từ chối báo cáo..."
            rows={4}
            className={`w-full resize-none rounded-xl border text-[13.5px] text-gray-800 px-3.5 py-3 outline-none transition-colors leading-relaxed ${
              touched && !isValid ? "border-red-400 bg-red-50/40" : "border-gray-200 focus:border-[#e6430a] bg-white"
            }`}
            style={{ boxSizing: "border-box" }}
          />
          {touched && !isValid && (
            <p className="text-[12px] text-red-600 mt-1">Lý do phải có ít nhất 10 ký tự.</p>
          )}
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

export default function IcpdpReportReview() {
  const [events, setEvents]           = useState([]);
  const [reports, setReports]         = useState({});
  const [loading, setLoading]         = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [closingId, setClosingId]     = useState(null);
  const [closedIds, setClosedIds]     = useState(new Set());
  const [rejectedIds, setRejectedIds] = useState(new Set());

  const fetchReportFor = async (eventId) => {
    try {
      const res = await eventService.getReportByEventId(eventId);
      const data = res?.data ?? res;
      setReports((prev) => ({ ...prev, [eventId]: data }));
    } catch {
      // no report yet — skip
    }
  };

  useEffect(() => {
    setLoading(true);
    eventService.getReportUploadedEvents()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
        setEvents(list);
        list.forEach((e) => fetchReportFor(e.eventID));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClose = async (eventId) => {
    if (!window.confirm("Xác nhận đóng sự kiện và ghi nhận điểm? Hành động không thể hoàn tác.")) return;
    setClosingId(eventId);
    try {
      await eventService.close(eventId);
      setClosedIds((prev) => new Set([...prev, eventId]));
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Lỗi khi đóng sự kiện.");
    } finally {
      setClosingId(null);
    }
  };

  const handleReject = async (eventId, _reason) => {
    try {
      await eventService.rejectReport(eventId);
      setRejectedIds((prev) => new Set([...prev, eventId]));
      setRejectTarget(null);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Lỗi khi từ chối báo cáo.");
    }
  };

  const visible = events.filter((e) => !closedIds.has(e.eventID) && !rejectedIds.has(e.eventID));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Duyệt Báo Cáo Sự Kiện</h1>
        <p className="page-subtitle">Xem xét báo cáo đã nộp và xác nhận điểm cho các sự kiện đã hoàn thành</p>
      </div>

      {loading ? (
        <p className="text-center py-16 text-gray-400 text-sm">Đang tải...</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-300" />
          <p className="text-gray-500 font-semibold">Không có báo cáo nào cần duyệt.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((ev) => {
            const report   = reports[ev.eventID];
            const isClosed = closedIds.has(ev.eventID);
            const isClosingThis = closingId === ev.eventID;
            const reportUrl = report?.reportUrl ? getImageUrl(report.reportUrl) : null;

            return (
              <div
                key={ev.eventID}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Event header */}
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        Đã nộp báo cáo
                      </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 m-0 mb-0.5 truncate">{ev.eventName}</h3>
                    <p className="text-[13px] text-gray-500 m-0">
                      {ev.startDate ? `Tổ chức: ${formatDate(ev.startDate)}` : ""}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                  </div>
                </div>

                {/* Report content */}
                <div className="px-6 py-5">
                  {report ? (<>
                    <div className="mb-4">
                      <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        Tóm tắt báo cáo
                      </p>
                      <p className="text-[13.5px] text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        {report.summary || "Không có tóm tắt."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mb-5">
                      <FileText size={16} className="text-purple-500 shrink-0" />
                      <span className="text-[13px] text-gray-600 font-medium">File báo cáo:</span>
                      {reportUrl ? (
                        <a
                          href={reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          Mở file PDF <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[13px] text-gray-400 italic">Không có file</span>
                      )}
                    </div>
                  </>) : (
                    <p className="text-[13px] text-gray-400 italic mb-5">Đang tải thông tin báo cáo...</p>
                  )}

                  {/* Actions */}
                  {isClosed ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-[13px] font-semibold text-green-700">
                      <CheckCircle size={15} /> Đã đóng và xác nhận điểm
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setRejectTarget(ev)}
                        className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13.5px] font-semibold hover:bg-red-100 cursor-pointer transition-colors"
                      >
                        Từ chối báo cáo
                      </button>
                      <button
                        disabled={isClosingThis}
                        onClick={() => handleClose(ev.eventID)}
                        className={`flex-2 px-6 py-2.5 rounded-xl text-white text-[13.5px] font-semibold border-none transition-colors ${
                          isClosingThis
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-[#374151] hover:bg-[#1f2937] cursor-pointer"
                        }`}
                        style={{ flex: 2 }}
                      >
                        {isClosingThis ? "Đang xử lý..." : "Xác nhận điểm & Đóng sự kiện"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          event={rejectTarget}
          onConfirm={(reason) => handleReject(rejectTarget.eventID, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
