import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowLeft } from "lucide-react";
import eventService from "../../services/api/events/eventService";
import clubService from "../../services/api/clubs/clubService";
import EventRegistrationBtn from "../../components/events/EventRegistrationBtn";
import { useAuth } from "../../contexts/AuthContext";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  return apiBase.replace(/\/api\/?$/, "") + url;
};

const STATUS_BADGE = {
  Approved:           { label: "Chưa mở đăng ký",   bg: "#6B7280" },
  RegistrationClosed: { label: "Đóng đăng ký",      bg: "#6B7280" },
  RegistrationOpen: { label: "Đăng ký mở",       bg: "#F37021" },
  Upcoming:         { label: "Sắp diễn ra",       bg: "#F37021" },
  Ongoing:          { label: "Đang diễn ra",      bg: "#16A34A" },
  Completed:        { label: "Đã kết thúc",       bg: "#6B7280" },
  ReportUploaded:   { label: "Đã nộp báo cáo",   bg: "#6B7280" },
  Closed:           { label: "Đã đóng",           bg: "#374151" },
  Cancelled:        { label: "Đã hủy",            bg: "#DC2626" },
  Rejected:         { label: "Bị từ chối",        bg: "#DC2626" },
};

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [event, setEvent] = useState(null);
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    if (!eventId) return;
    const fetchData = async () => {
      try {
        const [eventRes, clubRes] = await Promise.all([
          eventService.getEventById(eventId),
          clubService.getAll(),
        ]);
        setEvent(eventRes.data || eventRes);
        setClubs(Array.isArray(clubRes) ? clubRes : (clubRes.data || []));
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        console.error("Lỗi khi tải sự kiện:", error);
      }
    };
    fetchData();
  }, [eventId]);

  if (!event) {
    return <div className="text-center py-20 text-gray-400">Đang tải...</div>;
  }

  const clubObj  = clubs.find((c) => c.clubID === event.clubID);
  const clubName = clubObj ? clubObj.name : "CLB FPTU";
  const badge    = STATUS_BADGE[event.eventStatus] ?? { label: event.eventStatus, bg: "#6B7280" };

  const dateStr = event.startDate
    ? new Date(event.startDate).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "Chưa xác định";
  const timeStr = event.startDate
    ? new Date(event.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`min-h-screen bg-[#F2F4F7] ${user ? "pt-[calc(68px+28px)]" : "pt-8"} px-[5%] pb-[60px] font-['Be_Vietnam_Pro','Inter',sans-serif]`}>
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#4B5674] text-sm font-semibold cursor-pointer hover:border-[#F37021] hover:text-[#F37021] transition-all font-[inherit]"
        >
          <ArrowLeft size={15} /> Quay lại
        </button>

        {/* Hero banner */}
        <div className="relative rounded-[18px] overflow-hidden h-[300px] flex items-end max-md:h-[220px]"
          style={event.bannerUrl
            ? { backgroundImage: `url(${getImageUrl(event.bannerUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: clubObj ? `linear-gradient(135deg, ${clubObj.color}cc, ${clubObj.color}66)` : "linear-gradient(135deg, #1A6FC4cc, #1A6FC466)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="relative z-10 px-9 py-8 w-full">
            <span className="inline-flex items-center text-[12px] font-bold px-3 py-1 rounded-full mb-3 text-white"
              style={{ background: badge.bg }}>
              {badge.label}
            </span>
            <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black text-white tracking-[-0.5px] mb-1.5 leading-[1.2]">
              {event.eventName}
            </h1>
            <p className="text-sm text-white/80 m-0">
              Tổ chức bởi <strong className="text-white font-bold">{clubName}</strong>
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-[1fr_300px] gap-5 items-start max-md:grid-cols-1">

          {/* Main — mô tả */}
          <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-8 py-7">
            <h2 className="text-[1.05rem] font-extrabold text-[#111827] mb-4">Giới thiệu sự kiện</h2>
            {event.description ? (
              <p className="text-sm text-[#4B5563] leading-[1.8] whitespace-pre-line">{event.description}</p>
            ) : (
              <p className="text-sm text-[#9CA3AF] italic">Chưa có mô tả.</p>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            {/* Thông tin */}
            <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-5 py-5 flex flex-col gap-4">
              <h3 className="text-[15px] font-bold text-[#111827] m-0">Thông tin sự kiện</h3>

              <div className="flex items-start gap-3 text-sm text-[#374151]">
                <Calendar size={16} className="text-[#F37021] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold m-0 mb-0.5">Ngày tổ chức</p>
                  <p className="text-[#6B7280] m-0">{dateStr}</p>
                </div>
              </div>

              {timeStr && (
                <div className="flex items-start gap-3 text-sm text-[#374151]">
                  <Clock size={16} className="text-[#F37021] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold m-0 mb-0.5">Thời gian</p>
                    <p className="text-[#6B7280] m-0">{timeStr}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 text-sm text-[#374151]">
                <MapPin size={16} className="text-[#F37021] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold m-0 mb-0.5">Địa điểm</p>
                  <p className="text-[#6B7280] m-0">{event.location || "Chưa xếp phòng"}</p>
                </div>
              </div>
            </div>

            {/* Nút đăng ký */}
            <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-5 py-5">
              <EventRegistrationBtn
                eventId={event.eventID}
                eventStatus={event.eventStatus}
                onRegisterSuccess={() => window.location.reload()}
              />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
