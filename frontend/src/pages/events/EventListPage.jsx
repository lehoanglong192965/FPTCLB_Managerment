import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "../../components/events/EventCard";
import eventService from "../../services/api/events/eventService";
import clubService from "../../services/api/clubs/clubService";
import { useAuth } from "../../contexts/AuthContext";

const BADGE_FILTERS = ["Tất cả", "Đăng ký mở", "Sắp diễn ra", "Hết chỗ"];

function getStatusBadge(status) {
  const s = (status || "").toUpperCase();
  if (s === "UPCOMING") return { badge: "Sắp diễn ra", badgeType: "upcoming" };
  if (s === "ONGOING")  return { badge: "Đang diễn ra", badgeType: "ongoing" };
  return { badge: "Đăng ký mở", badgeType: "open" };
}

export default function EventListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch]               = useState("");
  const [activeFilter, setActiveFilter]   = useState("Tất cả");
  const [rawEvents, setRawEvents]         = useState([]);
  const [clubs, setClubs]                 = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    let cancelled = false;

    const safeGet = async (fn, delayMs = 0) => {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      if (cancelled) return null;
      try {
        return await fn();
      } catch (err) {
        if (err?.code !== "ERR_CANCELED" && err?.name !== "CanceledError") throw err;
        await new Promise((r) => setTimeout(r, 250));
        if (cancelled) return null;
        return await fn();
      }
    };

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const requests = [
          safeGet(() => eventService.getApprovedEvents()),
          safeGet(() => clubService.getAll()),
          user ? eventService.getMyRegistrations().catch(() => []) : Promise.resolve([]),
        ];
        const [evRes, clubRes, regRes] = await Promise.all(requests);
        if (cancelled) return;

        if (evRes) setRawEvents(Array.isArray(evRes) ? evRes : (evRes?.content ?? evRes?.data ?? []));
        if (clubRes) setClubs(Array.isArray(clubRes) ? clubRes : (clubRes?.content ?? clubRes?.data ?? []));

        const regList = Array.isArray(regRes) ? regRes : [];
        setRegisteredIds(new Set(regList.map((r) => Number(r.eventID))));
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.error("Lỗi khi tải danh sách sự kiện:", err);
        setError("Không thể tải danh sách sự kiện.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [user]);

  const allEvents = rawEvents.map((e) => {
    const clubObj = clubs.find((c) => c.clubID === e.clubID);
    const startDt = e.startDate ? new Date(e.startDate) : null;
    const { badge, badgeType } = getStatusBadge(e.eventStatus);
    return {
      id:                  e.eventID,
      title:               e.eventName ?? "",
      club:                clubObj?.name ?? "CLB FPTU",
      emoji:               clubObj?.emoji ?? "🎉",
      color:               clubObj?.color ?? "#F37021",
      date:                startDt ? startDt.toLocaleDateString("vi-VN") : "",
      time:                startDt ? startDt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
      location:            e.location ?? "",
      desc:                e.description ?? "",
      badge,
      badgeType,
      maxParticipants:     e.maxParticipants     ?? 0,
      currentParticipants: e.currentParticipants ?? 0,
      bannerUrl:           e.bannerUrl ?? null,
    };
  });

  const filtered = allEvents.filter((event) => {
    if (registeredIds.has(Number(event.id))) return false;
    const matchFilter = activeFilter === "Tất cả" || event.badge === activeFilter;
    const matchSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.club.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-[900px] mx-auto px-[5%] pt-[calc(var(--header-h,68px)+48px)] pb-20">
      <button
        className="inline-flex items-center gap-1.5 mb-7 px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#4B5674] text-sm font-semibold cursor-pointer hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all font-[inherit]"
        onClick={() => navigate("/")}
      >
        ← Trang Chủ
      </button>

      <div className="mb-9">
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black text-[#0D1B3E] tracking-[-1.5px] mb-2.5">
          Danh Sách Sự Kiện
        </h1>
        <p className="text-[15px] text-[#4B5674]">
          Khám phá các workshop, hackathon và chương trình giao lưu sắp diễn ra.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-9">
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-[18px] py-3 focus-within:border-[#FF6B00] focus-within:shadow-[0_0_0_3px_rgba(255,107,0,0.15)] transition-all">
          <span>🔍</span>
          <input
            className="flex-1 border-none outline-none text-sm text-[#0D1B3E] bg-transparent placeholder-gray-400"
            placeholder="Tìm kiếm sự kiện, câu lạc bộ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {BADGE_FILTERS.map((f) => (
            <button
              key={f}
              className={`px-[18px] py-2 rounded-full border text-[13px] font-semibold cursor-pointer transition-all font-[inherit] ${
                activeFilter === f
                  ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-[0_2px_8px_rgba(255,107,0,0.35)]"
                  : "border-gray-200 bg-white text-[#4B5674] hover:border-[#FF6B00] hover:text-[#FF6B00]"
              }`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-center py-16">Đang tải sự kiện...</p>
        ) : error ? (
          <p className="text-center py-16 text-red-500">{error}</p>
        ) : filtered.length > 0 ? (
          filtered.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <p className="text-center text-gray-400 text-[15px] py-16">Không tìm thấy sự kiện nào.</p>
        )}
      </div>
    </div>
  );
}
