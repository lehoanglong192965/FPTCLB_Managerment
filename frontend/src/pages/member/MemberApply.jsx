import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle, Clock, Calendar, XCircle, Inbox, RotateCcw, RefreshCw } from "lucide-react";
import applicationApi from "../../services/api/member/applicationApi";
import { getServerOrigin } from "../../services/api/axiosClient";
import { useToast } from "../../contexts/ToastContext";

const APP_STATUS_MAP = {
  Submitted:  { label: "Chờ duyệt CV",   cls: "bg-amber-100 text-amber-700" },
  Reviewing:  { label: "Đang xem xét",   cls: "bg-blue-100 text-blue-700" },
  ACCEPTED:   { label: "Chờ phỏng vấn",  cls: "bg-purple-100 text-purple-700" },
  PASSED:     { label: "Đã vào CLB",     cls: "bg-emerald-100 text-emerald-700" },
  REJECTED:   { label: "Bị từ chối",     cls: "bg-red-100 text-red-500" },
  FAILED:     { label: "Rớt phỏng vấn",  cls: "bg-red-100 text-red-500" },
  Withdrawn:  { label: "Đã rút đơn",    cls: "bg-gray-100 text-gray-500" },
};

const FILTER_TABS = [
  { key: "ALL",       label: "Tất cả" },
  { key: "PENDING",   label: "Đang xử lý" },
  { key: "DONE",      label: "Đã xử lý" },
  { key: "WITHDRAWN", label: "Đã rút đơn" },
];

const isPending    = (s) => s === "Submitted" || s === "Reviewing" || s === "ACCEPTED";
const isDone       = (s) => s === "PASSED" || s === "REJECTED" || s === "FAILED";
const isWithdrawn  = (s) => s === "Withdrawn";

