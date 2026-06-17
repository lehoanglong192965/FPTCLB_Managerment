import { useState } from "react";
import { ClipboardList, Calendar, FileText, CheckCircle, XCircle, Clock, Inbox, User, Mail } from "lucide-react";

const STATUS_MAP = {
  PENDING:  { label: "Chờ duyệt",  cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Đã duyệt",   cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Từ chối",    cls: "bg-red-100 text-red-500" },
};

const FILTER_TABS = [
  { key: "ALL",      label: "Tất cả" },
  { key: "PENDING",  label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" },
];

const MOCK_APPLICATIONS = [
  {
    id: 1001,
    memberName: "Nguyễn Minh Khoa",
    memberEmail: "khoaNM@fpt.edu.vn",
    studentId: "SE180123",
    introduction: "Em đam mê lĩnh vực này và đã có kinh nghiệm 2 năm hoạt động ngoại khóa. Em muốn đóng góp cho sự phát triển của CLB và học hỏi thêm từ các anh chị.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-khoa",
    status: "PENDING",
    createdAt: "2026-06-15T09:30:00",
    updatedAt: null,
    note: "",
  },
  {
    id: 1002,
    memberName: "Trần Thị Lan Anh",
    memberEmail: "anhTTL@fpt.edu.vn",
    studentId: "SE180456",
    introduction: "Em đã theo dõi hoạt động của CLB từ lâu và rất ngưỡng mộ những gì CLB đã làm được. Em muốn được trở thành một phần của đội ngũ và cùng nhau xây dựng những dự án ý nghĩa.",
    cvUrl: "",
    status: "PENDING",
    createdAt: "2026-06-14T14:20:00",
    updatedAt: null,
    note: "",
  },
  {
    id: 1003,
    memberName: "Phạm Quốc Bảo",
    memberEmail: "baoPQ@fpt.edu.vn",
    studentId: "SE180789",
    introduction: "Em có nền tảng vững chắc trong lĩnh vực liên quan và muốn áp dụng kỹ năng của mình để phục vụ cộng đồng CLB.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-bao",
    status: "APPROVED",
    createdAt: "2026-06-10T10:00:00",
    updatedAt: "2026-06-12T08:30:00",
    note: "Hồ sơ tốt, chào mừng bạn gia nhập CLB!",
  },
  {
    id: 1004,
    memberName: "Lê Ngọc Hương",
    memberEmail: "huongLN@fpt.edu.vn",
    studentId: "SE181011",
    introduction: "Em là sinh viên năm 2, rất năng động và nhiệt tình. Em muốn tham gia CLB để mở rộng mạng lưới quan hệ và phát triển kỹ năng mềm.",
    cvUrl: "",
    status: "REJECTED",
    createdAt: "2026-06-08T16:45:00",
    updatedAt: "2026-06-11T11:00:00",
    note: "CLB hiện đã đủ chỉ tiêu thành viên cho học kỳ này. Mời bạn đăng ký lại vào học kỳ sau.",
  },
  {
    id: 1005,
    memberName: "Vũ Đức Thắng",
    memberEmail: "thangVD@fpt.edu.vn",
    studentId: "SE181234",
    introduction: "Em từng tham gia nhiều hoạt động xã hội và mong muốn tiếp tục phát triển bản thân thông qua môi trường CLB chuyên nghiệp.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-thang",
    status: "PENDING",
    createdAt: "2026-06-16T08:00:00",
    updatedAt: null,
    note: "",
  },
];

function Avatar({ name }) {
  return (
    <div style={{
      width: 42, height: 42, borderRadius: "50%",
      background: "#FFF3EE", color: "#E6430A",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 16, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export default function ClubApplicationsMgmt() {
  const [apps, setApps]                 = useState(MOCK_APPLICATIONS);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selected, setSelected]         = useState(null);
  const [confirmMode, setConfirmMode]   = useState(null); // null | "APPROVE" | "REJECT"
  const [approveNote, setApproveNote]   = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError]   = useState("");
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelect = (app) => {
    setSelected(app);
    setConfirmMode(null);
    setApproveNote("");
    setRejectReason("");
    setRejectError("");
  };

  const openConfirm = (mode) => {
    setConfirmMode(mode);
    setApproveNote("");
    setRejectReason("");
    setRejectError("");
  };

  const cancelConfirm = () => {
    setConfirmMode(null);
    setRejectError("");
  };

  const commitDecision = (decision) => {
    if (decision === "REJECTED" && !rejectReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }
    const note = decision === "APPROVED" ? approveNote : rejectReason;
    const now  = new Date().toISOString();
    setApps((prev) =>
      prev.map((a) =>
        a.id === selected.id ? { ...a, status: decision, updatedAt: now, note } : a
      )
    );
    setSelected((prev) => ({ ...prev, status: decision, updatedAt: now, note }));
    setConfirmMode(null);
    showToast(decision === "APPROVED" ? "Đã chấp nhận đơn ứng tuyển." : "Đã từ chối đơn ứng tuyển.");
  };

  const pendingCount = apps.filter((a) => a.status === "PENDING").length;
  const filtered = apps.filter((a) => activeFilter === "ALL" || a.status === activeFilter);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Đơn Ứng Tuyển</h1>
        <p className="page-subtitle">Xét duyệt các đơn xin tham gia câu lạc bộ từ sinh viên</p>
      </div>

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="content-card">
        <div className="flex justify-between items-center mb-4">
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            {apps.length} đơn tổng cộng
            {pendingCount > 0 && (
              <span style={{
                marginLeft: 8, padding: "2px 8px", borderRadius: 99,
                background: "#FFF3EE", color: "#E6430A", fontSize: 12, fontWeight: 700,
              }}>
                {pendingCount} chờ duyệt
              </span>
            )}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveFilter(tab.key); setSelected(null); }}
              className={`px-3.5 py-1.5 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-all font-[inherit] ${
                activeFilter === tab.key
                  ? "bg-[#E6430A] border-[#E6430A] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#E6430A] hover:text-[#E6430A]"
              }`}
            >
              {tab.label}
              {tab.key === "PENDING" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#E6430A] text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <Inbox size={40} strokeWidth={1.2} color="#d1d5db" />
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: "0.75rem" }}>
              Không có đơn ứng tuyển nào ở trạng thái này.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 max-md:flex-col">
            {/* List */}
            <div className={`flex flex-col gap-3 ${selected ? "flex-[1.2]" : "flex-1"}`}>
              {filtered.map((app) => {
                const status = STATUS_MAP[app.status] ?? STATUS_MAP.PENDING;
                const isSelected = selected?.id === app.id;
                const date = new Date(app.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric", month: "long", day: "numeric",
                });
                return (
                  <div
                    key={app.id}
                    onClick={() => handleSelect(app)}
                    className={`rounded-xl p-4 bg-white cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm ${
                      isSelected ? "border-l-4 border-[#E6430A] shadow-sm" : "border border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={app.memberName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[14px] font-semibold text-slate-900 m-0 truncate">
                            {app.memberName}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-[11px] font-semibold uppercase shrink-0 ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-400 m-0 mt-0.5">{app.studentId}</p>
                        <p className="text-[12.5px] text-slate-500 m-0 mt-1.5 line-clamp-2">
                          {app.introduction}
                        </p>
                        <span className="flex items-center gap-1 text-[11.5px] text-slate-400 mt-2">
                          <Calendar size={12} /> Nộp ngày {date}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="flex-1 self-start bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                  <h4 className="text-[14px] font-bold text-slate-900 m-0">Chi tiết đơn ứng tuyển</h4>
                  <button
                    className="bg-none border-none text-slate-500 cursor-pointer text-sm font-[inherit] hover:text-slate-700"
                    onClick={() => setSelected(null)}
                  >
                    Đóng
                  </button>
                </div>

                {/* Member info */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={selected.memberName} />
                  <div>
                    <p className="text-[15px] font-bold text-slate-900 m-0">{selected.memberName}</p>
                    <p className="text-[12px] text-slate-400 m-0 flex items-center gap-1 mt-0.5">
                      <Mail size={11} /> {selected.memberEmail}
                    </p>
                    <p className="text-[12px] text-slate-400 m-0 flex items-center gap-1 mt-0.5">
                      <User size={11} /> MSSV: {selected.studentId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${STATUS_MAP[selected.status]?.cls}`}>
                    {STATUS_MAP[selected.status]?.label}
                  </span>
                  <span className="text-[11.5px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>

                {/* Introduction */}
                <div className="mb-4">
                  <p className="text-[12.5px] font-semibold text-slate-600 mb-1.5">Giới thiệu bản thân</p>
                  <p className="text-[13px] text-slate-700 bg-slate-50 rounded-xl p-3 m-0 leading-relaxed">
                    {selected.introduction}
                  </p>
                </div>

                {/* CV link */}
                {selected.cvUrl && (
                  <a
                    href={selected.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#E6430A] no-underline hover:underline mb-4 block"
                  >
                    <FileText size={14} /> Xem CV / Portfolio
                  </a>
                )}

                {/* Actions / result */}
                {selected.status === "PENDING" && (
                  <div className="border-t border-slate-100 pt-4">
                    {confirmMode === null && (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => openConfirm("APPROVE")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] transition-opacity hover:opacity-90"
                          style={{ background: "#10b981" }}
                        >
                          <CheckCircle size={14} /> Chấp nhận
                        </button>
                        <button
                          onClick={() => openConfirm("REJECT")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-red-200 bg-white text-red-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-red-50"
                        >
                          <XCircle size={14} /> Từ chối
                        </button>
                      </div>
                    )}

                    {confirmMode === "APPROVE" && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[13px] font-semibold text-emerald-800 m-0 mb-3 flex items-center gap-1.5">
                          <CheckCircle size={14} /> Xác nhận chấp nhận đơn này?
                        </p>
                        <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                          Lời nhắn gửi ứng viên <span className="font-normal text-slate-400">(tuỳ chọn)</span>
                        </label>
                        <textarea
                          value={approveNote}
                          onChange={(e) => setApproveNote(e.target.value)}
                          rows={2}
                          placeholder="VD: Chào mừng bạn gia nhập CLB!"
                          style={{
                            width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
                            border: "1.5px solid #a7f3d0", fontSize: 13, outline: "none",
                            boxSizing: "border-box", fontFamily: "inherit", resize: "vertical",
                            background: "#fff",
                          }}
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => commitDecision("APPROVED")}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit]"
                            style={{ background: "#10b981" }}
                          >
                            <CheckCircle size={13} /> Xác nhận duyệt
                          </button>
                          <button
                            onClick={cancelConfirm}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-slate-50"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {confirmMode === "REJECT" && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-[13px] font-semibold text-red-700 m-0 mb-3 flex items-center gap-1.5">
                          <XCircle size={14} /> Từ chối đơn ứng tuyển
                        </p>
                        <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                          Lý do từ chối <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
                          rows={3}
                          placeholder="Nhập lý do từ chối để thông báo cho ứng viên..."
                          style={{
                            width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
                            border: `1.5px solid ${rejectError ? "#ef4444" : "#fca5a5"}`,
                            fontSize: 13, outline: "none",
                            boxSizing: "border-box", fontFamily: "inherit", resize: "vertical",
                            background: "#fff",
                          }}
                        />
                        {rejectError && (
                          <p className="text-[12px] text-red-500 mt-1 m-0">{rejectError}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => commitDecision("REJECTED")}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit]"
                            style={{ background: "#ef4444" }}
                          >
                            <XCircle size={13} /> Xác nhận từ chối
                          </button>
                          <button
                            onClick={cancelConfirm}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-slate-50"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selected.status !== "PENDING" && selected.note && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[12.5px] font-semibold text-slate-600 mb-1.5">Phản hồi của CLB</p>
                    <p className={`text-[13px] rounded-xl px-3 py-2 m-0 leading-relaxed border-l-[3px] ${
                      selected.status === "APPROVED"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                        : "bg-red-50 border-red-400 text-red-800"
                    }`}>
                      "{selected.note}"
                    </p>
                    {selected.updatedAt && (
                      <p className="text-[11px] text-slate-400 mt-1.5 m-0">
                        {new Date(selected.updatedAt).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
