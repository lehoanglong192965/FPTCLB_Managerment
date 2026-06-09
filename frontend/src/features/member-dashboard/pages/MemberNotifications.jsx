import { useState } from "react";
import { CalendarDays, Clock, Send, CheckCircle2 } from "lucide-react";
import "../../../assets/css/memberNotifications.css";

const TYPE_META = {
  event:    { icon: CalendarDays, iconClass: "event",    tagClass: "event",    tagLabel: "Sự kiện"   },
  deadline: { icon: Clock,        iconClass: "deadline",  tagClass: "deadline", tagLabel: "Hạn chót"  },
  recruit:  { icon: Send,         iconClass: "recruit",   tagClass: "recruit",  tagLabel: "Tuyển dụng" },
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
      <div className="mn-header">
        <div className="mn-header-left">
          <h1 className="page-title">Thông Báo</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        <button className="mn-mark-all-btn" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCircle2 size={16} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* List */}
      <div className="mn-list">
        {notifications.map((notif) => {
          const meta = TYPE_META[notif.type];
          const Icon = meta.icon;
          return (
            <div
              key={notif.id}
              className={`mn-item ${notif.unread ? "unread" : "read"}`}
              onClick={() => markRead(notif.id)}
            >
              <div className={`mn-icon-wrap ${meta.iconClass}`}>
                <Icon size={18} />
              </div>

              <div className="mn-content">
                <p className="mn-title">{notif.title}</p>
                <p className="mn-desc">{notif.desc}</p>
                <span className={`mn-tag ${meta.tagClass}`}>{meta.tagLabel}</span>
              </div>

              <div className="mn-right">
                <span className="mn-time">{notif.time}</span>
                {notif.unread && <span className="mn-dot" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
