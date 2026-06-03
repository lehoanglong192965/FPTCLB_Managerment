import { useParams, useNavigate } from "react-router-dom";
import { EVENTS } from "../../../constants/mockData";
import "../../../assets/css/eventDetail.css";

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
      <div className="ed-not-found">
        <p>Không tìm thấy sự kiện.</p>
        <button onClick={() => navigate("/events")}>← Quay lại</button>
      </div>
    );
  }

  const heroBg      = `linear-gradient(135deg, ${event.color}ee, ${event.color}99)`;
  const fillPct     = Math.round((event.currentParticipants / event.maxParticipants) * 100);
  const isFull      = event.badgeType === "full";

  return (
    <div className="ed-page">
      <div className="ed-container">

        {/* ── Hero banner ── */}
        <div className="ed-hero" style={{ background: heroBg }}>
          <span className="ed-hero__emoji">{event.emoji}</span>
          <div className="ed-hero__overlay">
            <span className={`ed-badge ed-badge--${event.badgeType}`}>
              {BADGE_LABEL[event.badgeType]}
            </span>
            <h1 className="ed-hero__title">{event.title}</h1>
            <p className="ed-hero__organizer">
              Tổ chức bởi <strong>{event.club}</strong>
            </p>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="ed-body">

          {/* Main */}
          <div className="ed-main">
            <div className="ed-section">
              <h2 className="ed-section__title">
                <InfoIcon /> Thông tin chi tiết
              </h2>
              <p className="ed-section__text">{event.desc}</p>
              {event.longDesc && (
                <p className="ed-section__text">{event.longDesc}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="ed-sidebar">
            <div className="ed-info-card">

              {/* Time */}
              <div className="ed-info-row">
                <div className="ed-info-row__icon"><CalendarIcon /></div>
                <div>
                  <p className="ed-info-row__label">Thời gian</p>
                  <p className="ed-info-row__value">{event.date}</p>
                  {event.time && <p className="ed-info-row__sub">{event.time}</p>}
                </div>
              </div>

              {/* Venue */}
              <div className="ed-info-row">
                <div className="ed-info-row__icon"><MapPinIcon /></div>
                <div>
                  <p className="ed-info-row__label">Địa điểm</p>
                  <p className="ed-info-row__value">{event.venue ?? "—"}</p>
                  {event.venueDetail && (
                    <p className="ed-info-row__sub">{event.venueDetail}</p>
                  )}
                </div>
              </div>

              {/* Participants + progress bar */}
              <div className="ed-info-row">
                <div className="ed-info-row__icon"><UsersIcon /></div>
                <div className="ed-info-row__full">
                  <p className="ed-info-row__label">Số lượng</p>
                  <p className="ed-info-row__value">
                    {event.currentParticipants} / {event.maxParticipants}
                  </p>
                  <div className="ed-progress">
                    <div
                      className="ed-progress__fill"
                      style={{ width: `${fillPct}%` }}
                    />
                    <div
                      className="ed-progress__remain"
                      style={{ width: `${100 - fillPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Register button */}
              <button
                className={`ed-register-btn ${isFull ? "ed-register-btn--disabled" : ""}`}
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
