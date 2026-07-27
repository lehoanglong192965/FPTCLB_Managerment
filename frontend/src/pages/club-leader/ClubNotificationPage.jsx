import { useState } from "react";
import { BellRing, Loader2, Send, Users } from "lucide-react";
import { useClubData } from "../../contexts/ClubDataContext";
import { useToast } from "../../contexts/ToastContext";
import { TokenService } from "../../services/api/axiosClient";
import clubNotificationApi from "../../services/api/club-leader/clubNotificationApi";

const TITLE_LIMIT = 255;
const CONTENT_LIMIT = 5000;

export default function ClubNotificationPage() {
  const toast = useToast();
  const { members, loading: membersLoading } = useClubData();
  const clubId = TokenService.getClubId();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const canSend = Boolean(clubId && title.trim() && content.trim() && !sending);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      const result = await clubNotificationApi.sendToMembers(clubId, {
        title: title.trim(), content: content.trim(),
      });
      toast.success(result?.recipientCount != null
        ? `Đã gửi thông báo đến ${result.recipientCount} thành viên câu lạc bộ.`
        : "Đã gửi thông báo đến các thành viên câu lạc bộ.");
      setTitle("");
      setContent("");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error ||
        "Không thể gửi thông báo. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="page-header">
        <h1 className="page-title">Gửi Thông Báo</h1>
        <p className="page-subtitle">Gửi thông tin quan trọng đến các thành viên đang hoạt động trong câu lạc bộ</p>
      </div>
      <div className="content-card overflow-hidden p-0">
        <div className="flex items-center gap-4 px-6 py-5 bg-orange-50 border-b border-orange-100">
          <div className="w-11 h-11 rounded-xl bg-[#F4511E] text-white flex items-center justify-center shrink-0"><BellRing size={22} /></div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-gray-900 m-0">Thông báo tới toàn bộ thành viên</h2>
            <div className="flex items-center gap-1.5 mt-1 text-[13px] text-gray-500">
              <Users size={14} />
              <span>{membersLoading ? "Đang tải danh sách..." : `${members.length} thành viên trong danh sách hiện tại`}</span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label htmlFor="notification-title" className="block text-[13px] font-semibold text-gray-700 mb-2">Tiêu đề <span className="text-red-500">*</span></label>
          <input id="notification-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_LIMIT}
            placeholder="Ví dụ: Thông báo lịch họp câu lạc bộ" disabled={sending} required
            className="w-full box-border rounded-lg border border-gray-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#F4511E] focus:ring-2 focus:ring-orange-100" />
          <p className="text-right text-[11px] text-gray-400 mt-1 mb-5">{title.length}/{TITLE_LIMIT}</p>
          <label htmlFor="notification-content" className="block text-[13px] font-semibold text-gray-700 mb-2">Nội dung thông báo <span className="text-red-500">*</span></label>
          <textarea id="notification-content" value={content} onChange={(e) => setContent(e.target.value)} maxLength={CONTENT_LIMIT}
            rows={9} placeholder="Nhập nội dung bạn muốn gửi đến các thành viên..." disabled={sending} required
            className="w-full box-border resize-y rounded-lg border border-gray-200 px-3.5 py-3 text-[14px] leading-6 outline-none focus:border-[#F4511E] focus:ring-2 focus:ring-orange-100" />
          <div className="flex justify-between gap-4 mt-1 mb-6 text-[11px] text-gray-400">
            <span>Thông báo sẽ xuất hiện tại biểu tượng chuông của thành viên.</span><span className="shrink-0">{content.length}/{CONTENT_LIMIT}</span>
          </div>
          {!clubId && <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600 mb-5">Không tìm thấy thông tin câu lạc bộ của tài khoản Leader.</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={!canSend} className="inline-flex items-center justify-center gap-2 min-w-[150px] rounded-lg border-none bg-[#F4511E] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#E6430A] disabled:cursor-not-allowed disabled:opacity-50">
              {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}{sending ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
