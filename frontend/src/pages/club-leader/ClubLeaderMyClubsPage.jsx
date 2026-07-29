import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import ClubCard from "../../components/clubs/ClubCard";
import ClubSpace from "../../components/clubs/ClubSpace";
import authApi from "../../services/api/auth/authApi";
import clubApi from "../../services/api/clubs/clubApi";
import { useAuth } from "../../contexts/AuthContext";
import { normalizeClub } from "../../hooks/usePublicClubs";

const ROLE_LABEL = {
  Leader:     "Trưởng CLB",
  ViceLeader: "Phó Trưởng CLB",
  CoreTeam:   "Ban Điều Hành",
  Member:     "Thành viên",
};

const MANAGED_ROLE_NAMES = new Set(["Leader", "ViceLeader"]);

export default function ClubLeaderMyClubsPage() {
  const navigate                        = useNavigate();
  const { user }                        = useAuth();
  const [joinedClubs, setJoinedClubs]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [selectedClub, setSelectedClub] = useState(null);

  const base = user?.role === "VICE_LEADER" ? "/vice-leader" : "/club-leader";

  useEffect(() => {
    let cancelled = false;

    authApi.getMyClubRoles()
      .then(async (rolesRes) => {
        if (cancelled) return;
        const roles = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data ?? []);
        if (roles.length === 0) {
          setJoinedClubs([]);
          return;
        }

        const clubs = await Promise.all(roles.map(async (role) => {
          const matched = await clubApi.getById(role.clubID);
          const club = normalizeClub(matched?.data ?? matched);
          const roleLabel = ROLE_LABEL[role.roleName] ?? role.roleName ?? "Thành viên";
          return { ...club, role: roleLabel, isManaged: MANAGED_ROLE_NAMES.has(role.roleName) };
        }));
        if (cancelled) return;
        setJoinedClubs(clubs);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.code !== "ERR_CANCELED" && err?.name !== "CanceledError") {
          setError("Không thể tải danh sách câu lạc bộ.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const openClub = (club) => {
    // CLB đang quản lý dùng layout quản lý; CLB tham gia với vai trò Member mở không gian nội bộ.
    if (club.isManaged) navigate(`${base}/my-club/space`);
    else setSelectedClub(club);
  };

  if (selectedClub) {
    return (
      <ClubSpace
        club={selectedClub}
        canManage={false}
        onBack={() => setSelectedClub(null)}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Câu Lạc Bộ Của Tôi</h1>
        <p className="page-subtitle">Các câu lạc bộ bạn đang tham gia</p>
      </div>

      <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">CLB đã tham gia</h2>
          {!loading && !error && (
            <span className="text-[13px] text-gray-400">{joinedClubs.length} CLB</span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-[13px] m-0">Đang tải danh sách câu lạc bộ...</p>
          </div>
        ) : error ? (
          <p className="text-center py-10 text-red-400 text-sm m-0">{error}</p>
        ) : joinedClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-9 text-gray-400 gap-2">
            <Building2 size={36} strokeWidth={1.5} />
            <p className="text-sm m-0">Bạn chưa tham gia CLB nào.</p>
          </div>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {joinedClubs.map((club) => (
              <ClubCard key={club.id ?? club.abbr} club={club} onSelect={() => openClub(club)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
