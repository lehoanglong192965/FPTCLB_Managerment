import { EVENTS } from "../constant/data";
import "../assets/css/eventList.css";
import { useNavigate } from "react-router-dom";

const BADGE_CLASS = {
  open:     "event-badge--open",
  upcoming: "event-badge--upcoming",
  full:     "event-badge--full",
};

/* ── Card đơn lẻ – tái sử dụng ở bất kỳ trang nào ── */
export function EventCard({ event }) {
  return (
    <div className="event-card">
      {/* Ngày */}
      <div className="event-card__date">
        <span className="event-card__date-day">{event.day}</span>
        <span className="event-card__date-month">{event.month}</span>
      </div>

      {/* Nội dung */}
      <div className="event-card__body">
        <div className="event-card__title">{event.title}</div>
        <div className="event-card__meta">
          <span className="event-card__meta-item">🏷 {event.club}</span>
          <span className="event-card__meta-item">🕐 {event.time}</span>
          <span className="event-card__meta-item">📍 {event.location}</span>
        </div>
        <p className="event-card__desc">{event.desc}</p>
      </div>

      {/* Trạng thái */}
      <div className="event-card__badge">
        <span className={`event-badge ${BADGE_CLASS[event.badgeType]}`}>
          {event.badge}
        </span>
      </div>
    </div>
  );
}

/* ── Section đầy đủ – dùng trong LandingPage ── */
export function EventsSection() {
  const navigate = useNavigate();

  return (
    <section id="events" className="events-section">
      <div className="section__header">
        <span className="section__eyebrow">Lịch Trình</span>
        <h2 className="section__title">Sự Kiện Sắp Tới</h2>
        <p className="section__desc">
          Đừng bỏ lỡ các workshop, hackathon và chương trình giao lưu hấp dẫn
          sắp diễn ra.
        </p>
      </div>

      <div className="events__list">
        {EVENTS.map((event) => (
          <EventCard key={event.title} event={event} />
        ))}
      </div>

      <div className="events__cta-wrap">
        <button className="btn-outline-white" onClick={() => navigate("/events")}>
          Xem Toàn Bộ Lịch Sự Kiện →
        </button>
      </div>
    </section>
  );
}

/* Default export → EventCard đơn lẻ để thuận tiện import */
export default EventCard;