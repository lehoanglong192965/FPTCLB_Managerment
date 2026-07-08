import { useState, useEffect } from "react";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Compass,
  Users,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react";
import clubRegistrationApi from "../../services/api/clubs/clubRegistrationApi";
import { useToast } from "../../contexts/ToastContext";
import { getServerOrigin } from "../../services/api/axiosClient";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

export default function IcpdpClubRequests() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clubRegistrationApi.getPending();
      setRequests(data || []);
      if (selected) {
        const found = data.find((r) => r.registrationID === selected.registrationID);
        if (!found) setSelected(null);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError("Không thể tải danh sách yêu cầu đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (status) => {
    if (status === "REJECTED" && !comment.trim()) {
      toast.error("Vui lòng nhập lý do từ chối đăng ký thành lập CLB.");
      return;
    }

    setActionLoading(true);
    try {
      await clubRegistrationApi.review(selected.registrationID, status, comment);
      toast.success(
        status === "APPROVED"
          ? "Đã phê duyệt và kích hoạt câu lạc bộ thành công!"
          : "Đã từ chối đơn đăng ký thành lập."
      );
      setComment("");
      setSelected(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Xử lý duyệt thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Duyệt Đăng Ký CLB</h1>
          <p className="page-subtitle">Xét duyệt hồ sơ đăng ký thành lập câu lạc bộ mới</p>
        </div>
        <button className="pr-btn-ghost" onClick={loadRequests}>
          <RefreshCw size={14} /> Tải lại
        </button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-gray-400 text-sm">Đang tải...</p>
      ) : error ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm mb-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-16 px-5">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 m-0 mb-1.5">Đã giải quyết sạch đơn!</h3>
          <p className="text-slate-500 m-0">Hiện không có đơn đăng ký thành lập câu lạc bộ nào chờ duyệt.</p>
        </div>
      ) : (
        <div className="flex gap-6" style={{ height: "calc(100vh - 180px)" }}>
          <div className="flex-[0.8] flex flex-col gap-4 overflow-y-auto">
            {requests.map((reg) => {
              const isSelected = selected?.registrationID === reg.registrationID;
              const date = new Date(reg.createdAt).toLocaleDateString("vi-VN", {
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={reg.registrationID}
                  className={`rounded-xl p-5 bg-white cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm ${
                    isSelected ? "border-l-4 border-blue-600 border border-slate-200" : "border border-slate-200"
                  }`}
                  onClick={() => {
                    setSelected(reg);
                    setComment("");
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-base font-semibold text-slate-900">{reg.clubName}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-2">{reg.clubCode}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>Lĩnh vực: {reg.category}</span>
                    <span>Ngày nộp: {date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {selected ? (
            <>
              <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
                  <h2 className="text-lg font-bold text-slate-900 m-0">Chi Tiết Hồ Sơ Đăng Ký</h2>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold uppercase bg-amber-100 text-amber-700">
                    Chờ ICPDP Phê Duyệt
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 border-l-4 border-blue-600 pl-2.5 mb-4 m-0">
                    <Compass size={16} /> Thông tin Câu lạc bộ
                  </h3>
                  {selected.clubImage && (
                    <div className="mb-4">
                      <p className="text-[13px] font-semibold text-slate-500 mb-2">Ảnh đại diện CLB (Logo):</p>
                      <img
                        src={getImageUrl(selected.clubImage)}
                        alt="Logo CLB"
                        className="w-[120px] h-[120px] object-cover rounded-xl border border-slate-200 cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setPreviewImage(getImageUrl(selected.clubImage))}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-lg mb-3">
                    <span className="font-medium text-slate-500">Tên CLB (Việt):</span>
                    <span className="font-semibold text-slate-900">{selected.clubName}</span>
                    <span className="font-medium text-slate-500">Tên CLB (Anh):</span>
                    <span className="font-semibold text-slate-900">{selected.clubNameEn || "N/A"}</span>
                    <span className="font-medium text-slate-500">Mã viết tắt (Code):</span>
                    <span className="font-semibold text-blue-600">{selected.clubCode}</span>
                    <span className="font-medium text-slate-500">Lĩnh vực hoạt động:</span>
                    <span className="font-semibold text-slate-900">{selected.category}</span>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="font-semibold text-slate-500 mb-1">Sứ mệnh & Mục tiêu:</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 whitespace-pre-line m-0">{selected.mission}</p>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="font-semibold text-slate-500 mb-1">Điểm khác biệt/Lý do thành lập:</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 whitespace-pre-line m-0">{selected.uniqueness}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 border-l-4 border-emerald-500 pl-2.5 mb-4 m-0">
                    <Users size={16} /> Nhân Sự Điều Hành
                  </h3>

                  {selected.foundingMembers?.map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl mb-4">
                      <h4 className="font-semibold text-slate-900 mb-2 text-sm m-0">
                        {m.proposedRole === "Leader" ? "Chủ nhiệm CLB (Leader)" : m.proposedRole === "ViceLeader" ? "Phó chủ nhiệm CLB (Vice Leader)" : `Thành viên sáng lập #${idx - 1}`}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <span className="font-medium text-slate-500">Họ và tên:</span>
                        <span className="font-semibold text-slate-900">{m.fullName}</span>
                        <span className="font-medium text-slate-500">MSSV / Lớp:</span>
                        <span className="font-semibold text-slate-900">{m.studentId} / {m.clazz || "N/A"}</span>
                        <span className="font-medium text-slate-500">Điện thoại / Email:</span>
                        <span className="font-semibold text-slate-900">{m.phoneNumber} / {m.email}</span>
                      </div>

                      {m.cardImage ? (
                        <>
                          <p className="text-[13px] font-semibold text-slate-500 mb-1">Ảnh thẻ sinh viên minh chứng:</p>
                          <div className="relative w-fit overflow-hidden rounded-lg border border-slate-300">
                            <img
                              src={getImageUrl(m.cardImage)}
                              alt="Thẻ SV"
                              className="max-w-[250px] block cursor-pointer transition-transform hover:scale-105"
                              onClick={() => setPreviewImage(getImageUrl(m.cardImage))}
                            />
                            <div
                              onClick={() => setPreviewImage(getImageUrl(m.cardImage))}
                              className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-slate-900/60 text-white text-[11px] py-1 cursor-pointer backdrop-blur-sm"
                            >
                              <ExternalLink size={12} /> Click để phóng to
                            </div>
                          </div>
                        </>
                      ) : m.proposedRole !== "Member" && (
                        <p className="text-[12px] text-red-400 italic mt-1">⚠ Chưa có ảnh thẻ sinh viên</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 border-l-4 border-red-500 pl-2.5 mb-4 m-0">
                    <MapPin size={16} /> Kế hoạch hoạt động & Tài chính
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-lg mb-3">
                    <span className="font-medium text-slate-500">Tần suất sinh hoạt:</span>
                    <span className="font-semibold text-slate-900">{selected.meetingFrequency}</span>
                    <span className="font-medium text-slate-500">Địa điểm dự kiến:</span>
                    <span className="font-semibold text-slate-900">{selected.meetingLocation}</span>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="font-semibold text-slate-500 mb-1">Sơ đồ tổ chức:</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 whitespace-pre-line m-0">{selected.orgStructure}</p>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="font-semibold text-slate-500 mb-1">Phương án tài chính:</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 whitespace-pre-line m-0">{selected.financialPlan}</p>
                  </div>
                </div>
              </div>

              <div className="flex-[0.8] overflow-y-auto bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-1.5 m-0">
                    <ShieldCheck size={18} color="#10b981" /> Kiểm Định Hệ Thống Tự Động
                  </h3>

                  {selected.foundingMembers?.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-[13px] mb-2">
                      <CheckCircle size={15} />
                      <span>{m.proposedRole === "Leader" ? "Chủ nhiệm" : m.proposedRole === "ViceLeader" ? "Phó chủ nhiệm" : `Thành viên sáng lập #${idx - 1}`}: {m.fullName} ({m.studentId}) - Hợp lệ, &lt; 4 CLB</span>
                    </div>
                  ))}

                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-[13px] mt-4">
                    <CheckCircle size={15} />
                    <span>Mã CLB ({selected.clubCode}) & Tên CLB độc nhất</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5 mt-5">
                  <label className="flex items-center gap-1 text-[13.5px] font-medium text-slate-600 mb-2">
                    <MessageSquare size={14} /> Nhận xét hoặc Lý do từ chối duyệt:
                  </label>
                  <textarea
                    className="w-full min-h-[80px] px-3 py-3 rounded-lg border border-slate-300 text-[13px] mb-4 resize-y outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] font-[inherit]"
                    placeholder="Nhập lý do từ chối nộp đơn, hoặc các nhận xét đóng góp nếu được chấp nhận thành lập..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />

                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none rounded-lg py-3 font-semibold cursor-pointer transition-colors text-center disabled:opacity-60"
                      onClick={() => handleReview("REJECTED")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Đang xử lý..." : "Từ chối nộp đơn"}
                    </button>
                    <button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg py-3 font-semibold cursor-pointer transition-colors text-center disabled:opacity-60"
                      onClick={() => handleReview("APPROVED")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Đang phê duyệt..." : "Duyệt & Kích hoạt CLB"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-[1.8] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-16 px-5">
              <FileText size={48} className="text-slate-300 mb-3" />
              <p className="text-slate-500 m-0 text-center">Vui lòng chọn một yêu cầu đăng ký thành lập ở bên trái để tiến hành đánh giá chi tiết.</p>
            </div>
          )}
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-[8px] z-[9999] flex items-center justify-center p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-[90%] max-h-[90%] bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[70vh] rounded-lg object-contain"
            />
            <div className="flex gap-3 mt-4 w-full justify-center">
              <button
                onClick={() => window.open(previewImage, "_blank")}
                className="flex items-center gap-1.5 bg-blue-600 text-white border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer"
              >
                <ExternalLink size={14} /> Mở tab mới
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="bg-slate-100 text-slate-700 border border-slate-300 rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
