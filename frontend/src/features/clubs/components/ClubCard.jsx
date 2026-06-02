import "../../../assets/css/clubList.css";

const TAG_CLASS = {
  "Công nghệ": "club-card__tag--tech",
  "Thiết kế":  "club-card__tag--design",
  "Kỹ năng":   "club-card__tag--skill",
  "AI & Data": "club-card__tag--ai",
  "Business":  "club-card__tag--biz",
  "Ngôn ngữ":  "club-card__tag--lang",
  "Nghệ thuật":"club-card__tag--art",
  "Thể thao":  "club-card__tag--sport",
};

function getCardVariant(hex) {
  const h = hex.toLowerCase();
  if (h.includes("1c3f94") || h.includes("1a60") || h.includes("1a6b")) return "blue";
  if (h.includes("0a7a")   || h.includes("1a6b3c"))                      return "green";
  if (h.includes("9b23")   || h.includes("7a2d") || h.includes("5c3d"))  return "purple";
  return "orange";
}

function abbrStyle(color) {
  return {
    background: color + "22",
    color: color,
    border: `1px solid ${color}44`,
  };
}

export default function ClubCard({ club }) {
  const variant  = getCardVariant(club.color);
  const tagClass = TAG_CLASS[club.tag] ?? "club-card__tag--default";

  return (
    <div className={`club-card club-card--${variant}`}>
      <div
        className="club-card__banner"
        style={{ background: `linear-gradient(135deg, ${club.color}33, ${club.color}55)` }}
      >
        <span className="club-card__banner-emoji">{club.emoji}</span>
      </div>

      <div className="club-card__body">
        <span className="club-card__abbr" style={abbrStyle(club.color)}>
          {club.abbr}
        </span>
        <div className="club-card__name">{club.name}</div>
        <p className="club-card__desc">{club.desc}</p>

        <div className="club-card__footer">
          <div className="club-card__members">
            👥 {club.members.toLocaleString()} thành viên
          </div>
          <span className={`club-card__tag ${tagClass}`}>{club.tag}</span>
        </div>
      </div>
    </div>
  );
}
