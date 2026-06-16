import { useNavigate } from "react-router-dom";

export default function ClubCard({ club }) {
  const navigate = useNavigate();
  const toDetail = () => navigate(`/clubs/${encodeURIComponent(club.abbr)}`);

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
        className="relative h-[130px] flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${club.color}cc, ${club.color}88)` }}
      >
        <span className="text-[52px] opacity-35 select-none leading-none">{club.emoji}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent flex items-end px-3.5 py-3">
          <span className="text-[15px] font-bold text-white leading-tight tracking-[-0.2px]">
            {club.name}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3.5 pb-4">
        {/* Chips */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span
            className="text-[12px] font-bold px-2.5 py-1 rounded-md leading-none"
            style={{
              background: club.color + "18",
              color: club.color,
              border: `1px solid ${club.color}44`,
            }}
          >
            {club.tag}
          </span>
          {club.recruiting && (
            <span className="text-[12px] font-bold px-2.5 py-1 rounded-full leading-none bg-green-50 text-green-600 border border-green-200">
              Đang tuyển
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className="text-[13px] leading-relaxed mb-3.5 overflow-hidden"
          style={{
            color: "#6B7280",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {club.desc}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "#6B7280" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {club.members.toLocaleString()} thành viên
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); toDetail(); }}
            className="px-4 py-1.5 text-[13px] font-semibold rounded-lg border transition-colors duration-150 cursor-pointer"
            style={{ color: "#374151", borderColor: "#D1D5DB", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF6B00"; e.currentTarget.style.color = "#FF6B00"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.color = "#374151"; }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
