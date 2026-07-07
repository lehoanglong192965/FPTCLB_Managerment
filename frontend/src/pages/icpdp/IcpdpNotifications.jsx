import { useState } from "react";
import { Send } from "lucide-react";
import icpdpNotificationApi from "../../services/api/icpdp/icpdpBroadcastApi";
import { useToast } from "../../contexts/ToastContext";

const AUDIENCE_OPTIONS = [
  { value: "all_members",   label: "Toàn bộ sinh viên tham gia CLB" },
  { value: "all_leaders",   label: "Toàn bộ Trưởng CLB" },
  { value: "all_clubs",     label: "Toàn bộ Ban điều hành CLB" },
  { value: "all_students",  label: "Toàn bộ sinh viên hệ thống" },
];

const TYPE_OPTIONS = [
  { value: "general",    label: "Thông báo chung" },
  { value: "urgent",     label: "Thông báo khẩn" },
  { value: "deadline",   label: "Nhắc hạn nộp" },
  { value: "event",      label: "Thông báo sự kiện" },
];

const INITIAL = { audience: "all_members", type: "general", title: "", content: "" };

export default function IcpdpNotifications() {
  const toast = useToast();
  const [form, setForm]     = useState(INITIAL);
  const [sending, setSending] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }
    setSending(true);
    try {
      await icpdpNotificationApi.broadcast(form);
      toast.success("Thông báo đã được phát sóng thành công!");
      setForm(INITIAL);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="page-header text-center w-full">
        <h1 className="page-title">Thông Báo Toàn Hệ Thống</h1>
      </div>

      <div className="bg-white rounded-xl px-8 py-7 shadow-sm max-w-[720px] w-full">
        <p className="text-base font-semibold text-gray-900 m-0 mb-5">Soạn thông báo IC-PDP</p>

        <div className="grid grid-cols-2 gap-4 mb-4.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13.5px] font-medium text-gray-700">Nhóm đối tượng</label>
            <select
              className={inputCls + " appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center] pr-9 cursor-pointer"}
              value={form.audience}
              onChange={set("audience")}
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13.5px] font-medium text-gray-700">Loại thông báo</label>
            <select
              className={inputCls + " appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center] pr-9 cursor-pointer"}
              value={form.type}
              onChange={set("type")}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-4.5">
          <label className="text-[13.5px] font-medium text-gray-700">Tiêu đề</label>
          <input
            className={inputCls}
            type="text"
            placeholder="VD: Hướng dẫn quy trình nộp kế hoạch học kỳ"
            value={form.title}
            onChange={set("title")}
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-4.5">
          <label className="text-[13.5px] font-medium text-gray-700">Nội dung</label>
          <textarea
            className={inputCls + " resize-y min-h-[120px] font-[inherit]"}
            placeholder="Nội dung thông báo..."
            value={form.content}
            onChange={set("content")}
          />
        </div>

        <div className="flex justify-end mt-2">
          <button
            className="flex items-center gap-2 px-5.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] disabled:bg-[#f3a07a] disabled:cursor-not-allowed text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
            onClick={handleBroadcast}
            disabled={sending}
          >
            <Send size={16} />
            {sending ? "Đang gửi..." : "Phát sóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
