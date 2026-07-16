import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, CheckCircle2, Settings, ArrowRight } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationsContext";
import { TYPE_META, relativeTime } from "../../utils/notificationUtils";

const FILTER_TABS = [
  { key: "all",    label: "Tất cả"   },
  { key: "unread", label: "Chưa đọc" },
];


function dateGroup(dateStr) {
  const d       = new Date(dateStr);
  const today   = new Date();
  const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const itemMs  = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffD   = Math.round((todayMs - itemMs) / 86400000);
  if (diffD === 0) return "Hôm nay";
  if (diffD === 1) return "Hôm qua";
  if (diffD <  7) return "Tuần này";
  return "Cũ hơn";
}

const GROUP_ORDER = ["Hôm nay", "Hôm qua", "Tuần này", "Cũ hơn"];

/* ── Main Component ──────────────────────────────────────────────── */

export default function MemberNotifications() {
  const navigate                                              = useNavigate();
  const location                                              = useLocation();
  const { notifications, isRead, markRead, markAllRead, unreadCount } = useNotifications();
  const [activeFilter, setActiveFilter]                       = useState("all");

  // Trang dùng chung cho member/club-leader/vice-leader — lấy base path theo role hiện tại
  // để nút "Cài đặt" trỏ đúng /member|/club-leader|/vice-leader + /notification-settings.
  const basePath = "/" + (location.pathname.split("/")[1] || "member");

  // Áp dụng filter
  const filtered = useMemo(() => {
    if (activeFilter === "unread") return notifications.filter((n) => !isRead(n.id));
    return notifications;
  }, [notifications, activeFilter, isRead]);

  // Nhóm theo ngày
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((n) => {
      const g = dateGroup(n.createdAt);
      if (!map[g]) map[g] = [];
      map[g].push(n);
    });
    return GROUP_ORDER.filter((g) => map[g]).map((g) => ({ group: g, items: map[g] }));
  }, [filtered]);

  const handleClick = (n) => {
    markRead(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="page-title mb-0.5">Thông Báo</h1>
          <p className="page-subtitle m-0">
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="flex items-center gap-[7px] px-[14px] py-[9px] rounded-[10px] border-[1.5px] border-gray-300 bg-white text-[13px] font-medium text-gray-600 cursor-pointer transition-all hover:border-[#e6430a] hover:text-[#e6430a] font-[inherit] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 size={15} />
            Đánh dấu tất cả đã đọc
          </button>
          <button
            className="flex items-center gap-[7px] px-[14px] py-[9px] rounded-[10px] border-[1.5px] border-gray-300 bg-white text-[13px] font-medium text-gray-600 cursor-pointer transition-all hover:border-[#e6430a] hover:text-[#e6430a] font-[inherit]"
            onClick={() => navigate(`${basePath}/notification-settings`)}
            title="Cài đặt thông báo"
          >
            <Settings size={15} />
            Cài đặt
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.key;
          // Số badge cho tab "Chưa đọc"
          const badge = tab.key === "unread" ? unreadCount : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-[9px] text-[13px] font-semibold whitespace-nowrap border transition-all cursor-pointer font-[inherit] flex-shrink-0 ${
                active
                  ? "bg-[#E6430A] text-white border-[#E6430A]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#E6430A] hover:text-[#E6430A]"
              }`}
            >
              {tab.label}
              {badge != null && badge > 0 && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${active ? "bg-white text-[#E6430A]" : "bg-[#E6430A] text-white"}`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Bell size={36} className="opacity-25 mb-3" />
          <p className="text-[14px] font-medium text-gray-500 m-0 mb-1">Không có thông báo</p>
          <p className="text-[13px] text-gray-400 m-0">
            {activeFilter !== "all" ? "Thử chuyển sang tab khác" : "Chưa có thông báo nào"}
          </p>
        </div>
      )}

      {/* Grouped list */}
      <div className="flex flex-col gap-6">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            {/* Date group header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {group}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2.5">
              {items.map((n) => {
                const meta  = TYPE_META[n.type] ?? TYPE_META.general;
                const { Icon } = meta;
                const unread = !isRead(n.id);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3.5 px-[18px] py-4 rounded-[14px] border-[1.5px] cursor-pointer transition-all hover:border-[#e6430a55] hover:shadow-[0_2px_8px_rgba(230,67,10,0.07)] ${
                      unread ? "bg-[#fff5f0] border-[#fde0d0]" : "bg-white border-[#f0f0f0]"
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    {/* Icon */}
                    <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-px ${meta.iconBg} ${meta.iconColor}`}>
                      <Icon size={18} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold m-0 mb-1 leading-snug ${unread ? "text-[#e6430a]" : "text-gray-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-[13px] text-gray-500 m-0 mb-2.5 leading-relaxed">
                        {n.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white ${meta.tagBg}`}>
                          {meta.tagLabel}
                        </span>
                        {n.clubName && (
                          <span className="text-[11px] text-gray-400">{n.clubName}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: time + dot + action */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {relativeTime(n.createdAt)}
                      </span>
                      {unread && (
                        <span className="w-[9px] h-[9px] rounded-full bg-[#e6430a]" />
                      )}
                      {n.actionLabel && (
                        <button
                          className="flex items-center gap-1 text-[12px] font-semibold text-[#E6430A] bg-transparent border-0 cursor-pointer p-0 font-[inherit] hover:underline"
                          onClick={(e) => { e.stopPropagation(); handleClick(n); }}
                        >
                          {n.actionLabel}
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
