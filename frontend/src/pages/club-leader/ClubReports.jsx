import { BarChart2, Users, Calendar, TrendingUp, Award } from "lucide-react";
import { useEffect, useState } from "react";
import clubBoardApi from "../../services/api/club-leader/clubBoardApi";
import { TokenService } from "../../services/api/axiosClient";

export default function ClubReports() {
  const [memberCount, setMemberCount] = useState(null);
  const clubId = TokenService.getClubId();

  useEffect(() => {
    if (!clubId) return;
    clubBoardApi.getBoard(clubId)
      .then((data) => setMemberCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [clubId]);

  const stats = [
    { label: "Thành viên BĐH",  value: memberCount ?? "—", icon: Users,      color: "#E6430A", bg: "#FFF3EE" },
    { label: "Sự kiện đã tổ chức", value: 4,               icon: Calendar,   color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Tỉ lệ tham gia",  value: "85%",               icon: TrendingUp, color: "#059669", bg: "#ecfdf5" },
    { label: "Chứng nhận cấp",  value: 0,                   icon: Award,      color: "#d97706", bg: "#fffbeb" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Báo Cáo CLB</h1>
        <p className="page-subtitle">Thống kê hoạt động và số liệu của câu lạc bộ</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {stats.map((s) => (
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

      <div className="content-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
          <BarChart2 size={18} color="#9ca3af" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Biểu đồ hoạt động</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 0", color: "#9ca3af" }}>
          <BarChart2 size={48} strokeWidth={1.2} />
          <p style={{ marginTop: "0.75rem", fontSize: 13 }}>Biểu đồ chi tiết đang được phát triển</p>
        </div>
      </div>
    </div>
  );
}
