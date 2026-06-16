import { Users, Briefcase, MapPin, Link } from "lucide-react";

const MOCK_ALUMNI = [
  { id: 1, name: "Trần Minh Khoa",   major: "SE",  year: 2022, company: "FPT Software",     role: "Software Engineer",   avatar: "K" },
  { id: 2, name: "Lê Thị Hoa",       major: "BA",  year: 2021, company: "Vingroup",          role: "Business Analyst",    avatar: "H" },
  { id: 3, name: "Nguyễn Quốc Bảo",  major: "AI",  year: 2023, company: "VNG Corporation",  role: "ML Engineer",         avatar: "B" },
  { id: 4, name: "Phạm Thị Lan",      major: "MKT", year: 2020, company: "Shopee Vietnam",   role: "Marketing Manager",   avatar: "L" },
  { id: 5, name: "Đinh Văn Nam",      major: "IS",  year: 2022, company: "Momo",              role: "Security Engineer",   avatar: "N" },
];

const COLORS = ["#E6430A", "#7c3aed", "#059669", "#d97706", "#0284c7"];

export default function AlumniNetwork() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mạng Lưới Alumni</h1>
        <p className="page-subtitle">Kết nối với cựu sinh viên FPTU trên toàn thế giới</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Thành viên Alumni", value: "1,200+", icon: Users,     color: "#E6430A", bg: "#FFF3EE" },
          { label: "Công ty đang làm",  value: "350+",   icon: Briefcase, color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Quốc gia",          value: "15+",    icon: MapPin,    color: "#059669", bg: "#ecfdf5" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: 14, padding: "1.25rem",
            border: "1.5px solid #f0f0f0", display: "flex", alignItems: "center", gap: "0.875rem",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 1rem" }}>Alumni nổi bật</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {MOCK_ALUMNI.map((a, i) => (
            <div key={a.id} style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "0.875rem 1.25rem", borderRadius: 12,
              border: "1.5px solid #f0f0f0", background: "#fff",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: COLORS[i % COLORS.length] + "18",
                color: COLORS[i % COLORS.length],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                {a.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 2px" }}>{a.name}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Briefcase size={11} /> {a.role} tại {a.company}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "#f3f4f6", color: "#6b7280" }}>
                  {a.major} · {a.year}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: "1rem" }}>
          Mạng lưới đầy đủ sẽ được tích hợp trong phiên bản tiếp theo
        </p>
      </div>
    </div>
  );
}
