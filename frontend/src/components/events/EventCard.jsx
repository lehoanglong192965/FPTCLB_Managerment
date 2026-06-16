import { useNavigate } from "react-router-dom";

const BADGE = {
  open:     { bg: "#DCFCE7", color: "#16A34A", border: "#BBF7D0", label: "Đăng ký mở"  },
  upcoming: { bg: "#DBEAFE", color: "#2563EB", border: "#BFDBFE", label: "Sắp diễn ra" },
  full:     { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA", label: "Hết chỗ"     },
};

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const toDetail = () => navigate(`/events/${encodeURIComponent(event.title)}`);
  const badge = BADGE[event.badgeType] ?? BADGE.upcoming;
  const fillPct = Math.min(Math.round((event.currentParticipants / event.maxParticipants) * 100), 100);

  return (
    <div
      onClick={toDetail}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1.5 group"
      style={{ border: "1.5px solid #EBEBEB", boxShadow: "0 2px 8px rgba(13,27,62,0.06)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 16px 40px rgba(13,27,62,0.13)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,27,62,0.06)"}
    >
      {/* Banner */}
      <div
        className="relative h-[100px] flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${event.color}cc, ${event.color}88)` }}
      >
        <span className="text-5xl opacity-40 select-none">{event.emoji}</span>
        {/* Status badge */}
        <div
          className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full border"
          style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
        >
          {badge.label}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3.5 pb-4">
        {/* Club tag */}
        <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: event.color }}>
          {event.club}
        </span>

        {/* Title */}
        <h3
          className="text-[14px] font-bold mt-1 mb-3 leading-snug overflow-hidden"
          style={{
            color: "#0D1B3E",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {event.title}
        </h3>

        {/* Info */}
        <div className="flex flex-col gap-1.5 mb-3.5">
          <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "#6B7280" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {event.date} · {event.time}
          </span>
          <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "#6B7280" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {event.currentParticipants.toLocaleString()} / {event.maxParticipants.toLocaleString()} người
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full mb-3.5" style={{ background: "#F3F4F6" }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${fillPct}%`, background: event.color }}
          />
        </div>

        {/* Button */}
        <button
          onClick={(e) => { e.stopPropagation(); toDetail(); }}
          className="w-full py-2 text-[13px] font-semibold text-white rounded-lg cursor-pointer border-none transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${event.color}, ${event.color}bb)` }}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
