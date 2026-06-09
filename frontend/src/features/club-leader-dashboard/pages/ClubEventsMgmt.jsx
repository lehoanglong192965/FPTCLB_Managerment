import { useState } from "react";
import { Calendar, Plus, Clock, MapPin, Search } from "lucide-react";

const MOCK_EVENTS = [
  { id: 1, name: "Workshop UI/UX Design",  date: "15/07/2026", time: "14:00", location: "Hall A",         status: "upcoming", attendees: 45  },
  { id: 2, name: "Hackathon mùa hè 2026",  date: "20/07/2026", time: "08:00", location: "FPT Arena",      status: "upcoming", attendees: 120 },
  { id: 3, name: "Tech Talk: AI & LLM",    date: "01/06/2026", time: "15:00", location: "Phòng hội thảo", status: "done",     attendees: 67  },
  { id: 4, name: "CLB Anniversary Night",  date: "10/05/2026", time: "18:00", location: "Sân ngoài",      status: "done",     attendees: 200 },
];

const STATUS_CFG = {
  upcoming: { label: "Sắp diễn ra", color: "#059669", bg: "#ecfdf5" },
  done:     { label: "Đã kết thúc", color: "#6b7280", bg: "#f3f4f6" },
};

export default function ClubEventsMgmt() {
  const [search, setSearch] = useState("");
  const events = MOCK_EVENTS.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sự Kiện CLB</h1>
        <p className="page-subtitle">Quản lý lịch sự kiện của câu lạc bộ</p>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.75rem" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sự kiện..."
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button className="dl-btn-add" disabled style={{ opacity: 0.5, cursor: "not-allowed" }} title="Tính năng đang phát triển">
            <Plus size={15} /> Tạo sự kiện
          </button>
        </div>

        {events.length === 0 ? (
          <p className="approval-empty">Không tìm thấy sự kiện phù hợp.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {events.map((ev) => {
              const cfg = STATUS_CFG[ev.status];
              return (
                <div key={ev.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1.25rem", borderRadius: 12,
                  border: "1.5px solid #f0f0f0", background: "#fff",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFF3EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={20} color="#E6430A" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 4px" }}>{ev.name}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {ev.date} {ev.time}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {ev.location}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{ev.attendees} người</span>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
