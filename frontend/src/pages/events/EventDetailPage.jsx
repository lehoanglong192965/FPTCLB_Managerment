import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowLeft, Users } from "lucide-react";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import EventRegistrationBtn from "../../components/events/EventRegistrationBtn";
import { useAuth } from "../../contexts/AuthContext";
import { getServerOrigin } from "../../services/api/axiosClient";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

const STATUS_BADGE = {
  APPROVED:            { label: "Chưa mở đăng ký",   bg: "#6B7280" },
  REGISTRATION_CLOSED: { label: "Đóng đăng ký",      bg: "#6B7280" },
  REGISTRATION_OPEN:   { label: "Đăng ký mở",        bg: "#F37021" },
  ONGOING:             { label: "Đang diễn ra",      bg: "#16A34A" },
  COMPLETED:           { label: "Đã kết thúc",       bg: "#6B7280" },
  REPORT_UPLOADED:     { label: "Đã nộp báo cáo",    bg: "#6B7280" },
  CLOSED:              { label: "Đã đóng",           bg: "#374151" },
  CANCELLED:           { label: "Đã hủy",            bg: "#DC2626" },
  REJECTED:            { label: "Bị từ chối",        bg: "#DC2626" },
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
          eventApi.getEventById(eventId),
          clubApi.getAll(),
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
  const endTimeStr = event.endDate
    ? new Date(event.endDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";
  const timeRangeStr = timeStr && endTimeStr ? `${timeStr} - ${endTimeStr}` : timeStr;

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

        {/* Banner + tiêu đề — kiểu TicketGo: ảnh banner sạch, chữ nằm bên dưới chứ không đè lên ảnh */}
        <div className="bg-white rounded-[18px] border border-[#EBEBEB] overflow-hidden">
          <div className="w-full h-[320px] max-md:h-[200px]"
            style={event.bannerUrl
              ? { backgroundImage: `url(${getImageUrl(event.bannerUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: clubObj ? `linear-gradient(135deg, ${clubObj.color}cc, ${clubObj.color}66)` : "linear-gradient(135deg, #1A6FC4cc, #1A6FC466)" }}
          />

          <div className="px-8 py-7 max-md:px-5 max-md:py-5">
            <div className="flex items-center justify-between gap-6 max-md:flex-col">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center text-[12px] font-bold px-3 py-1 rounded-full mb-3 text-white"
                  style={{ background: badge.bg }}>
                  {badge.label}
                </span>
                <h1 className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-black text-[#111827] tracking-[-0.5px] mb-1.5 leading-[1.25]">
                  {event.eventName}
                </h1>
                <p className="text-sm text-[#6B7280] m-0">
                  Tổ chức bởi <strong className="text-[#111827] font-bold">{clubName}</strong>
                </p>
                {typeof event.maxParticipants === "number" && event.maxParticipants > 0 && (
                  <span className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full text-[13px] font-bold"
                    style={{
                      background: (event.currentParticipants ?? 0) >= event.maxParticipants ? "#FEE2E2" : "#DCFCE7",
                      color: (event.currentParticipants ?? 0) >= event.maxParticipants ? "#DC2626" : "#16A34A",
                    }}>
                    <Users size={14} />
                    {event.currentParticipants ?? 0}/{event.maxParticipants} người đã đăng ký
                  </span>
                )}
              </div>

              <div className="w-[220px] shrink-0 max-md:w-full">
                <EventRegistrationBtn
                  eventId={event.eventID}
                  eventStatus={event.eventStatus}
                  onRegisterSuccess={() => window.location.reload()}
                />
              </div>
            </div>

            {/* Thông tin sự kiện — xếp dọc: Thời gian → Ngày tổ chức → Địa chỉ */}
            <div className="mt-5 pt-5 border-t border-[#F0F0F0]">
              <h3 className="text-[1.05rem] font-extrabold text-[#111827] m-0 mb-3">Thông tin sự kiện</h3>
              <div className="flex flex-col gap-2 text-sm text-[#374151]">
                {timeRangeStr && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} className="text-[#F37021]" /> {timeRangeStr}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-[#F37021]" /> {dateStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-[#F37021]" /> {event.location || event.venueName || "Chưa xếp phòng"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Giới thiệu sự kiện — nút đăng ký đã chuyển lên khối banner phía trên nên không cần sidebar riêng nữa */}
        <div className="bg-white rounded-[14px] border border-[#EBEBEB] px-8 py-7">
          <h2 className="text-[1.05rem] font-extrabold text-[#111827] mb-4">Giới thiệu sự kiện</h2>
          {event.description ? (
            <p className="text-sm text-[#4B5563] leading-[1.8] whitespace-pre-line">{event.description}</p>
          ) : (
            <p className="text-sm text-[#9CA3AF] italic">Chưa có mô tả.</p>
          )}
        </div>
      </div>
    </div>
  );
}
