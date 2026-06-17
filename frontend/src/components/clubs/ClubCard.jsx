import { useNavigate } from "react-router-dom";

export default function ClubCard({ club, onSelect }) {
  const navigate = useNavigate();
  const toDetail = onSelect ?? (() => navigate(`/clubs/${encodeURIComponent(club.abbr)}`));

  return (
    <div
      onClick={toDetail}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1.5 group"
      style={{ border: "1.5px solid #EBEBEB", boxShadow: "0 2px 8px rgba(13,27,62,0.05)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,27,62,0.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,27,62,0.05)"}
    >
      {/* Banner */}
      <div
        className="relative h-[150px] flex flex-col items-center justify-center overflow-hidden text-center px-4"
        style={{ background: `linear-gradient(135deg, ${club.color}, ${club.color}99)` }}
      >
        {/* dotted network pattern */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1.5px)",
            backgroundSize: "16px 16px",
          }}
        />
        <span className="relative text-[18px] font-extrabold text-white uppercase tracking-[-0.2px] leading-tight mb-2">
          {club.tag}
        </span>
        <span className="relative text-[40px] opacity-90 select-none leading-none">{club.emoji}</span>
      </div>

      {/* Body */}
      <div className="px-4 pt-3.5 pb-4">
        {/* Title */}
        <h3
          className="text-[14px] font-bold mb-2.5 leading-snug overflow-hidden"
          style={{
            color: "#0D1B3E",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {club.name}
        </h3>

        {/* Info row (members) */}
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium pt-3" style={{ color: "#6B7280", borderTop: "1px solid #F1F1F1" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {club.members.toLocaleString()} thành viên
        </span>
      </div>
    </div>
  );
}
