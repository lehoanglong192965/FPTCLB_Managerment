import { Building2, Calendar, ShieldAlert, Users, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const STATS = [
  { label: "CLB đang hoạt động", value: "—", icon: Building2, color: "#E6430A", bg: "#FFF3EE" },
  { label: "Sự kiện tháng này",  value: "—", icon: Calendar,  color: "#7c3aed", bg: "#f5f3ff" },
  { label: "Đang xử lý kỷ luật",value: "—", icon: ShieldAlert,color: "#dc2626", bg: "#fef2f2" },
  { label: "Tổng sinh viên CLB", value: "—", icon: Users,     color: "#059669", bg: "#ecfdf5" },
];

const QUICK_LINKS = [
  { label: "Phê duyệt sự kiện",  href: "/icpdp/event-approval",     color: "#E6430A" },
  { label: "Nhật ký kỷ luật",    href: "/icpdp/discipline-log",      color: "#dc2626" },
  { label: "Điều động nhân sự",  href: "/icpdp/personnel-reassign",  color: "#7c3aed" },
  { label: "Quản lý tuyển dụng", href: "/icpdp/recruitment",         color: "#059669" },
  { label: "Danh sách đen",      href: "/icpdp/blacklist",            color: "#6b7280" },
];

export default function IcpdpOverview() {
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
          Bảng điều khiển IC-PDP — Quản lý hoạt động câu lạc bộ toàn trường
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {STATS.map((s) => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: 14, padding: "1.25rem",
            border: "1.5px solid #f0f0f0", display: "flex", alignItems: "center", gap: "0.875rem",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Quick links */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #f0f0f0" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 1rem" }}>Truy cập nhanh</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {QUICK_LINKS.map((l) => (
              <a key={l.label} href={l.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.625rem 0.875rem", borderRadius: 10,
                background: "#f9fafb", textDecoration: "none",
                color: "#111827", fontSize: 13, fontWeight: 500,
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f9fafb"}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Activity placeholder */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #f0f0f0" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={15} color="#9ca3af" /> Hoạt động gần đây
          </h3>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 0", color: "#9ca3af" }}>
            <TrendingUp size={36} strokeWidth={1.5} />
            <p style={{ marginTop: "0.75rem", fontSize: 13 }}>Dữ liệu thống kê sẽ hiển thị ở đây</p>
          </div>
        </div>
      </div>
    </div>
  );
}
