import { useNavigate } from "react-router-dom";
import { getServerOrigin } from "../../services/api/axiosClient";
import { useLocation } from "react-router-dom";

import { MessageSquare } from "lucide-react";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

// Màu đồng bộ với STATUS_BADGE ở EventDetailPage.jsx (cùng ý nghĩa trạng thái = cùng màu)
const BADGE = {
  open:    { bg: "#FFF3EC", color: "#F37021", border: "#FED7AA", label: "Đăng ký mở" },
  upcoming: { bg: "#DBEAFE", color: "#2563EB", border: "#BFDBFE", label: "Sắp diễn ra" },
  ongoing: { bg: "#DCFCE7", color: "#16A34A", border: "#BBF7D0", label: "Đang diễn ra" },
  full:    { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA", label: "Hết chỗ" },
  closed:  { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", label: "Đóng đăng ký" },
  completed: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", label: "Đã kết thúc" },
};

const TICKET_STATUS = {
  registered: { bg: "#DCFCE7", color: "#16A34A", label: "Đã đăng ký" },
  ongoing: { bg: "#DBEAFE", color: "#2563EB", label: "Đang diễn ra" },
  completed: { bg: "#F3F4F6", color: "#6B7280", label: "Đã kết thúc" },
  cancelled: { bg: "#FEE2E2", color: "#DC2626", label: "Đã hủy" },
};

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const roleBasePath = pathname.startsWith("/club-leader")
    ? "/club-leader"
    : pathname.startsWith("/vice-leader")
      ? "/vice-leader"
      : "/member";
  const isTicketMode = !!event.ticketStatus;
  const toDetail = () => navigate(
    `/events/${event.id}`,
    isTicketMode ? { state: { fromTickets: true, ticketStatus: event.ticketStatus } } : undefined
  );
  const toAppeal = () => navigate(`${roleBasePath}/events/${event.id}/appeal`);

  const badge = BADGE[event.badgeType] ?? BADGE.upcoming;
  const ticket = TICKET_STATUS[event.ticketStatus] ?? TICKET_STATUS.registered;
  const hasCapacityInfo = Number.isFinite(event.maxParticipants) && Number.isFinite(event.currentParticipants);
  const slotsLeft = hasCapacityInfo ? Math.max((event.maxParticipants ?? 0) - (event.currentParticipants ?? 0), 0) : null;

  return (
    <div
      onClick={toDetail}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1.5 group"
      style={{ border: "1.5px solid #EBEBEB", boxShadow: "0 2px 8px rgba(13,27,62,0.06)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 16px 40px rgba(13,27,62,0.13)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,27,62,0.06)"; }}
    >
      <div
        className="relative h-[150px] flex flex-col items-center justify-center overflow-hidden text-center px-4"
        style={
          event.bannerUrl
            ? { backgroundImage: `url(${getImageUrl(event.bannerUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(135deg, ${event.color || "#E6430A"}, ${(event.color || "#E6430A")}99)` }
        }
      >
        {!event.bannerUrl && (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1.5px)", backgroundSize: "16px 16px", opacity: 0.25 }}
          />
        )}
        <div
          className="absolute top-3 right-3 z-[1] text-[11px] font-bold px-2.5 py-1 rounded-full border"
          style={isTicketMode ? { background: ticket.bg, color: ticket.color, borderColor: ticket.bg } : { background: badge.bg, color: badge.color, borderColor: badge.border }}
        >
          {isTicketMode ? ticket.label : badge.label}
        </div>
      </div>

      <div className="px-4 pt-3.5 pb-4">
        <h3
          className="text-[14px] font-bold mb-2.5 leading-snug overflow-hidden"
          style={{ color: "#0D1B3E", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {event.title}
        </h3>

        <span className="flex items-center gap-1.5 text-[12.5px] mb-3" style={{ color: "#6B7280" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {event.time ? `${event.date} · ${event.time}` : event.date}
        </span>

        <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: "1px solid #F1F1F1" }}>
          {isTicketMode ? (
            <>
              <span className="text-[12px] truncate" style={{ color: "#6B7280" }}>
                {event.location ?? ""}
              </span>
              {event.canAppealContribution && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toAppeal(); }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[12px] font-semibold text-orange-600 transition-colors hover:border-orange-300 hover:bg-orange-100"
                  aria-label="Khiếu nại đóng góp"
                >
                  <MessageSquare size={13} /> Khiếu nại
                </button>
              )}
            </>
          ) : hasCapacityInfo ? (
            <div className="flex flex-col leading-tight">
              <span className="text-[12.5px] font-bold" style={{ color: "#111827" }}>
                {(event.currentParticipants ?? 0).toLocaleString()}/{(event.maxParticipants ?? 0).toLocaleString()} đã đăng ký
              </span>
              <span className="text-[13px] font-bold" style={{ color: slotsLeft > 0 ? "#2563EB" : "#9CA3AF" }}>
                {slotsLeft > 0 ? `Còn ${slotsLeft.toLocaleString()} chỗ` : "Đã đủ chỗ"}
              </span>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); toDetail(); }}
              className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg border-[1.5px] transition-colors duration-150 cursor-pointer shrink-0"
              style={{ borderColor: event.color || "#E6430A", color: event.color || "#E6430A", background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = event.color || "#E6430A"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = event.color || "#E6430A"; }}
              aria-label="Xem chi tiết"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
