import { useParams, useNavigate } from "react-router-dom";
import { EVENTS } from "../../constants/mockData";

const BADGE_LABEL = {
  open:     "Đăng ký mở",
  upcoming: "Sắp diễn ra",
  full:     "Hết chỗ",
};

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#F37021" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function EventDetailPage() {
  const { title }  = useParams();
  const navigate   = useNavigate();
  const event      = EVENTS.find((e) => e.title === decodeURIComponent(title));

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-base text-[#6B7280]">
        <p>Không tìm thấy sự kiện.</p>
        <button
          className="px-5 py-2.5 bg-[#F37021] text-white border-none rounded-lg cursor-pointer font-semibold"
          onClick={() => navigate("/events")}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  const heroBg      = `linear-gradient(135deg, ${event.color}ee, ${event.color}99)`;
  const fillPct     = Math.round((event.currentParticipants / event.maxParticipants) * 100);
  const isFull      = event.badgeType === "full";

  return (
    <div className="min-h-screen bg-[#F2F4F7] pt-[calc(68px+28px)] px-[5%] pb-[60px] font-['Be_Vietnam_Pro','Inter',sans-serif]">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-7">

        {/* Hero banner */}
        <div
          className="relative rounded-[18px] overflow-hidden h-[340px] flex items-center justify-center max-md:h-[240px]"
          style={{ background: heroBg }}
        >
          <span className="text-[120px] opacity-[0.18] select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none">
            {event.emoji}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 to-transparent flex flex-col justify-end px-9 py-8">
            <span className={`inline-flex items-center text-[12px] font-bold px-3 py-1 rounded-full mb-2.5 w-fit ${
              event.badgeType === "full" ? "bg-[#6B7280] text-white" : "bg-[#F37021] text-white"
            }`}>
              {BADGE_LABEL[event.badgeType]}
            </span>
            <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-black text-white tracking-[-0.5px] mb-2 leading-[1.15]">
              {event.title}
            </h1>
            <p className="text-sm text-white/80">
              Tổ chức bởi <strong className="text-white font-bold">{event.club}</strong>
            </p>
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-[1fr_320px] gap-6 items-start max-md:grid-cols-1">

          {/* Main */}
          <div>
            <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-8 py-7">
              <h2 className="flex items-center gap-2.5 text-[1.1rem] font-extrabold text-[#111827] mb-4">
                <InfoIcon /> Thông tin chi tiết
              </h2>
              <p className="text-sm text-[#4B5563] leading-[1.75] mb-3 last:mb-0">{event.desc}</p>
              {event.longDesc && (
                <p className="text-sm text-[#4B5563] leading-[1.75] mb-3 last:mb-0">{event.longDesc}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-5 py-6 flex flex-col gap-5">

              {/* Time */}
              <div className="flex items-start gap-3.5">
                <div className="w-[42px] h-[42px] rounded-[10px] bg-[#FEF0E6] text-[#F37021] flex items-center justify-center shrink-0">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-[12px] text-[#9CA3AF] font-medium mb-0.5">Thời gian</p>
                  <p className="text-[15px] font-bold text-[#111827] mb-px">{event.date}</p>
                  {event.time && <p className="text-[12px] text-[#6B7280]">{event.time}</p>}
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-3.5">
                <div className="w-[42px] h-[42px] rounded-[10px] bg-[#FEF0E6] text-[#F37021] flex items-center justify-center shrink-0">
                  <MapPinIcon />
                </div>
                <div>
                  <p className="text-[12px] text-[#9CA3AF] font-medium mb-0.5">Địa điểm</p>
                  <p className="text-[15px] font-bold text-[#111827] mb-px">{event.venue ?? "—"}</p>
                  {event.venueDetail && (
                    <p className="text-[12px] text-[#6B7280]">{event.venueDetail}</p>
                  )}
                </div>
              </div>

              {/* Participants + progress bar */}
              <div className="flex items-start gap-3.5">
                <div className="w-[42px] h-[42px] rounded-[10px] bg-[#FEF0E6] text-[#F37021] flex items-center justify-center shrink-0">
                  <UsersIcon />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] text-[#9CA3AF] font-medium mb-0.5">Số lượng</p>
                  <p className="text-[15px] font-bold text-[#111827] mb-px">
                    {event.currentParticipants} / {event.maxParticipants}
                  </p>
                  <div className="h-2 rounded-full overflow-hidden mt-2 border border-[#E5E7EB]">
                    <div
                      className="h-full bg-[#F37021] rounded-full transition-[width] duration-300"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Register button */}
              <button
                className={`w-full py-[13px] mt-1 border-none rounded-[10px] text-[15px] font-bold font-[inherit] transition-all ${
                  isFull
                    ? "bg-[#D1D5DB] text-[#9CA3AF] cursor-not-allowed"
                    : "bg-[#F37021] text-white cursor-pointer hover:bg-[#e05c0a] hover:-translate-y-px"
                }`}
                disabled={isFull}
                onClick={() => !isFull && navigate("/register")}
              >
                {isFull ? "Đã hết chỗ" : "Đăng ký tham gia"}
              </button>

            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
