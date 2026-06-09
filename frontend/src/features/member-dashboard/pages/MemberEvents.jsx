import { useState, useRef, useEffect } from "react";
import { Calendar, Search, SlidersHorizontal, CalendarDays } from "lucide-react";
import EventCard from "../../events/components/EventCard";
import "../../../assets/css/memberEvents.css";

const ALL_TAGS = ["Tất cả", "Công nghệ", "Âm nhạc", "Thể thao", "Hội thảo", "Cộng đồng", "Giải trí"];

const mockRegisteredEvents = [
  {
    id: 1,
    title: "Code War 2026",
    club: "FPTU IT Club",
    month: "THÁNG 7",
    day: "15",
    time: "15:00",
    location: "Hall A",
    status: "registered",
  },
  {
    id: 2,
    title: "Tech Talk: AI & LLM",
    club: "FPTU IT Club",
    month: "THÁNG 6",
    day: "20",
    time: "09:00",
    location: "Tòa nhà F – P.201",
    status: "ongoing",
  },
];

const mockOtherEvents = [
  { id: 3,  title: "Acoustic Night Vol.5",    club: "FPTU Music Club",     tag: "Âm nhạc",   color: "#7c3aed", emoji: "🎵", date: "22/06/2026 • 18:30", currentParticipants: 80,  maxParticipants: 150 },
  { id: 4,  title: "FPT Sport Festival 2026", club: "FPTU Sport Club",     tag: "Thể thao",  color: "#d97706", emoji: "⚽", date: "28/06/2026 • 07:00", currentParticipants: 200, maxParticipants: 300 },
  { id: 5,  title: "English Debate Open",     club: "FPTU English Club",   tag: "Hội thảo",  color: "#059669", emoji: "🌍", date: "01/07/2026 • 14:00", currentParticipants: 45,  maxParticipants: 60  },
  { id: 6,  title: "Kpop Cover Contest",      club: "FPTU Dance Club",     tag: "Giải trí",  color: "#e11d48", emoji: "💃", date: "05/07/2026 • 17:00", currentParticipants: 30,  maxParticipants: 50  },
  { id: 7,  title: "STEM Hackathon 2026",     club: "FPTU Science Club",   tag: "Công nghệ", color: "#0284c7", emoji: "🔬", date: "10/07/2026 • 08:00", currentParticipants: 60,  maxParticipants: 80  },
  { id: 8,  title: "Green Campus Day",        club: "FPTU Volunteer Club", tag: "Cộng đồng", color: "#16a34a", emoji: "🤝", date: "12/07/2026 • 08:00", currentParticipants: 120, maxParticipants: 200 },
  { id: 9,  title: "Short Film Festival",     club: "FPTU Media Club",     tag: "Giải trí",  color: "#9333ea", emoji: "📹", date: "18/07/2026 • 19:00", currentParticipants: 55,  maxParticipants: 100 },
  { id: 10, title: "Art Exhibition 2026",     club: "FPTU Art Club",       tag: "Giải trí",  color: "#db2777", emoji: "🎨", date: "20/07/2026 • 10:00", currentParticipants: 40,  maxParticipants: 80  },
];

const STATUS_LABEL = {
  registered: "Đã đăng ký",
  ongoing:    "Đang diễn ra",
};

export default function MemberEvents() {
  const [search, setSearch]         = useState("");
  const [activeTag, setActiveTag]   = useState("Tất cả");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef                   = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = mockOtherEvents.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                        e.club.toLowerCase().includes(search.toLowerCase());
    const matchTag    = activeTag === "Tất cả" || e.tag === activeTag;
    return matchSearch && matchTag;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sự Kiện</h1>
        <p className="page-subtitle">Sự kiện đã đăng ký và khám phá thêm</p>
      </div>

      {/* ── Sự kiện đã đăng ký ── */}
      <div className="me-section">
        <div className="me-section-header">
          <h2 className="me-section-title">Sự kiện đã đăng ký</h2>
          <span className="me-section-count">{mockRegisteredEvents.length} sự kiện</span>
        </div>

        {mockRegisteredEvents.length === 0 ? (
          <div className="me-empty">
            <Calendar size={36} strokeWidth={1.5} />
            <p>Bạn chưa đăng ký sự kiện nào.</p>
          </div>
        ) : (
          <div className="me-registered-list">
            {mockRegisteredEvents.map((ev) => (
              <div key={ev.id} className="me-registered-item">
                <div className="me-date-badge">
                  <span className="me-date-month">{ev.month}</span>
                  <span className="me-date-day">{ev.day}</span>
                </div>
                <div className="me-event-info">
                  <p className="me-event-name">{ev.title}</p>
                  <p className="me-event-meta">
                    <CalendarDays size={12} />
                    {ev.time} • {ev.location}
                  </p>
                  <p className="me-event-club">{ev.club}</p>
                </div>
                <span className={`me-status-badge ${ev.status}`}>
                  {STATUS_LABEL[ev.status]}
                </span>
                <button className="me-ticket-btn">Xem vé</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sự kiện khác ── */}
      <div className="me-section">
        <div className="me-section-header">
          <h2 className="me-section-title">Sự kiện khác</h2>
          <span className="me-section-count">{filtered.length} sự kiện</span>
        </div>

        {/* Search + Filter */}
        <div className="me-search-row">
          <div className="me-search-wrap">
            <Search size={16} className="me-search-icon" />
            <input
              className="me-search-input"
              placeholder="Tìm kiếm sự kiện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="me-filter-wrap" ref={filterRef}>
            <button
              className={`me-funnel-btn${filterOpen || activeTag !== "Tất cả" ? " active" : ""}`}
              onClick={() => setFilterOpen((o) => !o)}
              title="Bộ lọc"
            >
              <SlidersHorizontal size={17} />
              {activeTag !== "Tất cả" && <span className="me-funnel-dot" />}
            </button>

            {filterOpen && (
              <div className="me-filter-dropdown">
                <p className="me-filter-dropdown-title">Lọc theo lĩnh vực</p>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`me-filter-option${activeTag === tag ? " selected" : ""}`}
                    onClick={() => { setActiveTag(tag); setFilterOpen(false); }}
                  >
                    <span className="me-filter-option-check">
                      {activeTag === tag && "✓"}
                    </span>
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="me-events-grid">
          {filtered.length === 0 ? (
            <p className="me-no-result">Không tìm thấy sự kiện phù hợp.</p>
          ) : (
            filtered.map((ev) => <EventCard key={ev.id} event={ev} />)
          )}
        </div>
      </div>
    </div>
  );
}
