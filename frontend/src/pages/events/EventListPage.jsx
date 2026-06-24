import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "../../components/events/EventCard";
import eventService from "../../services/api/events/eventService";

const BADGE_FILTERS = ["Tất cả", "Đăng ký mở", "Sắp diễn ra", "Hết chỗ"];

export default function EventListPage() {
  const navigate = useNavigate();
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await eventService.getApprovedEvents();
        console.log("Response API:", response); // Debug log
        setEvents(Array.isArray(response) ? response : (response.data || []));
      } catch (error) {
        console.error("Lỗi khi tải danh sách sự kiện:", error);
        setError("Không thể tải danh sách sự kiện.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Map lại dữ liệu từ backend sang format frontend yêu cầu (nếu cần)
  const allEvents = events.map(e => ({
      id: e.eventID,
      title: e.eventName,
      club: "CLB", // Cần API lấy tên CLB
      date: e.startDate ? new Date(e.startDate).toLocaleDateString() : "",
      time: e.startDate ? new Date(e.startDate).toLocaleTimeString() : "",
      venue: e.location,
      desc: e.description,
      badge: "Đăng ký mở", // Cần logic mapping trạng thái
      badgeType: "open"
  }));

  const filtered = allEvents.filter((event) => {
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