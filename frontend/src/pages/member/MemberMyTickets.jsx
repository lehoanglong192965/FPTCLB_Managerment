import { useState } from "react";
import { Ticket, Search } from "lucide-react";
import EventCard from "../../components/events/EventCard";

const INITIAL_TICKETS = [
  {
    id: 11, title: "Code War 2026",        club: "FPTU IT Club",
    color: "#E6430A", emoji: "💻",
    date: "15/07/2026", time: "15:00", location: "Hall A",
    currentParticipants: 120, maxParticipants: 150,
    ticketStatus: "registered",
  },
  {
    id: 12, title: "Tech Talk: AI & LLM",  club: "FPTU IT Club",
    color: "#0284c7", emoji: "🤖",
    date: "20/06/2026", time: "09:00", location: "Tòa nhà F – P.201",
    currentParticipants: 95, maxParticipants: 100,
    ticketStatus: "ongoing",
  },
  {
    id: 13, title: "Acoustic Night Vol.4", club: "FPTU Music Club",
    color: "#7c3aed", emoji: "🎵",
    date: "10/05/2026", time: "18:30", location: "Sân khấu ngoài trời",
    currentParticipants: 150, maxParticipants: 150,
    ticketStatus: "completed",
  },
];

const FILTER_TABS = [
  { key: "all",        label: "Tất cả"        },
  { key: "registered", label: "Đã đăng ký"    },
  { key: "ongoing",    label: "Đang diễn ra"  },
  { key: "completed",  label: "Đã kết thúc"   },
  { key: "cancelled",  label: "Đã hủy"        },
];

export default function MemberMyTickets() {
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const cancelledSet = new Set(JSON.parse(localStorage.getItem("fptclb_cancelled_tickets") ?? "[]"));
  const tickets      = INITIAL_TICKETS.map((t) =>
    cancelledSet.has(t.title) ? { ...t, ticketStatus: "cancelled" } : t
  );

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
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "5px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                cursor: "pointer", border: "1.5px solid",
                fontFamily: "inherit", transition: "all 0.15s",
                background:   activeTab === tab.key ? "#E6430A"   : "#fff",
                color:        activeTab === tab.key ? "#fff"       : "#6b7280",
                borderColor:  activeTab === tab.key ? "#E6430A"   : "#e5e7eb",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          {filtered.length} vé
        </p>

        {/* Grid */}
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
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {filtered.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
