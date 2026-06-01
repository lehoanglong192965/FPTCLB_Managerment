import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EVENTS } from "../constant/data";
import { EventCard } from "../components/eventList";
import "../assets/css/eventListPage.css";

const BADGE_FILTERS = ["Tất cả", "Đăng ký mở", "Sắp diễn ra", "Hết chỗ"];

export default function EventListPage() {
  const navigate = useNavigate();
  const [search, setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  const filtered = EVENTS.filter((event) => {
    const matchFilter = activeFilter === "Tất cả" || event.badge === activeFilter;
    const matchSearch = event.title.toLowerCase().includes(search.toLowerCase())
      || event.club.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="event-list-page">
      {/* Back */}
      <button className="event-list-page__back" onClick={() => navigate("/")}>
        ← Trang Chủ
      </button>

      <div className="event-list-page__header">
        <h1 className="event-list-page__title">Danh Sách Sự Kiện</h1>
        <p className="event-list-page__desc">
          Khám phá các workshop, hackathon và chương trình giao lưu sắp diễn ra.
        </p>
      </div>

      {/* Controls */}
      <div className="event-list-page__controls">
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input
            className="search-bar__input"
            placeholder="Tìm kiếm sự kiện, câu lạc bộ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {BADGE_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab ${activeFilter === f ? "filter-tab--active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="event-list-page__list">
        {filtered.length > 0
          ? filtered.map((event) => <EventCard key={event.title} event={event} />)
          : <p className="event-list-page__empty">Không tìm thấy sự kiện nào.</p>
        }
      </div>
    </div>
  );
}