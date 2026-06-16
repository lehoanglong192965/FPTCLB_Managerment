import { useState, useRef, useEffect } from "react";
import { ChevronRight, Star, Search, SlidersHorizontal } from "lucide-react";
import ClubCard from "../../components/clubs/ClubCard";
import ClubSpace from "./ClubSpace";

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

      {/* CLB đã tham gia */}
      <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">CLB đã tham gia</h2>
          <span className="text-[13px] text-gray-400">{mockJoinedClubs.length} CLB</span>
        </div>

        {mockJoinedClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-9 text-gray-400 gap-2">
            <Star size={36} strokeWidth={1.5} />
            <p className="text-sm m-0">Bạn chưa tham gia CLB nào.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mockJoinedClubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center gap-3.5 px-4 py-3.5 border-[1.5px] border-[#f0f0f0] rounded-xl transition-all hover:border-[#e6430a33] hover:shadow-[0_2px_8px_rgba(230,67,10,0.07)]"
              >
                <div
                  className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: club.color + "18" }}
                >
                  {club.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 m-0 mb-1 truncate">{club.name}</p>
                  <p className="flex items-center gap-2 text-xs text-gray-500 m-0">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
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
                <span className="px-3 py-0.5 rounded-full border border-gray-300 text-xs font-medium text-gray-700 bg-transparent whitespace-nowrap flex-shrink-0">
                  {club.role}
                </span>
                <button
                  className="flex items-center gap-1 px-3.5 py-[7px] rounded-lg border-[1.5px] border-[#e6430a] bg-transparent text-[#e6430a] text-[13px] font-medium cursor-pointer flex-shrink-0 transition-all hover:bg-[#e6430a] hover:text-white font-[inherit]"
                  onClick={() => setSelectedClub(club)}
                >
                  Vào không gian <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Câu lạc bộ khác */}
      <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">Câu lạc bộ khác</h2>
          <span className="text-[13px] text-gray-400">{filtered.length} CLB</span>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2.5 items-center mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-[38px] pr-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-[10px] text-sm text-gray-900 outline-none bg-gray-50 box-border font-[inherit] transition-colors focus:border-[#e6430a] focus:bg-white placeholder:text-gray-400"
              placeholder="Tìm kiếm câu lạc bộ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative flex-shrink-0" ref={filterRef}>
            <button
              className={`relative w-[42px] h-[42px] rounded-[10px] border-[1.5px] flex items-center justify-center cursor-pointer transition-all ${
                filterOpen || activeTag !== "Tất cả"
                  ? "border-[#e6430a] bg-[#fff7f5] text-[#e6430a]"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#e6430a] hover:bg-[#fff7f5] hover:text-[#e6430a]"
              }`}
              onClick={() => setFilterOpen((o) => !o)}
              title="Bộ lọc"
            >
              <SlidersHorizontal size={17} />
              {activeTag !== "Tất cả" && (
                <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#e6430a] border-[1.5px] border-white" />
              )}
            </button>

            {filterOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-[200px] bg-white border-[1.5px] border-gray-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] py-2 px-1.5 z-50">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.5px] px-2.5 pt-1 pb-2 m-0 border-b border-gray-100">
                  Lọc theo lĩnh vực
                </p>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`flex items-center gap-2 w-full px-2.5 py-2 border-none bg-none text-[13.5px] cursor-pointer rounded-lg font-[inherit] text-left transition-all hover:bg-[#fef3ed] hover:text-[#e6430a] ${
                      activeTag === tag ? "text-[#e6430a] font-semibold" : "text-gray-700"
                    }`}
                    onClick={() => { setActiveTag(tag); setFilterOpen(false); }}
                  >
                    <span className="w-4 text-[13px] text-[#e6430a] flex-shrink-0">
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
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filtered.length === 0 ? (
            <p className="col-span-full text-center py-10 text-gray-400 text-sm m-0">
              Không tìm thấy câu lạc bộ phù hợp.
            </p>
          ) : (
            filtered.map((club) => <ClubCard key={club.id} club={club} />)
          )}
        </div>
      </div>
    </div>
  );
}
