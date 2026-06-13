import { useState, useRef, useEffect } from "react";
import { ChevronRight, Star, Search, SlidersHorizontal } from "lucide-react";
import ClubCard from "../../clubs/components/ClubCard";
import ClubSpace from "./ClubSpace";
import "../../../assets/css/memberClubs.css";

const ALL_TAGS = ["Tất cả", "Âm nhạc", "Nghệ thuật", "Ngoại ngữ", "Thể thao", "STEM", "Cộng đồng", "Truyền thông"];

const mockJoinedClubs = [
  {
    id: 1,
    name: "FPTU IT Club",
    tag: "IT",
    color: "#1d4ed8",
    emoji: "💻",
    role: "Thành viên",
    members: 120,
  },
];

const mockOtherClubs = [
  { id: 2, name: "FPTU Music Club",     abbr: "music",     tag: "Âm nhạc",    color: "#7c3aed", emoji: "🎵", desc: "Nơi kết nối những người yêu âm nhạc tại FPTU, tổ chức biểu diễn và workshop âm nhạc.", members: 85,  recruiting: true  },
  { id: 3, name: "FPTU Art Club",       abbr: "art",       tag: "Nghệ thuật", color: "#db2777", emoji: "🎨", desc: "Sáng tạo không giới hạn — vẽ, thiết kế và triển lãm nghệ thuật định kỳ.", members: 64,  recruiting: false },
  { id: 4, name: "FPTU English Club",   abbr: "english",   tag: "Ngoại ngữ",  color: "#059669", emoji: "🌍", desc: "Luyện tiếng Anh qua các buổi debate, storytelling và giao lưu quốc tế.", members: 110, recruiting: true  },
  { id: 5, name: "FPTU Sport Club",     abbr: "sport",     tag: "Thể thao",   color: "#d97706", emoji: "⚽", desc: "Tổ chức các giải đấu thể thao và hoạt động rèn luyện sức khoẻ cho sinh viên.", members: 97,  recruiting: true  },
  { id: 6, name: "FPTU Dance Club",     abbr: "dance",     tag: "Nghệ thuật", color: "#e11d48", emoji: "💃", desc: "Học và biểu diễn các thể loại nhảy: hip-hop, contemporary, kpop cover.", members: 73,  recruiting: false },
  { id: 7, name: "FPTU Science Club",   abbr: "science",   tag: "STEM",       color: "#0284c7", emoji: "🔬", desc: "Nghiên cứu khoa học, tham gia hội thảo và cuộc thi STEM cấp quốc gia.", members: 48,  recruiting: true  },
  { id: 8, name: "FPTU Volunteer Club", abbr: "volunteer", tag: "Cộng đồng",  color: "#16a34a", emoji: "🤝", desc: "Hoạt động tình nguyện, kết nối cộng đồng và các chiến dịch xã hội.", members: 156, recruiting: false },
  { id: 9, name: "FPTU Media Club",     abbr: "media",     tag: "Truyền thông",color: "#9333ea",emoji: "📹", desc: "Sản xuất nội dung, quay phim, chụp ảnh và truyền thông sự kiện.", members: 62,  recruiting: true  },
];

export default function MemberClubs() {
  const [search, setSearch]         = useState("");
  const [activeTag, setActiveTag]   = useState("Tất cả");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
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

  const filtered = mockOtherClubs.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchTag    = activeTag === "Tất cả" || c.tag === activeTag;
    return matchSearch && matchTag;
  });

  if (selectedClub) {
    return <ClubSpace club={selectedClub} onBack={() => setSelectedClub(null)} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Câu Lạc Bộ</h1>
        <p className="page-subtitle">CLB bạn đang tham gia và khám phá thêm</p>
      </div>

      {/* ── CLB đã tham gia ── */}
      <div className="mc-section">
        <div className="mc-section-header">
          <h2 className="mc-section-title">CLB đã tham gia</h2>
          <span className="mc-section-count">{mockJoinedClubs.length} CLB</span>
        </div>

        {mockJoinedClubs.length === 0 ? (
          <div className="mc-empty">
            <Star size={36} strokeWidth={1.5} />
            <p>Bạn chưa tham gia CLB nào.</p>
          </div>
        ) : (
          <div className="mc-joined-list">
            {mockJoinedClubs.map((club) => (
              <div key={club.id} className="mc-joined-item">
                <div
                  className="mc-joined-thumb"
                  style={{ background: club.color + "18" }}
                >
                  {club.emoji}
                </div>
                <div className="mc-joined-info">
                  <p className="mc-joined-name">{club.name}</p>
                  <p className="mc-joined-meta">
                    <span
                      className="mc-joined-tag"
                      style={{
                        background: club.color + "18",
                        color: club.color,
                        border: `1px solid ${club.color}44`,
                      }}
                    >
                      {club.tag}
                    </span>
                    {club.members.toLocaleString()} thành viên
                  </p>
                </div>
                <span className="mc-joined-role-badge">{club.role}</span>
                <button
                  className="mc-joined-enter-btn"
                  onClick={() => setSelectedClub(club)}
                >
                  Vào không gian <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Danh sách câu lạc bộ chưa tham gia ── */}
      <div className="mc-section">
        <div className="mc-section-header">
          <h2 className="mc-section-title">Câu lạc bộ khác</h2>
          <span className="mc-section-count">{filtered.length} CLB</span>
        </div>

        {/* Search + Filter */}
        <div className="mc-search-row">
          <div className="mc-search-wrap">
            <Search size={16} className="mc-search-icon" />
            <input
              className="mc-search-input"
              placeholder="Tìm kiếm câu lạc bộ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mc-filter-wrap" ref={filterRef}>
            <button
              className={`mc-funnel-btn${filterOpen || activeTag !== "Tất cả" ? " active" : ""}`}
              onClick={() => setFilterOpen((o) => !o)}
              title="Bộ lọc"
            >
              <SlidersHorizontal size={17} />
              {activeTag !== "Tất cả" && (
                <span className="mc-funnel-dot" />
              )}
            </button>

            {filterOpen && (
              <div className="mc-filter-dropdown">
                <p className="mc-filter-dropdown-title">Lọc theo lĩnh vực</p>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`mc-filter-option${activeTag === tag ? " selected" : ""}`}
                    onClick={() => { setActiveTag(tag); setFilterOpen(false); }}
                  >
                    <span className="mc-filter-option-check">
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
        <div className="mc-discover-grid">
          {filtered.length === 0 ? (
            <p className="mc-no-result">Không tìm thấy câu lạc bộ phù hợp.</p>
          ) : (
            filtered.map((club) => <ClubCard key={club.id} club={club} />)
          )}
        </div>
      </div>
    </div>
  );
}
