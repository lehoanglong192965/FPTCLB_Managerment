import { useState } from "react";
import { CalendarDays, Clock, Send, CheckCircle2 } from "lucide-react";

const TYPE_META = {
  event:    { icon: CalendarDays, iconBg: "bg-blue-50 text-blue-600",   tagBg: "bg-blue-600 text-white",   tagLabel: "Sự kiện"   },
  deadline: { icon: Clock,        iconBg: "bg-rose-50 text-rose-600",   tagBg: "bg-rose-600 text-white",   tagLabel: "Hạn chót"  },
  recruit:  { icon: Send,         iconBg: "bg-orange-50 text-orange-600", tagBg: "bg-orange-600 text-white", tagLabel: "Tuyển dụng" },
};

const initialNotifications = [
  { id: 1, type: "event",    title: 'Đề xuất sự kiện được phê duyệt',      desc: 'IC-PDP đã phê duyệt đề xuất "Code War 2026". Sự kiện chính thức được tổ chức.', time: "17:00 28 thg 6", unread: true  },
  { id: 2, type: "deadline", title: "Deadline nộp báo cáo",                 desc: 'Vui lòng nộp báo cáo tổng kết "Acoustic Night" trước 27/05.',                    time: "15:00 24 thg 5", unread: true  },
  { id: 3, type: "event",    title: "Đề xuất bị từ chối — cần chỉnh sửa",  desc: 'IC-PDP từ chối đề xuất "Gen Z Hackathon". Xem phản hồi và chỉnh sửa lại.',      time: "16:00 10 thg 6", unread: true  },
  { id: 4, type: "recruit",  title: "Mở đơn tuyển thành viên",              desc: "IT Club chính thức mở đơn tuyển gen 13.",                                        time: "16:00 1 thg 6",  unread: false },
  { id: 5, type: "deadline", title: "Gia hạn thành viên kỳ SU26",           desc: "Vui lòng xác nhận tham gia tiếp kỳ Summer 2026 trước ngày 31/05.",               time: "15:00 20 thg 5", unread: true  },
];

export default function MemberNotifications() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => n.unread).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function markRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title mb-0.5">Thông Báo</h1>
          <p className="page-subtitle m-0">
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        <button
          className="flex items-center gap-[7px] px-[18px] py-[9px] rounded-[10px] border-[1.5px] border-gray-300 bg-white text-[13.5px] font-medium text-gray-700 cursor-pointer whitespace-nowrap flex-shrink-0 transition-all hover:border-[#e6430a] hover:text-[#e6430a] font-[inherit]"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCircle2 size={16} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2.5">
        {notifications.map((notif) => {
          const meta = TYPE_META[notif.type];
          const Icon = meta.icon;
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-3.5 px-[18px] py-4 rounded-[14px] border-[1.5px] cursor-pointer transition-all hover:border-[#e6430a55] hover:shadow-[0_2px_8px_rgba(230,67,10,0.07)] ${
                notif.unread
                  ? "bg-[#fff5f0] border-[#fde0d0]"
                  : "bg-white border-[#f0f0f0]"
              }`}
              onClick={() => markRead(notif.id)}
            >
              <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-px ${meta.iconBg}`}>
                <Icon size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold m-0 mb-1 leading-[1.4] ${notif.unread ? "text-[#e6430a]" : "text-gray-700"}`}>
                  {notif.title}
                </p>
                <p className="text-[13px] text-gray-500 m-0 mb-2.5 leading-relaxed">{notif.desc}</p>
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${meta.tagBg}`}>
                  {meta.tagLabel}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-xs text-gray-400 whitespace-nowrap">{notif.time}</span>
                {notif.unread && (
                  <span className="w-[9px] h-[9px] rounded-full bg-[#e6430a]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
