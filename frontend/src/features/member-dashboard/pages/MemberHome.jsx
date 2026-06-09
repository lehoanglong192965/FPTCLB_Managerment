import { Bell, Award, Flame, CalendarDays, ChevronRight } from "lucide-react";
import "../../../assets/css/memberHome.css";
import { useAuth } from "../../auth/context/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const mockStats = [
  { label: "CLB Tham Gia",    value: 1, icon: null,  cardClass: "mh-stat-card-pink"  },
  { label: "Giờ Hoạt Động",   value: 0, icon: null,  cardClass: "mh-stat-card-peach" },
  { label: "Chứng Nhận",      value: 0, icon: Award, cardClass: "mh-stat-card-blue"  },
  { label: "Streak Sự Kiện",  value: 0, icon: Flame, cardClass: "mh-stat-card-rose"  },
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
      <div className="mh-header">
        <div>
          <h1 className="mh-greeting">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="mh-greeting-sub">
            Chúc bạn một ngày học tập và hoạt động thật năng suất.
          </p>
        </div>
        <button className="mh-bell-btn">
          <Bell size={20} color="#374151" />
          <span className="mh-bell-dot" />
        </button>
      </div>

      {/* Stats */}
      <div className="mh-stats">
        {mockStats.map((s) => (
          <div key={s.label} className={`mh-stat-card ${s.cardClass}`}>
            <div className="mh-stat-value-row">
              {s.icon && <s.icon size={22} color="#e6430a" />}
              <span className="mh-stat-value">{s.value}</span>
            </div>
            <span className="mh-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="mh-grid">
        {/* Left column */}
        <div>
          {/* Clubs */}
          <div className="mh-section">
            <div className="mh-section-header">
              <h2 className="mh-section-title">Câu lạc bộ của tôi</h2>
              <span className="mh-section-link">Xem tất cả</span>
            </div>
            {mockClubs.map((club) => (
              <div key={club.id} className="mh-club-item">
                <img src={club.img} alt={club.name} className="mh-club-img" />
                <div className="mh-club-info">
                  <p className="mh-club-name">{club.name}</p>
                  <p className="mh-club-category">{club.category}</p>
                </div>
                <div className="mh-club-right">
                  <span className="mh-badge-member">{club.role}</span>
                  <span className="mh-club-enter">
                    Vào không gian <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule */}
          <div className="mh-section">
            <div className="mh-section-header">
              <h2 className="mh-section-title">Lịch trình sắp tới</h2>
              <span className="mh-section-link">Tất cả lịch</span>
            </div>
            {mockEvents.map((ev) => (
              <div key={ev.id} className="mh-event-item">
                <div className="mh-date-badge">
                  <span className="mh-date-month">{ev.month}</span>
                  <span className="mh-date-day">{ev.day}</span>
                </div>
                <div className="mh-event-info">
                  <p className="mh-event-name">{ev.name}</p>
                  <p className="mh-event-meta">
                    <CalendarDays size={12} />
                    {ev.time} • {ev.location}
                  </p>
                </div>
                <button className="mh-ticket-btn">Xem vé</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="mh-right-col">
          {/* AI Assistant */}
          <div className="mh-ai-card">
            <div className="mh-ai-title-row">
              <h3 className="mh-ai-title">Trợ lý AI CLB</h3>
              <span className="mh-ai-beta">BETA</span>
            </div>
            <p className="mh-ai-desc">
              Bạn có câu hỏi về hoạt động, tài liệu hay quy trình? Hãy hỏi Trợ lý AI ngay.
            </p>
            <button className="mh-ai-btn">Trò chuyện ngay</button>
          </div>

          {/* Notifications */}
          <div className="mh-notif-card">
            <h3 className="mh-notif-title">Thông báo mới</h3>
            <div className="mh-notif-list">
              {mockNotifications.map((n) => (
                <div key={n.id} className="mh-notif-item">
                  <span className="mh-notif-dot" />
                  <div className="mh-notif-body">
                    <p className="mh-notif-item-title">{n.title}</p>
                    <p className="mh-notif-item-desc">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <span className="mh-notif-all">Xem tất cả thông báo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
