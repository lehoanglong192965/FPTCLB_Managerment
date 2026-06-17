import { useState } from "react";
import { FileText, CheckCircle, Clock, Calendar, XCircle, Inbox, RotateCcw } from "lucide-react";
import { useApplications } from "../../contexts/ApplicationsContext";

const APP_STATUS_MAP = {
  PENDING:   { label: "Chờ duyệt",    cls: "bg-amber-100 text-amber-700" },
  APPROVED:  { label: "Đã duyệt",     cls: "bg-emerald-100 text-emerald-700" },
  REJECTED:  { label: "Bị từ chối",   cls: "bg-red-100 text-red-500" },
  WITHDRAWN: { label: "Đã hủy",       cls: "bg-gray-100 text-gray-500" },
};

const FILTER_TABS = [
  { key: "ALL",       label: "Tất cả" },
  { key: "PENDING",   label: "Chờ duyệt" },
  { key: "APPROVED",  label: "Chấp nhận" },
  { key: "REJECTED",  label: "Từ chối" },
  { key: "WITHDRAWN", label: "Đã hủy" },
];

export default function MemberApply() {
  const { applications, updateApplication } = useApplications();
  const [activeFilter, setActiveFilter]      = useState("ALL");
  const [selectedApp, setSelectedApp]        = useState(null);

  const handleWithdraw = (id) => {
    const updated = { status: "WITHDRAWN", updatedAt: new Date().toISOString() };
    updateApplication(id, updated);
    setSelectedApp((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
  };

  const filtered = applications.filter((app) => activeFilter === "ALL" || app.status === activeFilter);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Đơn Ứng Tuyển</h1>
        <p className="page-subtitle">Theo dõi các đơn bạn đã nộp để tham gia câu lạc bộ</p>
      </div>

      <div className="content-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 1.25rem" }}>
          Đơn đã nộp ({applications.length})
        </h3>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveFilter(tab.key); setSelectedApp(null); }}
              className={`px-3.5 py-1.5 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-all font-[inherit] ${
                activeFilter === tab.key
                  ? "bg-[#E6430A] border-[#E6430A] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#E6430A] hover:text-[#E6430A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {applications.length === 0 ? (
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
              Không có đơn nào ở trạng thái này.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 max-md:flex-col">
            <div className={`flex flex-col gap-3 ${selectedApp ? "flex-[1.2]" : "flex-1"}`}>
              {filtered.map((app) => {
                const status = APP_STATUS_MAP[app.status] ?? APP_STATUS_MAP.PENDING;
                const isSelected = selectedApp?.id === app.id;
                const date = new Date(app.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric", month: "long", day: "numeric",
                });
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`rounded-xl p-4 bg-white cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm ${
                      isSelected ? "border-l-4 border-[#E6430A]" : "border border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                        <span>{app.clubEmoji}</span> {app.clubName}
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
                  {selectedApp.clubEmoji} {selectedApp.clubName}
                </p>
                <p className="text-[12px] text-slate-400 m-0 mb-4">Mã đơn #{selectedApp.id}</p>

                <div className="flex flex-col relative pl-6 border-l-2 border-slate-200">
                  <div className="relative pb-5">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_#10b981]" />
                    <p className="text-sm font-semibold text-slate-800 m-0">Đơn đã được nộp</p>
                    <p className="text-[13px] text-slate-500 mt-1 m-0">{selectedApp.introduction}</p>
                    <p className="text-[11px] text-slate-400 mt-1 m-0 flex items-center gap-1">
                      <Clock size={11} /> {new Date(selectedApp.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  {selectedApp.status === "PENDING" && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_0_2px_#2563eb]" />
                      <p className="text-sm font-semibold text-slate-800 m-0">Đang chờ CLB xét duyệt</p>
                      <p className="text-[13px] text-slate-500 mt-1 m-0">Ban tuyển dụng đang xem xét hồ sơ của bạn.</p>
                      <button
                        onClick={() => handleWithdraw(selectedApp.id)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-[1.5px] border-red-200 bg-white text-[12.5px] font-semibold text-red-600 cursor-pointer transition-colors hover:bg-red-50 font-[inherit]"
                      >
                        <RotateCcw size={13} /> Hủy đơn
                      </button>
                    </div>
                  )}

                  {selectedApp.status === "APPROVED" && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_#10b981]" />
                      <p className="text-sm font-semibold text-slate-800 m-0 flex items-center gap-1.5">
                        <CheckCircle size={14} color="#10b981" /> Đã được chấp nhận
                      </p>
                      {selectedApp.icpdpComment && (
                        <p className="mt-2 bg-slate-50 border-l-[3px] border-slate-300 rounded-r-lg px-3 py-2 text-[13px] text-slate-600 m-0">
                          "{selectedApp.icpdpComment}"
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1 m-0">
                        {selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleString("vi-VN") : ""}
                      </p>
                    </div>
                  )}

                  {selectedApp.status === "WITHDRAWN" && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-[0_0_0_2px_#9ca3af]" />
                      <p className="text-sm font-semibold text-slate-800 m-0">Bạn đã hủy đơn</p>
                      <p className="text-[13px] text-slate-500 mt-1 m-0">Đơn ứng tuyển này không còn được CLB xét duyệt.</p>
                      <p className="text-[11px] text-slate-400 mt-1 m-0">
                        {selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleString("vi-VN") : ""}
                      </p>
                    </div>
                  )}

                  {selectedApp.status === "REJECTED" && (
                    <div className="relative pb-1">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-[0_0_0_2px_#ef4444]" />
                      <p className="text-sm font-semibold text-slate-800 m-0 flex items-center gap-1.5">
                        <XCircle size={14} color="#ef4444" /> Bị từ chối
                      </p>
                      {selectedApp.icpdpComment && (
                        <p className="mt-2 bg-red-50 border-l-[3px] border-red-500 rounded-r-lg px-3 py-2 text-[13px] text-red-700 m-0">
                          Lý do: "{selectedApp.icpdpComment}"
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1 m-0">
                        {selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleString("vi-VN") : ""}
                      </p>
                    </div>
                  )}
                </div>

                {selectedApp.cvUrl && (
                  <a
                    href={selectedApp.cvUrl}
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
