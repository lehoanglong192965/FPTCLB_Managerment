import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp } from "lucide-react";
import clubBoardApi from "../../services/api/club-leader/clubBoardApi";
import { TokenService } from "../../services/api/axiosClient";
import { useAuth } from "../../contexts/AuthContext";
import { getGreeting } from "../../utils/greeting";
import { CLUB_ROLE_NAMES } from "../../constants/roles";

export default function ClubOverview() {
  const { profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const clubId = TokenService.getClubId();
  const name = profile?.fullName?.split(" ").pop() ?? "bạn";

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    clubBoardApi.getBoard(clubId)
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.error("Failed to fetch club board:", err);
        setError("Không thể tải dữ liệu thành viên.");
      })
      .finally(() => setLoading(false));
  }, [clubId]);

  const leaderCount = members.filter((m) => m.clubRoleName === CLUB_ROLE_NAMES.LEADER).length;
  const viceCount   = members.filter((m) => m.clubRoleName === CLUB_ROLE_NAMES.VICE_LEADER).length;
  const memberCount = members.filter((m) => m.clubRoleName === CLUB_ROLE_NAMES.MEMBER).length;
  const totalCount  = members.length;

  const stats = [
    { label: "Tổng thành viên BĐH", value: loading ? "..." : totalCount, color: "#E6430A", bg: "#FFF3EE", icon: Users },
    { label: "Trưởng CLB",          value: loading ? "..." : leaderCount, color: "#7c3aed", bg: "#f5f3ff", icon: TrendingUp },
    { label: "Phó Trưởng",          value: loading ? "..." : viceCount,   color: "#059669", bg: "#ecfdf5", icon: Users },
    { label: "Thành viên BĐH",      value: loading ? "..." : memberCount, color: "#d97706", bg: "#fffbeb", icon: Users },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{getGreeting()}, {name}!</h1>
        <p className="text-sm text-gray-500">Theo dõi hoạt động và số liệu của câu lạc bộ</p>
      </div>

      {error && (
        <div className="text-red-700 p-4 bg-red-100 rounded-[10px] mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-[14px] p-5 border border-[#f0f0f0] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 m-0">{s.value}</p>
              <p className="text-xs text-gray-400 m-0">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[14px] p-5 border border-[#f0f0f0]">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-1.5">
          <Clock size={15} color="#9ca3af" /> Hoạt động gần đây
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
          <Clock size={32} strokeWidth={1.5} />
          <p className="text-[13px] m-0">Tính năng nhật ký hoạt động sẽ được cập nhật trong phiên bản tới.</p>
        </div>
      </div>
    </div>
  );
}
