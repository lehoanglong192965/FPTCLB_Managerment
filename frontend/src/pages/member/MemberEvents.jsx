import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import EventCard from "../../components/events/EventCard";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import { useAuth } from "../../contexts/AuthContext";

const ALL_TAGS = ["Tất cả", "Công nghệ", "Âm nhạc", "Thể thao", "Hội thảo", "Cộng đồng", "Giải trí"];

export default function MemberEvents() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("Tất cả");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [eventRes, internalRes, clubRes, regRes] = await Promise.all([
          eventApi.getApprovedEvents().catch(() => []),
          user ? eventApi.getMyInternalEvents().catch(() => []) : Promise.resolve([]),
          clubApi.getAll().catch(() => []),
          user ? eventApi.getMyRegistrations().catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;

        const publicEvents = Array.isArray(eventRes) ? eventRes : (eventRes?.content ?? eventRes?.data ?? []);
        const internalEvents = Array.isArray(internalRes) ? internalRes : (internalRes?.content ?? internalRes?.data ?? []);
        setEvents([...new Map([...publicEvents, ...internalEvents].map((event) => [event.eventID, event])).values()]);
        setClubs(Array.isArray(clubRes) ? clubRes : (clubRes?.content ?? clubRes?.data ?? []));

        const regList = Array.isArray(regRes) ? regRes : [];
        setRegisteredIds(new Set(regList.map((r) => Number(r.eventID))));
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.error("Lỗi khi tải sự kiện/CLB:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mappedEvents = events.map((e) => {
    const clubObj = clubs.find((c) => c.clubID === e.clubID);
    const isRegistered = registeredIds.has(Number(e.eventID));
    return {
      id: e.eventID,
      title: e.eventName,
      club: clubObj ? (clubObj.clubName || clubObj.name || clubObj.clubCode || "CLB FPTU") : "CLB FPTU",
      emoji: clubObj ? clubObj.emoji : "🏛️",
      color: clubObj ? clubObj.color : "#E6430A",
      tag: clubObj ? (clubObj.tag || "") : "",
      date: e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "",
      time: e.startDate ? new Date(e.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
      venue: e.location || "Chưa xếp phòng",
      desc: e.description,
      badgeType: isRegistered ? "registered" : ((e.eventStatus || "").toUpperCase() === "ONGOING" ? "ongoing" : "open"),
      bannerUrl: e.bannerUrl ?? null,
      maxParticipants: e.maxParticipants ?? 0,
      currentParticipants: e.currentParticipants ?? 0,
      ticketStatus: isRegistered ? "registered" : undefined,
      isInternal: e.isInternal === true,
    };
  });

  const filtered = mappedEvents.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                        e.club.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === "Tất cả" || e.tag === activeTag;
    return matchSearch && matchTag;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Khám Phá Sự Kiện</h1>
        <p className="page-subtitle">Tìm và đăng ký sự kiện từ các câu lạc bộ</p>
      </div>

      <div className="content-card">
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

        {loading ? (
          <p className="text-center py-10 text-sm text-gray-400">Đang tải sự kiện...</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              {filtered.length} sự kiện
            </p>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {filtered.length === 0 ? (
                <p className="col-span-full text-center py-10 text-gray-400 text-sm m-0">
                  Không tìm thấy sự kiện phù hợp.
                </p>
              ) : (
                filtered.map((ev) => <EventCard key={ev.id} event={ev} />)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
