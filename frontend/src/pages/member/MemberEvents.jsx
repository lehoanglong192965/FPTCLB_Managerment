import { useState, useRef, useEffect } from "react";
import { Calendar, Search, SlidersHorizontal, CalendarDays } from "lucide-react";
import EventCard from "../../components/events/EventCard";

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

      {/* Sự kiện đã đăng ký */}
      <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">Sự kiện đã đăng ký</h2>
          <span className="text-[13px] text-gray-400">{mockRegisteredEvents.length} sự kiện</span>
        </div>

        {mockRegisteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-9 text-gray-400 gap-2">
            <Calendar size={36} strokeWidth={1.5} />
            <p className="text-sm m-0">Bạn chưa đăng ký sự kiện nào.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mockRegisteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3.5 px-4 py-3.5 border-[1.5px] border-[#f0f0f0] rounded-xl transition-all hover:border-[#e6430a33] hover:shadow-[0_2px_8px_rgba(230,67,10,0.07)]"
              >
                <div className="flex flex-col items-center justify-center w-[52px] min-h-[58px] bg-[#fff3ee] rounded-xl flex-shrink-0 py-1.5">
                  <span className="text-[9px] font-bold text-[#e6430a] uppercase tracking-[0.3px] leading-none">{ev.month}</span>
                  <span className="text-[22px] font-bold text-[#e6430a] leading-[1.1]">{ev.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 m-0 mb-0.5 truncate">{ev.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 m-0 mb-0.5">
                    <CalendarDays size={12} />
                    {ev.time} • {ev.location}
                  </p>
                  <p className="text-xs text-gray-400 m-0">{ev.club}</p>
                </div>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    ev.status === "registered"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {STATUS_LABEL[ev.status]}
                </span>
                <button className="px-3.5 py-[7px] rounded-lg border-none bg-blue-700 text-white text-[13px] font-medium cursor-pointer flex-shrink-0 transition-colors hover:bg-blue-800 font-[inherit]">
                  Xem vé
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sự kiện khác */}
      <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">Sự kiện khác</h2>
          <span className="text-[13px] text-gray-400">{filtered.length} sự kiện</span>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2.5 items-center mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-[38px] pr-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-[10px] text-sm text-gray-900 outline-none bg-gray-50 box-border font-[inherit] transition-colors focus:border-[#e6430a] focus:bg-white placeholder:text-gray-400"
              placeholder="Tìm kiếm sự kiện..."
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
              Không tìm thấy sự kiện phù hợp.
            </p>
          ) : (
            filtered.map((ev) => <EventCard key={ev.id} event={ev} />)
          )}
        </div>
      </div>
    </div>
  );
}
