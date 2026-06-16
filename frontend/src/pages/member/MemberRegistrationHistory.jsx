import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle2, XCircle, ChevronRight, AlertCircle, FileText, User } from "lucide-react";
import clubRegistrationApi from "../../services/api/clubs/clubRegistrationApi";

const STATUS_MAP = {
  PENDING:  { label: "Chờ duyệt",      cls: "pending"  },
  APPROVED: { label: "Đã kích hoạt",   cls: "approved" },
  REJECTED: { label: "Bị từ chối",     cls: "rejected" },
};

const STATUS_STYLES = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-500",
};

export default function MemberRegistrationHistory() {
  const [registrations, setRegistrations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMyRegistrations = async () => {
    setLoading(true);
    try {
      const data = await clubRegistrationApi.getMyRegistrations();
      setRegistrations(data || []);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError("Không thể tải danh sách đơn đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRegistrations();
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-2.5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1B3E] m-0 mb-1">Lịch Sử Thành Lập CLB</h1>
        <p className="text-sm text-[#4B5674] m-0">Xem trạng thái phê duyệt các đơn đề xuất thành lập câu lạc bộ của bạn</p>
      </div>

      {loading ? (
        <p className="text-center py-10 text-gray-400 text-sm">Đang tải...</p>
      ) : error ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm mb-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 m-0">Bạn chưa có đơn đề xuất thành lập câu lạc bộ nào.</p>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className={`flex flex-col gap-4 ${selected ? "flex-[1.2]" : "flex-1"}`}>
            {registrations.map((reg) => {
              const status = STATUS_MAP[reg.status] || STATUS_MAP.PENDING;
              const isSelected = selected?.registrationID === reg.registrationID;
              const date = new Date(reg.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <div
                  key={reg.registrationID}
                  className={`rounded-xl p-5 bg-white cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm ${
                    isSelected ? "border-l-4 border-blue-600" : "border border-slate-200"
                  }`}
                  onClick={() => setSelected(reg)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-base font-semibold text-slate-900">{reg.clubName}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-2">{reg.clubCode}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLES[status.cls]}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={13} /> {date}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> Lĩnh vực: {reg.category}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 self-start p-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3.5 mb-5">
                <h3 className="text-base font-bold text-slate-900 m-0">Chi Tiết Đơn Đăng Ký</h3>
                <button
                  className="bg-none border-none text-slate-500 cursor-pointer text-sm"
                  onClick={() => setSelected(null)}
                >
                  Đóng
                </button>
              </div>

              <div className="flex flex-col relative pl-6 mt-5 border-l-2 border-slate-200">
                <div className="relative pb-5">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_#10b981]" />
                  <p className="text-sm font-semibold text-slate-800 m-0">Đơn đã được nộp</p>
                  <p className="text-[13px] text-slate-500 mt-1 m-0">
                    Sinh viên **{selected.creatorName || "Thành viên"}** đã gửi đơn đề xuất thành lập câu lạc bộ.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 m-0">
                    {new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                {selected.status === "PENDING" ? (
                  <div className="relative pb-5">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_0_2px_#2563eb]" />
                    <p className="text-sm font-semibold text-slate-800 m-0">Đang chờ ICPDP kiểm định</p>
                    <p className="text-[13px] text-slate-500 mt-1 m-0">
                      Cán bộ ban cá nhân ICPDP đang đối chiếu thông tin nhân sự và cơ cấu kế hoạch.
                    </p>
                  </div>
                ) : selected.status === "APPROVED" ? (
                  <div className="relative pb-5">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_#10b981]" />
                    <p className="text-sm font-semibold text-slate-800 m-0">ICPDP đã phê duyệt & kích hoạt</p>
                    <p className="text-[13px] text-slate-500 mt-1 m-0">
                      Đơn đăng ký được duyệt thông qua. Câu lạc bộ **{selected.clubName}** chính thức hoạt động trên hệ thống.
                    </p>
                    {selected.icpdpComment && (
                      <p className="mt-2 bg-slate-50 border-l-[3px] border-slate-300 rounded-r-lg px-3 py-2 text-[13px] text-slate-600 m-0">
                        Góp ý từ ICPDP: "{selected.icpdpComment}"
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1 m-0">
                      {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("vi-VN") : ""}
                    </p>
                  </div>
                ) : (
                  <div className="relative pb-5">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-[0_0_0_2px_#ef4444]" />
                    <p className="text-sm font-semibold text-slate-800 m-0">Đơn bị ICPDP từ chối</p>
                    <p className="text-[13px] text-slate-500 mt-1 m-0">
                      Yêu cầu thành lập không được phê duyệt.
                    </p>
                    {selected.icpdpComment && (
                      <p className="mt-2 bg-red-50 border-l-[3px] border-red-500 rounded-r-lg px-3 py-2 text-[13px] text-red-700 m-0">
                        Lý do từ chối: "{selected.icpdpComment}"
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1 m-0">
                      {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("vi-VN") : ""}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h4 className="text-[13px] font-semibold text-slate-500 mb-3">Nhân sự ban sáng lập</h4>
                <div className="flex flex-col gap-2 text-[13px]">
                  {selected.foundingMembers?.map((m, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-slate-500">
                        {m.proposedRole === "Leader" ? "Chủ nhiệm (Leader)" : m.proposedRole === "ViceLeader" ? "Phó chủ nhiệm (Vice Leader)" : `Thành viên #${idx - 1}`}
                      </span>
                      <span className="font-semibold text-slate-800">{m.fullName} ({m.studentId})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
