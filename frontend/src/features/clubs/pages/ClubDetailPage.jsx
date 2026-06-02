import { useParams, useNavigate } from "react-router-dom";
import { CLUBS, EVENTS } from "../../../constants/mockData";
import "../../../assets/css/clubDetail.css";

function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function ClubDetailPage() {
  const { abbr } = useParams();
  const navigate  = useNavigate();

  const club = CLUBS.find((c) => c.abbr === decodeURIComponent(abbr));

  if (!club) {
    return (
      <div className="cd-not-found">
        <p>Không tìm thấy câu lạc bộ.</p>
        <button onClick={() => navigate("/clubs")}>← Quay lại</button>
      </div>
    );
  }

  const clubEvents = EVENTS.filter((e) => e.club === club.abbr);
  const avatarBg   = `linear-gradient(135deg, ${club.color}cc, ${club.color}66)`;

  return (
    <div className="cd-page">
      <div className="cd-container">

        {/* ── Hero card ── */}
        <div className="cd-hero">
          {/* Avatar */}
          <div className="cd-avatar" style={{ background: avatarBg }}>
            <span className="cd-avatar__emoji">{club.emoji}</span>
          </div>

          {/* Info */}
          <div className="cd-hero__info">
            <div className="cd-hero__chips">
              <span className="cd-chip cd-chip--cat"
                style={{ background: club.color + "18", color: club.color, border: `1px solid ${club.color}44` }}>
                {club.tag}
              </span>
              {club.recruiting && (
                <span className="cd-chip cd-chip--recruiting">Đang tuyển thành viên</span>
              )}
            </div>
            <h1 className="cd-hero__name">{club.name}</h1>
            <p className="cd-hero__desc">{club.desc}</p>
            <div className="cd-hero__members">
              <UsersIcon />
              {club.members.toLocaleString()} thành viên
            </div>
          </div>

          {/* Action */}
          <div className="cd-hero__action">
            <button className="cd-join-btn" onClick={() => navigate("/register")}>
              Đăng ký tài khoản để tham gia
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="cd-body">

          {/* Main column */}
          <div className="cd-main">

            {/* About */}
            <section className="cd-section">
              <h2 className="cd-section__title">Về chúng tôi</h2>
              <p className="cd-section__text">{club.desc}</p>
            </section>

            {/* Events */}
            <section className="cd-section">
              <h2 className="cd-section__title">
                Sự kiện {clubEvents.length > 0 && `(${clubEvents.length})`}
              </h2>

              {clubEvents.length === 0 ? (
                <p className="cd-empty">Chưa có sự kiện nào.</p>
              ) : (
                <div className="cd-events">
                  {clubEvents.map((event) => (
                    <div key={event.title} className="cd-event-item">
                      <div className="cd-event-item__img"
                        style={{ background: `linear-gradient(135deg, ${event.color}cc, ${event.color}77)` }}>
                        <span>{event.emoji}</span>
                      </div>
                      <div className="cd-event-item__info">
                        <p className="cd-event-item__title">{event.title}</p>
                        <div className="cd-event-item__meta">
                          <span><CalendarIcon /> {event.date}</span>
                          {event.location && <span><MapPinIcon /> {event.location}</span>}
                        </div>
                      </div>
                      <button className="cd-event-item__btn"
                        onClick={() => navigate(`/events/${encodeURIComponent(event.title)}`)}>
                        Chi tiết
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Sidebar */}
          <aside className="cd-sidebar">
            <div className="cd-sidebar__card">
              <h3 className="cd-sidebar__title">Thông tin liên hệ</h3>
              <p className="cd-sidebar__empty">Chưa có thông tin liên hệ.</p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
