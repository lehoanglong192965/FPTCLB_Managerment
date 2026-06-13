import { useEffect, useState } from "react";
import { Users, Calendar, Clock, TrendingUp } from "lucide-react";
import clubBoardApi from "../api/clubBoardApi";
import { TokenService } from "../../../services/api/axiosClient";
import { useAuth } from "../../auth/context/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function ClubOverview() {
  const { profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const clubId = TokenService.getClubId();
  const name = profile?.fullName?.split(" ").pop() ?? "bạn";

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    clubBoardApi.getBoard(clubId)
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  const leaderCount     = members.filter((m) => m.clubRoleName === "Leader").length;
  const viceCount       = members.filter((m) => m.clubRoleName === "ViceLeader").length;
  const memberCount     = members.filter((m) => m.clubRoleName === "Member").length;
  const totalCount      = members.length;

  const stats = [
    { label: "Tổng thành viên BĐH", value: loading ? "..." : totalCount, color: "#E6430A", bg: "#FFF3EE", icon: Users },
    { label: "Trưởng CLB",          value: loading ? "..." : leaderCount,  color: "#7c3aed", bg: "#f5f3ff", icon: TrendingUp },
    { label: "Phó Trưởng",          value: loading ? "..." : viceCount,    color: "#059669", bg: "#ecfdf5", icon: Users },
    { label: "Thành viên BĐH",      value: loading ? "..." : memberCount,  color: "#d97706", bg: "#fffbeb", icon: Users },
  ];

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          {getGreeting()}, {name}!
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
          Theo dõi hoạt động và số liệu của câu lạc bộ
        </p>
      </div>

      {/* Stats */}
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
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #f0f0f0" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={15} color="#9ca3af" /> Hoạt động gần đây
        </h3>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 0", color: "#9ca3af" }}>
          <Calendar size={36} strokeWidth={1.5} />
          <p style={{ marginTop: "0.75rem", fontSize: 13 }}>Chức năng đang được phát triển</p>
        </div>
      </div>
    </div>
  );
}
