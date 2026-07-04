import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import ClubCard from "../../components/clubs/ClubCard";
import ClubSpace from "./ClubSpace";
import authApi from "../../services/api/auth/authApi";
import clubService from "../../services/api/clubs/clubService";
import { normalizeClub } from "../../hooks/usePublicClubs";

const ROLE_LABEL = {
  Leader:     "Trưởng CLB",
  ViceLeader: "Phó Trưởng",
  CoreTeam:   "Ban Điều Hành",
  Member:     "Thành viên",
};

export default function MemberMyClubs() {
  const [selectedClub, setSelectedClub] = useState(null);
  const [joinedClubs, setJoinedClubs]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => {
    let cancelled = false;

    authApi.getMyClubRole()
      .then(async (roleRes) => {
        if (cancelled) return;
        const clubID = roleRes?.clubID;
        if (!clubID) {
          setJoinedClubs([]);
          return;
        }

        const clubsRaw = await clubService.getAllPublic().catch(() => []);
        const allClubs = Array.isArray(clubsRaw)
          ? clubsRaw
          : (clubsRaw?.content ?? clubsRaw?.data ?? []);
        let matched = allClubs.find((c) => c.clubID === clubID || c.id === clubID);

        if (!matched) {
          matched = await clubService.getById(clubID);
        }

        if (cancelled) return;
        const club = normalizeClub(matched);
        const roleLabel = ROLE_LABEL[roleRes.roleName] ?? roleRes.roleName ?? "Thành viên";
        setJoinedClubs([{ ...club, role: roleLabel }]);
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

  if (selectedClub) {
    return <ClubSpace club={selectedClub} onBack={() => setSelectedClub(null)} />;
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
            <Star size={36} strokeWidth={1.5} />
            <p className="text-sm m-0">Bạn chưa tham gia CLB nào.</p>
          </div>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {joinedClubs.map((club) => (
              <ClubCard key={club.id ?? club.abbr} club={club} onSelect={() => setSelectedClub(club)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
