import { Star, Calendar, Users, TrendingUp } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const MOCK_NEWS = [
  { id: 1, title: "Hackathon Alumni 2026 — Đăng ký ngay!", date: "05/07/2026", tag: "Sự kiện" },
  { id: 2, title: "Hội thảo nghề nghiệp: Từ sinh viên đến chuyên gia", date: "20/06/2026", tag: "Workshop" },
  { id: 3, title: "IT Club kỷ niệm 10 năm thành lập",  date: "01/06/2026", tag: "CLB" },
];

export default function AlumniHome() {
  const { profile } = useAuth();
  const name = profile?.fullName?.split(" ").pop() ?? "bạn";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          {getGreeting()}, {name}!
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
          Chào mừng bạn quay lại — theo dõi các hoạt động từ cộng đồng FPTU
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "CLB đã từng tham gia", value: "—", icon: Star,        color: "#E6430A", bg: "#FFF3EE" },
          { label: "Sự kiện sắp tới",      value: 2,   icon: Calendar,    color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Kết nối Alumni",        value: "—", icon: Users,       color: "#059669", bg: "#ecfdf5" },
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

      {/* News */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #f0f0f0" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={15} color="#9ca3af" /> Tin tức nổi bật
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {MOCK_NEWS.map((n) => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: "0.875rem",
              padding: "0.75rem 1rem", borderRadius: 10, background: "#f9fafb",
            }}>
              <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "#FFF3EE", color: "#E6430A", flexShrink: 0 }}>
                {n.tag}
              </span>
              <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#111827", margin: 0 }}>{n.title}</p>
              <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{n.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
