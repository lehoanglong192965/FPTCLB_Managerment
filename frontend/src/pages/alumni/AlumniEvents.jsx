import { Calendar, Clock, MapPin } from "lucide-react";

const MOCK_EVENTS = [
  { id: 1, name: "Hackathon Alumni 2026",                    date: "15/08/2026", time: "08:00", location: "FPT Arena",         tag: "Sắp diễn ra" },
  { id: 2, name: "Hội thảo: Từ sinh viên đến chuyên gia",   date: "20/07/2026", time: "14:00", location: "Hội trường lớn",    tag: "Sắp diễn ra" },
  { id: 3, name: "Gala cựu sinh viên FPTU 2026",            date: "10/06/2026", time: "18:00", location: "Nhà hàng FPT",      tag: "Đã kết thúc" },
  { id: 4, name: "Workshop: Career Development for Alumni", date: "01/05/2026", time: "09:00", location: "Zoom Online",       tag: "Đã kết thúc" },
];

const TAG_CFG = {
  "Sắp diễn ra": { color: "#059669", bg: "#ecfdf5" },
  "Đã kết thúc":  { color: "#6b7280", bg: "#f3f4f6" },
};

export default function AlumniEvents() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sự Kiện Alumni</h1>
        <p className="page-subtitle">Các sự kiện dành riêng cho cựu sinh viên FPTU</p>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {MOCK_EVENTS.map((ev) => {
            const cfg = TAG_CFG[ev.tag] ?? { color: "#6b7280", bg: "#f3f4f6" };
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
                <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, flexShrink: 0 }}>
                  {ev.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
