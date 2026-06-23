import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import eventService from "../../services/api/events/eventService";

const BADGE_LABEL = {
  open:     "Đăng ký mở",
  upcoming: "Sắp diễn ra",
  full:     "Hết chỗ",
};

const TICKET_BADGE = {
  registered: { label: "Đã đăng ký",   bg: "#DCFCE7", color: "#15803D" },
  ongoing:    { label: "Đang diễn ra", bg: "#DBEAFE", color: "#1D4ED8" },
  completed:  { label: "Đã kết thúc",  bg: "#F3F4F6", color: "#6B7280" },
  cancelled:  { label: "Đã hủy",       bg: "#FEE2E2", color: "#DC2626" },
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

const LS_KEY = "fptclb_cancelled_tickets";
const getCancelled = () => new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"));
const saveCancel   = (t) => {
  const s = getCancelled(); s.add(t);
  localStorage.setItem(LS_KEY, JSON.stringify([...s]));
};

export default function EventDetailPage() {
  const { eventId }    = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const fromTickets  = location.state?.fromTickets ?? false;
  const ticketStatus = location.state?.ticketStatus ?? null;
  
  const [event, setEvent] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelled, setCancelled]         = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      try {
        const response = await eventService.getEventById(eventId);
        setEvent(response.data || response);
      } catch (error) {
        console.error("Lỗi khi tải sự kiện:", error);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (!event) {
    return <div className="text-center py-20">Đang tải...</div>;
  }

  // Map lại dữ liệu
  const mappedEvent = {
      id: event.eventID,
      title: event.eventName,
      club: "CLB", // Cần API lấy tên CLB
      date: event.startDate ? new Date(event.startDate).toLocaleDateString() : "",
      time: event.startDate ? new Date(event.startDate).toLocaleTimeString() : "",
      venue: event.location,
      desc: event.description,
      longDesc: event.description,
      currentParticipants: 0, // Cần API tính
      maxParticipants: 100, // Cần API lấy
      badgeType: "open"
  };

  const fillPct     = Math.round((mappedEvent.currentParticipants / mappedEvent.maxParticipants) * 100);
  const isFull      = mappedEvent.badgeType === "full";

  return (
    <div className="min-h-screen bg-[#F2F4F7] pt-[calc(68px+28px)] px-[5%] pb-[60px] font-['Be_Vietnam_Pro','Inter',sans-serif]">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-7">

        {/* Hero banner */}
        <div className="relative rounded-[18px] overflow-hidden h-[340px] flex items-center justify-center max-md:h-[240px] bg-gradient-to-t from-gray-500 to-gray-300">
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 to-transparent flex flex-col justify-end px-9 py-8">
            <span className={`inline-flex items-center text-[12px] font-bold px-3 py-1 rounded-full mb-2.5 w-fit ${
                mappedEvent.badgeType === "full" ? "bg-[#6B7280] text-white" : "bg-[#F37021] text-white"
              }`}>
                {BADGE_LABEL[mappedEvent.badgeType]}
            </span>
            <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-black text-white tracking-[-0.5px] mb-2 leading-[1.15]">
              {mappedEvent.title}
            </h1>
            <p className="text-sm text-white/80">
              Tổ chức bởi <strong className="text-white font-bold">{mappedEvent.club}</strong>
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
              <p className="text-sm text-[#4B5563] leading-[1.75] mb-3 last:mb-0">{mappedEvent.desc}</p>
            </div>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-5 py-6 flex flex-col gap-5">
              
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