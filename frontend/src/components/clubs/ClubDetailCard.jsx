import { useNavigate } from "react-router-dom";
import { displayCategory } from "../../hooks/usePublicClubs";

function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Presentational club detail view — hero card + about + events.
 * Shared by the public ClubDetailPage and any dashboard page that
 * wants to show a club's detail without leaving its own layout.
 *
 * @param {object}   club          normalized club object (see usePublicClubs#normalizeClub)
 * @param {object[]} clubEvents    events to list under "Sự kiện" (default: [])
 * @param {object}   primaryAction optional { label, onClick } rendered as the hero CTA button
 * @param {object}   onBack        optional () => void — renders a "← Quay lại" link above the hero card
 */
const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/api\/?$/, "");
  return `${base}${url}`;
};

export default function ClubDetailCard({ club, clubEvents = [], primaryAction, onBack }) {
  const navigate  = useNavigate();
  const avatarBg  = `linear-gradient(135deg, ${club.color}cc, ${club.color}66)`;
  const imgSrc    = resolveImg(club.clubImage ?? club.image ?? club.logoUrl ?? null);

  return (
    <div className="flex flex-col gap-6">
      {onBack && (
        <button
          className="inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#4B5674] text-sm font-semibold cursor-pointer hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all font-[inherit]"
          onClick={onBack}
        >
          ← Quay lại
        </button>
      )}

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-[#EBEBEB] px-8 py-7 flex items-center gap-6 max-md:flex-col max-md:items-start max-md:gap-4">
        <div
          className="w-[100px] h-[100px] rounded-full shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: imgSrc ? "transparent" : avatarBg }}
        >
          {imgSrc
            ? <img src={imgSrc} alt={club.name} className="w-full h-full object-cover" />
            : <span className="text-[44px] leading-none">{club.emoji}</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5">
            <span
              className="inline-flex items-center text-[12px] font-bold px-2.5 py-[3px] rounded-md leading-[1.5]"
              style={{ background: club.color + "18", color: club.color, border: `1px solid ${club.color}44` }}
            >
              {displayCategory(club.tag)}
            </span>
            {club.recruiting && (
              <span className="inline-flex items-center text-[12px] font-bold px-2.5 py-[3px] rounded-md leading-[1.5] bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                Đang tuyển thành viên
              </span>
            )}
          </div>
          <h1 className="text-[1.75rem] font-extrabold text-[#111827] mb-1.5 tracking-[-0.5px]">{club.name}</h1>
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#F37021]">
            <UsersIcon />
            {club.members.toLocaleString()} thành viên
          </div>
        </div>

        {primaryAction && (
          <div className="shrink-0 max-md:w-full">
            <button
              className="px-[22px] py-[11px] bg-[#F37021] text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer whitespace-nowrap transition-all hover:bg-[#e05c0a] hover:-translate-y-px max-md:w-full max-md:text-center"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_320px] gap-5 items-start max-md:grid-cols-1">

        {/* Main column */}
        <div>
          <section className="bg-white rounded-[14px] border border-[#EBEBEB] px-7 py-6 mb-4 last:mb-0">
            <h2 className="text-[1.1rem] font-bold text-[#111827] mb-3">Về chúng tôi</h2>
            <p className="text-sm text-[#4B5563] leading-[1.7]">{club.desc}</p>
          </section>

          <section className="bg-white rounded-[14px] border border-[#EBEBEB] px-7 py-6 mb-4 last:mb-0">
            <h2 className="text-[1.1rem] font-bold text-[#111827] mb-3">
              Sự kiện {clubEvents.length > 0 && `(${clubEvents.length})`}
            </h2>

            {clubEvents.length === 0 ? (
              <p className="text-[13px] text-[#9CA3AF]">Chưa có sự kiện nào.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {clubEvents.map((event) => (
                  <div
                    key={event.title}
                    className="flex items-center gap-4 px-4 py-3.5 border border-[#EBEBEB] rounded-xl bg-white transition-all hover:border-[#F37021] hover:shadow-[0_4px_16px_rgba(243,112,33,0.10)]"
                  >
                    <div
                      className="w-20 h-16 rounded-lg shrink-0 flex items-center justify-center text-[28px] opacity-85"
                      style={{ background: `linear-gradient(135deg, ${event.color}cc, ${event.color}77)` }}
                    >
                      <span>{event.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] mb-1.5">{event.title}</p>
                      <div className="flex items-center gap-3.5 text-[12px] text-[#9CA3AF] font-medium">
                        <span className="flex items-center gap-1"><CalendarIcon /> {event.date}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPinIcon /> {event.location}</span>}
                      </div>
                    </div>
                    <button
                      className="shrink-0 px-[18px] py-[7px] bg-transparent text-[#374151] border border-[#D1D5DB] rounded-lg text-[13px] font-semibold cursor-pointer transition-all hover:border-[#F37021] hover:text-[#F37021] font-[inherit]"
                      onClick={() => navigate(`/events/${encodeURIComponent(event.title)}`)}
                    >
                      Chi tiết
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-6 py-[22px]">
            <h3 className="text-[15px] font-bold text-[#111827] mb-3">Thông tin liên hệ</h3>
            {!club.contactEmail && !club.contactPhone && !club.facebookUrl ? (
              <p className="text-[13px] text-[#9CA3AF] italic">Chưa có thông tin liên hệ.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {club.contactEmail && (
                  <div className="flex flex-col gap-0.5 text-[13px]">
                    <span className="text-[#6B7280] font-semibold">Email:</span>
                    <a href={`mailto:${club.contactEmail}`} className="text-[#1d4ed8] hover:underline break-all">
                      {club.contactEmail}
                    </a>
                  </div>
                )}
                {club.contactPhone && (
                  <div className="flex flex-col gap-0.5 text-[13px]">
                    <span className="text-[#6B7280] font-semibold">Số điện thoại:</span>
                    <a href={`tel:${club.contactPhone}`} className="text-[#111827]">
                      {club.contactPhone}
                    </a>
                  </div>
                )}
                {club.facebookUrl && (
                  <div className="flex flex-col gap-0.5 text-[13px]">
                    <span className="text-[#6B7280] font-semibold">Trang xã hội:</span>
                    <a href={club.facebookUrl} target="_blank" rel="noreferrer" className="text-[#1d4ed8] hover:underline break-all">
                      {club.facebookUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
