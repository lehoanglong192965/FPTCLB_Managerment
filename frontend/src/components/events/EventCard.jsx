import { useNavigate } from "react-router-dom";

const BADGE = {
  open:      { bg: "#DCFCE7", color: "#16A34A", border: "#BBF7D0", label: "Đăng ký mở"    },
  upcoming:  { bg: "#DBEAFE", color: "#2563EB", border: "#BFDBFE", label: "Sắp diễn ra"   },
  full:      { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA", label: "Hết chỗ"       },
};

const TICKET_STATUS = {
  registered: { bg: "#DCFCE7", color: "#16A34A", label: "Đã đăng ký"   },
  ongoing:    { bg: "#DBEAFE", color: "#2563EB", label: "Đang diễn ra" },
  completed:  { bg: "#F3F4F6", color: "#6B7280", label: "Đã kết thúc"  },
  cancelled:  { bg: "#FEE2E2", color: "#DC2626", label: "Đã hủy"       },
};

/**
 * Dùng ở 2 chế độ:
 *   - Explore (mặc định): hiển thị số chỗ còn lại + nút mũi tên → detail
 *   - Ticket: truyền onTicketClick → hiển thị trạng thái vé + nút "Xem vé"
 *             truyền thêm onCancelClick → hiện nút "Hủy đăng ký" cho vé registered
 */
export default function EventCard({ event }) {
  const navigate     = useNavigate();
  const isTicketMode = !!event.ticketStatus;
  const toDetail     = () => navigate(
    `/events/${event.id}`,
    isTicketMode ? { state: { fromTickets: true, ticketStatus: event.ticketStatus } } : undefined
  );

  const badge     = BADGE[event.badgeType] ?? BADGE.upcoming;
  const ticket    = TICKET_STATUS[event.ticketStatus] ?? TICKET_STATUS.registered;
  const slotsLeft = Math.max((event.maxParticipants ?? 0) - (event.currentParticipants ?? 0), 0);

  return (
    <div
      onClick={toDetail}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1.5 group"
      style={{ border: "1.5px solid #EBEBEB", boxShadow: "0 2px 8px rgba(13,27,62,0.06)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 16px 40px rgba(13,27,62,0.13)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,27,62,0.06)"; }}
    >
      {/* Banner */}
      <div
        className="relative h-[150px] flex flex-col items-center justify-center overflow-hidden text-center px-4"
        style={
          event.bannerUrl
            ? { backgroundImage: `url(${event.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(135deg, ${event.color}, ${event.color}99)` }
        }
      >
        <div
          className="absolute inset-0"
          style={
            event.bannerUrl
              ? { background: "rgba(0,0,0,0.38)" }
              : { backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1.5px)", backgroundSize: "16px 16px", opacity: 0.25 }
          }
        />
        <div
          className="absolute top-3 right-3 z-[1] text-[11px] font-bold px-2.5 py-1 rounded-full border"
          style={
            isTicketMode
              ? { background: ticket.bg, color: ticket.color, borderColor: ticket.bg }
              : { background: badge.bg, color: badge.color, borderColor: badge.border }
          }
        >
          {isTicketMode ? ticket.label : badge.label}
        </div>

        <span className="relative text-[16px] font-extrabold text-white uppercase tracking-[-0.2px] leading-tight mb-2">
          {event.club}
        </span>
        <span className="relative text-[40px] opacity-90 select-none leading-none">{event.emoji}</span>
      </div>

      {/* Body */}
      <div className="px-4 pt-3.5 pb-4">
        <h3
          className="text-[14px] font-bold mb-2.5 leading-snug overflow-hidden"
          style={{
            color: "#0D1B3E",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
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

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: "1px solid #F1F1F1" }}>
          {isTicketMode ? (
            <span className="text-[12px] truncate" style={{ color: "#6B7280" }}>
              {event.location ?? ""}
            </span>
          ) : (
            <>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                  {(event.currentParticipants ?? 0).toLocaleString()}/{(event.maxParticipants ?? 0).toLocaleString()} đã đăng ký
                </span>
                <span className="text-[13px] font-bold" style={{ color: slotsLeft > 0 ? event.color : "#9CA3AF" }}>
                  {slotsLeft > 0 ? `Còn ${slotsLeft.toLocaleString()} chỗ` : "Đã đủ chỗ"}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toDetail(); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg border-[1.5px] transition-colors duration-150 cursor-pointer shrink-0"
                style={{ borderColor: event.color, color: event.color, background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = event.color; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = event.color; }}
                aria-label="Xem chi tiết"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
