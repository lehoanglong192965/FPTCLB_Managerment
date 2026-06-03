import { useNavigate } from "react-router-dom";
import "../../../assets/css/clubList.css";

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

export default function ClubCard({ club }) {
  const navigate  = useNavigate();
  const bannerBg  = `linear-gradient(135deg, ${club.color}cc, ${club.color}88)`;
  const toDetail  = () => navigate(`/clubs/${encodeURIComponent(club.abbr)}`);

  return (
    <div className="club-card" onClick={toDetail}>

      {/* Banner with club name overlay */}
      <div className="club-card__banner" style={{ background: bannerBg }}>
        <span className="club-card__banner-emoji">{club.emoji}</span>
        <div className="club-card__banner-overlay">
          <span className="club-card__banner-name">{club.name}</span>
        </div>
      </div>

      {/* Body */}
      <div className="club-card__body">

        {/* Chips row */}
        <div className="club-card__chips">
          <span className="club-card__chip club-card__chip--cat"
            style={{ background: club.color + "18", color: club.color, border: `1px solid ${club.color}44` }}>
            {club.tag}
          </span>
          {club.recruiting && (
            <span className="club-card__chip club-card__chip--recruiting">Đang tuyển</span>
          )}
        </div>

        {/* Description */}
        <p className="club-card__desc">{club.desc}</p>

        {/* Footer */}
        <div className="club-card__footer">
          <span className="club-card__members">
            <UsersIcon />
            {club.members.toLocaleString()} thành viên
          </span>
          <button className="club-card__detail-btn" onClick={(e) => { e.stopPropagation(); toDetail(); }}>Chi tiết</button>
        </div>

      </div>
    </div>
  );
}
