import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CLUBS } from "../constant/data";
import { ClubCard } from "../components/clubList";
import "../assets/css/clubListPage.css";

const CATEGORIES = ["Tất cả", "Công nghệ", "Thiết kế", "Kỹ năng", "AI & Data", "Business", "Ngôn ngữ", "Nghệ thuật", "Thể thao"];

export default function ClubListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("Tất cả");

  const filtered = CLUBS.filter((club) => {
    const matchTag = activeTag === "Tất cả" || club.tag === activeTag;
    const matchSearch = club.name.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div className="club-list-page">
      {/* Nút back */}
      <button className="club-list-page__back" onClick={() => navigate("/")}>
        ← Trở về
      </button>

      <div className="club-list-page__header">
        <h1 className="club-list-page__title">Danh Sách Câu Lạc Bộ</h1>
        <p className="club-list-page__desc">
          Tìm kiếm và tham gia câu lạc bộ phù hợp với sở thích của bạn.
        </p>
      </div>

      <div className="club-list-page__controls">
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input
            className="search-bar__input"
            placeholder="Tìm kiếm câu lạc bộ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-tab ${activeTag === cat ? "filter-tab--active" : ""}`}
              onClick={() => setActiveTag(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="clubs__grid">
        {filtered.length > 0
          ? filtered.map((club) => <ClubCard key={club.abbr} club={club} />)
          : <p className="club-list-page__empty">Không tìm thấy câu lạc bộ nào.</p>
        }
      </div>
    </div>
  );
}