export default function MemberApply() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedApp, setSelectedApp]   = useState(null);
  const [withdrawing, setWithdrawing]   = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await applicationApi.getMyApplications();
      const arr = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
      setApplications(arr);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      toast.error("Không thể tải danh sách đơn ứng tuyển.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const handleWithdraw = async (app) => {
    setWithdrawing(true);
    try {
      await applicationApi.withdraw(app.applicationID);
      setApplications((prev) =>
        prev.map((a) => a.applicationID === app.applicationID ? { ...a, status: "Withdrawn" } : a)
      );
      setSelectedApp((prev) => prev?.applicationID === app.applicationID ? { ...prev, status: "Withdrawn" } : prev);
      toast.success("Đã rút đơn ứng tuyển.");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Không thể rút đơn. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setWithdrawing(false);
    }
  };

  const filtered = applications.filter((app) => {
    if (activeFilter === "ALL")       return true;
    if (activeFilter === "PENDING")   return isPending(app.status);
    if (activeFilter === "DONE")      return isDone(app.status);
    if (activeFilter === "WITHDRAWN") return isWithdrawn(app.status);
    return true;
  });

  const countOf = (key) => {
    if (key === "ALL")       return applications.length;
    if (key === "PENDING")   return applications.filter((a) => isPending(a.status)).length;
    if (key === "DONE")      return applications.filter((a) => isDone(a.status)).length;
    if (key === "WITHDRAWN") return applications.filter((a) => isWithdrawn(a.status)).length;
    return 0;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Đơn Ứng Tuyển</h1>
        <p className="page-subtitle">Theo dõi các đơn bạn đã nộp để tham gia câu lạc bộ</p>
      </div>

      <div className="content-card">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>
            Đơn đã nộp ({applications.length})
          </h3>
          <button
            onClick={loadApplications}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 text-[12px] font-semibold hover:bg-slate-50 cursor-pointer font-[inherit] disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 border-b-2 border-gray-200 mb-5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count = countOf(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveFilter(tab.key); setSelectedApp(null); }}
                className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 font-[inherit] bg-transparent ${
                  isActive ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                }`}
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <RefreshCw size={28} className="animate-spin" color="#E6430A" style={{ margin: "0 auto" }} />
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: "0.75rem" }}>Đang tải...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <Inbox size={40} strokeWidth={1.2} color="#d1d5db" />
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: "0.75rem" }}>
              Bạn chưa nộp đơn ứng tuyển vào câu lạc bộ nào.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <Inbox size={40} strokeWidth={1.2} color="#d1d5db" />
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: "0.75rem" }}>
              Không có đơn nào ở mục này.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 max-md:flex-col">
            <div className={`flex flex-col gap-3 ${selectedApp ? "flex-[1.2]" : "flex-1"}`}>
              {filtered.map((app) => {
                const status = APP_STATUS_MAP[app.status] ?? APP_STATUS_MAP.Submitted;
                const isSelected = selectedApp?.applicationID === app.applicationID;
                const date = app.createdAt
                  ? new Date(app.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
                  : "—";
                return (
                  <div
                    key={app.applicationID}
                    onClick={() => setSelectedApp(app)}
                    className={`rounded-xl p-4 bg-white cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm ${
                      isSelected ? "border-l-4 border-[#E6430A]" : "border border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[14px] font-semibold text-slate-900">
                        {app.clubName ?? `CLB #${app.clubID}`}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold uppercase ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[12.5px] text-slate-500">
                      <Calendar size={13} /> Nộp ngày {date}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedApp && (
              <div className="flex-1 self-start bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                  <h4 className="text-[14px] font-bold text-slate-900 m-0">Chi tiết đơn ứng tuyển</h4>
                  <button
                    className="bg-none border-none text-slate-500 cursor-pointer text-sm font-[inherit]"
                    onClick={() => setSelectedApp(null)}
                  >
                    Đóng
                  </button>
                </div>

                <p className="text-[15px] font-semibold text-slate-900 m-0 mb-1">
                  {selectedApp.clubName ?? `CLB #${selectedApp.clubID}`}
                </p>
                <p className="text-[12px] text-slate-400 m-0 mb-4">Mã đơn #{selectedApp.applicationID}</p>

                {/* Timeline */}
                <div className="flex flex-col relative pl-6 border-l-2 border-slate-200">
                  {/* Bước 1: Nộp đơn */}
                  <div className="relative pb-5">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_#10b981]" />
                    <p className="text-sm font-semibold text-slate-800 m-0">Đơn đã được nộp</p>
                    <p className="text-[13px] text-slate-500 mt-1 m-0 line-clamp-3">{selectedApp.introduction}</p>
                    <p className="text-[11px] text-slate-400 mt-1 m-0 flex items-center gap-1">
                      <Clock size={11} />
                      {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString("vi-VN") : "—"}
                    </p>
                  </div>

                  {/* Bước 2: Trạng thái CV */}
                  {(selectedApp.status === "Submitted" || selectedApp.status === "Reviewing") && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_0_2px_#fbbf24]" />
                      <p className="text-sm font-semibold text-slate-800 m-0">Đang chờ CLB xét duyệt hồ sơ</p>
                      <p className="text-[13px] text-slate-500 mt-1 m-0">Ban tuyển dụng đang xem xét CV của bạn.</p>
                      {selectedApp.status === "Submitted" && (
                        <button
                          onClick={() => handleWithdraw(selectedApp)}
                          disabled={withdrawing}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-[1.5px] border-red-200 bg-white text-[12.5px] font-semibold text-red-600 cursor-pointer transition-colors hover:bg-red-50 font-[inherit] disabled:opacity-60"
                        >
                          <RotateCcw size={13} /> {withdrawing ? "Đang rút..." : "Rút đơn"}
                        </button>
                      )}
                    </div>
                  )}

                  {selectedApp.status === "ACCEPTED" && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-[0_0_0_2px_#a855f7]" />
                      <p className="text-sm font-semibold text-slate-800 m-0 flex items-center gap-1.5">
                        <CheckCircle size={14} color="#10b981" /> Hồ sơ được chấp nhận
                      </p>
                      <p className="text-[13px] text-slate-500 mt-1 m-0">
                        CLB đã gửi thông tin lịch phỏng vấn qua email của bạn. Vui lòng kiểm tra hộp thư.
                      </p>
                    </div>
                  )}

                  {selectedApp.status === "PASSED" && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_#10b981]" />
                      <p className="text-sm font-semibold text-emerald-700 m-0 flex items-center gap-1.5">
                        <CheckCircle size={14} color="#10b981" /> Chúc mừng! Bạn đã trở thành thành viên CLB
                      </p>
                    </div>
                  )}

                  {(selectedApp.status === "REJECTED" || selectedApp.status === "FAILED") && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-[0_0_0_2px_#ef4444]" />
                      <p className="text-sm font-semibold text-red-700 m-0 flex items-center gap-1.5">
                        <XCircle size={14} color="#ef4444" />
                        {selectedApp.status === "REJECTED" ? "Hồ sơ bị từ chối" : "Rớt phỏng vấn"}
                      </p>
                      <p className="text-[13px] text-slate-500 mt-1 m-0">
                        {selectedApp.status === "REJECTED"
                          ? "CLB đã gửi email thông báo lý do từ chối đến bạn."
                          : "Bạn chưa vượt qua vòng phỏng vấn lần này. Chúc may mắn ở những cơ hội tiếp theo!"}
                      </p>
                    </div>
                  )}

                  {selectedApp.status === "Withdrawn" && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-[0_0_0_2px_#9ca3af]" />
                      <p className="text-sm font-semibold text-slate-800 m-0">Bạn đã rút đơn</p>
                      <p className="text-[13px] text-slate-500 mt-1 m-0">Đơn ứng tuyển này không còn được CLB xét duyệt.</p>
                    </div>
                  )}
                </div>

                {selectedApp.cvUrl && (
                  <a
                    href={selectedApp.cvUrl.startsWith("http") ? selectedApp.cvUrl : getServerOrigin() + selectedApp.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#E6430A] no-underline hover:underline"
                  >
                    <FileText size={14} /> Xem CV / Portfolio đã nộp
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
