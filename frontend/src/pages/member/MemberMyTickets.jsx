import { useState, useEffect } from "react";
import { Ticket, Search, Loader2 } from "lucide-react";
import EventCard from "../../components/events/EventCard";
import eventService from "../../services/api/events/eventService";
import clubService from "../../services/api/clubs/clubService";

const FILTER_TABS = [
  { key: "all",        label: "Tất cả"       },
  { key: "registered", label: "Đã đăng ký"   },
  { key: "ongoing",    label: "Đang làm BTC" },
];

export default function MemberMyTickets() {
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const [regRes, assignRes, clubRes] = await Promise.all([
          eventService.getMyRegistrations(),
          eventService.getMyAssignments(),
          clubService.getAll(),
        ]);

        const regs    = Array.isArray(regRes)    ? regRes    : (regRes.data    || []);
        const assigns = Array.isArray(assignRes) ? assignRes : (assignRes.data || []);
        const clubList = Array.isArray(clubRes)  ? clubRes   : (clubRes.data   || []);

        const mappedRegs = regs.map((e) => {
          const clubObj = clubList.find((c) => c.clubID === e.clubID);
          return {
            id: e.eventID,
            title: e.eventName,
            club: clubObj ? clubObj.name : "CLB FPTU",
            color: clubObj ? clubObj.color : "#E6430A",
            emoji: clubObj ? clubObj.emoji : "🎫",
            date: e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "",
            time: e.startDate ? new Date(e.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
            location: e.location || "Chưa xếp phòng",
            bannerUrl: e.bannerUrl ?? null,
            ticketStatus: "registered",
          };
        });

        const mappedAssigns = assigns.map((e) => {
          const clubObj = clubList.find((c) => c.clubID === e.clubID);
          return {
            id: e.eventID,
            title: e.eventName,
            club: clubObj ? clubObj.name : "CLB FPTU",
            color: clubObj ? clubObj.color : "#2563EB",
            emoji: clubObj ? clubObj.emoji : "🛠️",
            date: e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "",
            time: e.startDate ? new Date(e.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
            location: e.location || "Chưa xếp phòng",
            bannerUrl: e.bannerUrl ?? null,
            ticketStatus: "ongoing",
          };
        });

        // Gộp, ưu tiên vai trò BTC nếu trùng event
        const combined = [...mappedAssigns];
        mappedRegs.forEach((r) => {
          if (!combined.some((t) => t.id === r.id)) {
            combined.push(r);
          }
        });

        setTickets(combined);
      } catch (err) {
        console.error("Lỗi khi tải danh sách vé:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filtered = tickets.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                        e.club.toLowerCase().includes(search.toLowerCase());
    const matchTab    = activeTab === "all" || e.ticketStatus === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vé Của Tôi</h1>
        <p className="page-subtitle">Các sự kiện bạn đã đăng ký tham gia</p>
      </div>

      <div className="content-card">
        {/* Search */}
        <div className="relative mb-4" style={{ maxWidth: 360 }}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-[38px] pr-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none bg-gray-50 box-border font-[inherit] transition-colors focus:border-[#e6430a] focus:bg-white placeholder:text-gray-400"
            placeholder="Tìm kiếm sự kiện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 border-b-2 border-gray-200 mb-5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 font-[inherit] bg-transparent ${
                  isActive ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin inline text-gray-400" size={28} />
            <p className="text-sm text-gray-400 mt-2">Đang tải vé...</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              {filtered.length} vé
            </p>
            {filtered.length === 0 ? (
              <div className="page-placeholder">
                <Ticket size={48} className="page-placeholder-icon" />
                <p className="page-placeholder-label">
                  {tickets.length === 0
                    ? "Bạn chưa đăng ký sự kiện nào."
                    : "Không tìm thấy kết quả."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {filtered.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
