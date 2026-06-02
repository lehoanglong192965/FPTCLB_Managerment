import { useNavigate } from "react-router-dom";
import "../../../assets/css/eventList.css";

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function EventCard({ event }) {
  const navigate  = useNavigate();
  const bannerBg  = `linear-gradient(135deg, ${event.color}cc, ${event.color}88)`;
  const toDetail  = () => navigate(`/events/${encodeURIComponent(event.title)}`);

  return (
    <div className="event-card" onClick={toDetail}>

      {/* Banner */}
      <div className="event-card__banner" style={{ background: bannerBg }}>
        <span className="event-card__banner-emoji">{event.emoji}</span>
      </div>

      {/* Body */}
      <div className="event-card__body">
        <div className="event-card__title">{event.title}</div>
        <div className="event-card__club">{event.club}</div>

        <div className="event-card__info">
          <span className="event-card__info-row">
            <span className="event-card__info-icon"><CalendarIcon /></span>
            {event.date}
          </span>
          <span className="event-card__info-row">
            <span className="event-card__info-icon"><UsersIcon /></span>
            {event.currentParticipants} / {event.maxParticipants} người
          </span>
        </div>

        <button className="event-card__btn" onClick={(e) => { e.stopPropagation(); toDetail(); }}>Xem chi tiết</button>
      </div>

    </div>
  );
}
