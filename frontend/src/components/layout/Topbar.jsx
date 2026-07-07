import { useRef, useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
import { TYPE_META, relativeTime, resolveUserInfo } from "../../utils/notificationUtils";

// Map role → đường dẫn trang thông báo
const NOTIF_PATH = {
  MEMBER:       "/member/notifications",
  CLUB_LEADER:  "/club-leader/notifications",
  VICE_LEADER:  "/vice-leader/notifications",
  CLUB_MANAGER: "/manager/notifications",
  ICPDP:        "/icpdp/notifications",
};

/* ── Bell Popover ─────────────────────────────────────────────────── */

function BellPopover({ notifications, isRead, markRead, markAllRead, notifPath, onClose }) {
  const navigate   = useNavigate();
  const preview    = notifications.slice(0, 5);
  const unreadAll  = notifications.filter((n) => !isRead(n.id));

  const handleClick = (n) => {
    markRead(n.id);
    if (n.actionUrl) {
      onClose();
      navigate(n.actionUrl);
    }
  };

  const handleViewAll = () => {
    onClose();
    if (notifPath) navigate(notifPath);
  };

  return (
    <div
      className="absolute right-0 top-[calc(100%+10px)] w-[360px] bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-[#F0F0F0] z-[200] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
        <span className="text-[14px] font-bold text-gray-800">Thông báo</span>
        <div className="flex items-center gap-2">
          {unreadAll.length > 0 && (
            <button
              className="text-[12px] text-[#E6430A] font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0 font-[inherit]"
              onClick={markAllRead}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
          <button
            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 bg-transparent border-0 cursor-pointer transition-colors"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[340px] overflow-y-auto">
        {preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <Bell size={28} className="opacity-30" />
            <p className="text-[13px] m-0">Chưa có thông báo nào</p>
          </div>
        ) : (
          preview.map((n) => {
            const meta    = TYPE_META[n.type] ?? TYPE_META.general;
            const { Icon } = meta;
            const unread  = !isRead(n.id);
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-[#F9FAFB] transition-colors hover:bg-[#FFF8F5] ${unread ? "bg-[#FFF5F0]" : "bg-white"}`}
                onClick={() => handleClick(n)}
              >
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg} ${meta.iconColor}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold m-0 mb-0.5 leading-snug truncate ${unread ? "text-[#E6430A]" : "text-gray-700"}`}>
                    {n.title}
                  </p>
                  <p className="text-[12px] text-gray-500 m-0 leading-relaxed line-clamp-2">
                    {n.content}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 pt-0.5">
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {relativeTime(n.createdAt)}
                  </span>
                  {unread && (
                    <span className="w-2 h-2 rounded-full bg-[#E6430A] flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifPath && (
        <button
          className="w-full py-3 text-[13px] font-semibold text-[#E6430A] hover:bg-[#FFF5F0] transition-colors border-t border-[#F3F4F6] bg-transparent cursor-pointer font-[inherit]"
          onClick={handleViewAll}
        >
          Xem tất cả thông báo →
        </button>
      )}
    </div>
  );
}

/* ── Topbar ───────────────────────────────────────────────────────── */

export default function Topbar() {
  const { user }                                      = useAuth();
  const { role }                                      = resolveUserInfo(user);
  const { notifications, isRead, markRead, markAllRead, unreadCount } = useNotifications();
  const [open, setOpen]                               = useState(false);
  const bellRef                                       = useRef(null);
  const notifPath                                     = NOTIF_PATH[role] ?? null;
  const badgeCount                                    = Math.min(unreadCount, 99);

  // Đóng popover khi click ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <header className="h-[66.67px] bg-white border-b border-[#F0F0F0] flex items-center justify-end px-7 sticky top-0 z-50 shrink-0 gap-4">
      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            className={`w-[38px] h-[38px] rounded-[10px] border flex items-center justify-center cursor-pointer relative transition-[background,color,border-color] duration-150 ${
              open
                ? "bg-[#FFF3EE] border-[#FFD0BB] text-[#E6430A]"
                : "bg-transparent border-[#E5E7EB] text-[#6b7280] hover:bg-[#FFF3EE] hover:border-[#FFD0BB] hover:text-[#E6430A]"
            }`}
            aria-label="Thông báo"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell size={17} />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-[3px] rounded-full bg-[#E6430A] border-[1.5px] border-white text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </button>

          {open && (
            <BellPopover
              notifications={notifications}
              isRead={isRead}
              markRead={markRead}
              markAllRead={markAllRead}
              notifPath={notifPath}
              onClose={() => setOpen(false)}
            />
          )}
        </div>

      </div>
    </header>
  );
}
