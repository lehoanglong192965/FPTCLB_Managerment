import { Bell, Award, Flame, CalendarDays, ChevronRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const mockStats = [
  { label: "CLB Tham Gia",    value: 1, icon: null,  bg: "bg-[#fff0ed]" },
  { label: "Giờ Hoạt Động",   value: 0, icon: null,  bg: "bg-[#fff7ed]" },
  { label: "Chứng Nhận",      value: 0, icon: Award, bg: "bg-[#eff6ff]" },
  { label: "Streak Sự Kiện",  value: 0, icon: Flame, bg: "bg-[#fff1f2]" },
];

const mockClubs = [
  {
    id: 1,
    name: "FPTU IT Club",
    category: "IT",
    img: "https://placehold.co/56x56/1d4ed8/fff?text=IT",
    role: "Thành viên",
  },
];

const mockEvents = [
  {
    id: 1,
    name: "Code War 2026",
    month: "THÁNG 7",
    day: "15",
    time: "15:00",
    location: "Hall A",
  },
  {
    id: 2,
    name: "Code War 2026",
    month: "THÁNG 7",
    day: "15",
    time: "15:00",
    location: "Hall A — Tòa nhà F",
  },
];

const mockNotifications = [
  {
    id: 1,
    title: "Đề xuất sự kiện được phê duyệt",
    desc: 'IC-PDP đã phê duyệt đề xuất "Code War 2026"....',
  },
  {
    id: 2,
    title: "Deadline nộp báo cáo",
    desc: 'Vui lòng nộp báo cáo tổng kết "Acoustic Night"...',
  },
  {
    id: 3,
    title: "Đề xuất bị từ chối — cần chỉnh sửa",
    desc: 'IC-PDP từ chối đề xuất "Gen Z Hackathon". Xe...',
  },
];

export default function MemberHome() {
  const { profile } = useAuth();
  const displayName = profile?.fullName?.split(" ").pop() ?? profile?.fullName ?? "bạn";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 m-0 mb-1">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="text-sm text-gray-500 m-0">
            Chúc bạn một ngày học tập và hoạt động thật năng suất.
          </p>
        </div>
        <button className="relative w-11 h-11 rounded-[10px] border border-gray-200 bg-white flex items-center justify-center cursor-pointer flex-shrink-0">
          <Bell size={20} color="#374151" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {mockStats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-[14px] px-5 py-[18px] flex flex-col items-center gap-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]`}>
            <div className="flex items-center gap-1.5">
              {s.icon && <s.icon size={22} color="#e6430a" />}
              <span className="text-[32px] font-bold text-[#e6430a] leading-none">{s.value}</span>
            </div>
            <span className="text-xs text-gray-500 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Left column */}
        <div>
          {/* Clubs */}
          <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-5 last:mb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900 m-0">Câu lạc bộ của tôi</h2>
              <span className="text-[13px] text-gray-500 cursor-pointer hover:text-[#e6430a]">Xem tất cả</span>
            </div>
            {mockClubs.map((club) => (
              <div key={club.id} className="flex items-center gap-3.5">
                <img src={club.img} alt={club.name} className="w-14 h-14 rounded-[10px] object-cover bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-gray-900 m-0 mb-0.5">{club.name}</p>
                  <p className="text-xs text-blue-500 m-0">{club.category}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="px-3 py-0.5 rounded-full border border-gray-900 text-xs font-medium text-gray-900 bg-transparent whitespace-nowrap">
                    {club.role}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] text-gray-700 cursor-pointer whitespace-nowrap hover:text-[#e6430a]">
                    Vào không gian <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-5 last:mb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900 m-0">Lịch trình sắp tới</h2>
              <span className="text-[13px] text-gray-500 cursor-pointer hover:text-[#e6430a]">Tất cả lịch</span>
            </div>
            {mockEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-b-0 last:pb-0 first:pt-0">
                <div className="flex flex-col items-center justify-center w-[54px] min-h-[62px] bg-[#fff3ee] rounded-[12px] flex-shrink-0 py-2 px-1.5">
                  <span className="text-[10px] font-semibold text-[#e6430a] uppercase tracking-[0.3px] leading-none">{ev.month}</span>
                  <span className="text-2xl font-bold text-[#e6430a] leading-[1.1]">{ev.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 m-0 mb-1 truncate">{ev.name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-500 m-0">
                    <CalendarDays size={12} />
                    {ev.time} • {ev.location}
                  </p>
                </div>
                <button className="px-[18px] py-2 bg-blue-700 text-white border-none rounded-lg text-[13px] font-medium cursor-pointer whitespace-nowrap flex-shrink-0 transition-colors hover:bg-blue-800">
                  Xem vé
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* AI Assistant */}
          <div className="bg-[#e6430a] rounded-[14px] px-[22px] pt-[22px] pb-5 text-white">
            <div className="flex items-center gap-2 mb-2.5">
              <h3 className="text-base font-bold text-white m-0">Trợ lý AI CLB</h3>
              <span className="px-2 py-0.5 bg-white/25 rounded-full text-[11px] font-semibold text-white">BETA</span>
            </div>
            <p className="text-[13px] text-white/85 m-0 mb-4 leading-relaxed">
              Bạn có câu hỏi về hoạt động, tài liệu hay quy trình? Hãy hỏi Trợ lý AI ngay.
            </p>
            <button className="w-full py-2.5 bg-white text-[#e6430a] border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-90">
              Trò chuyện ngay
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-[14px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3.5">Thông báo mới</h3>
            <div className="flex flex-col gap-3 mb-3.5">
              {mockNotifications.map((n) => (
                <div key={n.id} className="flex gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#e6430a] flex-shrink-0 mt-1" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 m-0 mb-0.5 truncate">{n.title}</p>
                    <p className="text-xs text-gray-400 m-0 truncate">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <span className="block text-center text-[13px] text-gray-500 cursor-pointer pt-2.5 border-t border-gray-100 hover:text-[#e6430a]">
              Xem tất cả thông báo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
