import { Star, Users, Calendar } from "lucide-react";

const MOCK_CLUBS = [
  { id: 1, name: "FPTU IT Club",       tag: "IT",         color: "#1d4ed8", emoji: "💻", period: "2020 – 2024", role: "Thành viên" },
  { id: 2, name: "FPTU English Club",  tag: "Ngoại ngữ",  color: "#059669", emoji: "🌍", period: "2021 – 2023", role: "Ban điều hành" },
];

export default function AlumniClubs() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Câu Lạc Bộ Cũ</h1>
        <p className="page-subtitle">Các CLB bạn từng tham gia tại FPTU</p>
      </div>

      <div className="content-card">
        {MOCK_CLUBS.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem", color: "#9ca3af" }}>
            <Star size={48} strokeWidth={1.2} />
            <p style={{ marginTop: "0.75rem", fontSize: 13 }}>Chưa có dữ liệu CLB</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {MOCK_CLUBS.map((club) => (
              <div key={club.id} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "1rem 1.25rem", borderRadius: 12,
                border: "1.5px solid #f0f0f0", background: "#fff",
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: club.color + "18", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {club.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 2px" }}>{club.name}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={11} /> {club.period}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: club.color + "18", color: club.color }}>
                    {club.tag}
                  </span>
                  <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: "#f3f4f6", color: "#6b7280" }}>
                    {club.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: "1rem" }}>
          Dữ liệu CLB alumni sẽ được đồng bộ trong phiên bản tiếp theo
        </p>
      </div>
    </div>
  );
}
