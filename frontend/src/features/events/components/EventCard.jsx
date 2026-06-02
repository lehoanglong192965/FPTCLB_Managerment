import "../../../assets/css/eventList.css";

const BADGE_CLASS = {
  open:     "event-badge--open",
  upcoming: "event-badge--upcoming",
  full:     "event-badge--full",
};

export default function EventCard({ event }) {
  return (
    <div className="event-card">
      <div className="event-card__date">
        <span className="event-card__date-day">{event.day}</span>
        <span className="event-card__date-month">{event.month}</span>
      </div>

      <div className="event-card__body">
        <div className="event-card__title">{event.title}</div>
        <div className="event-card__meta">
          <span className="event-card__meta-item">🏷 {event.club}</span>
          <span className="event-card__meta-item">🕐 {event.time}</span>
          <span className="event-card__meta-item">📍 {event.location}</span>
        </div>
        <p className="event-card__desc">{event.desc}</p>
      </div>

      <div className="event-card__badge">
        <span className={`event-badge ${BADGE_CLASS[event.badgeType]}`}>
          {event.badge}
        </span>
      </div>
    </div>
  );
}
