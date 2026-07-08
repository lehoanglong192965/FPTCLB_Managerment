import { useEffect, useMemo, useState } from "react";
import { Award, Crown, Loader2, Medal, RefreshCw, Search, Trophy } from "lucide-react";
import authApi from "../../services/api/auth/authApi";
import clubService from "../../services/api/clubs/clubService";
import { TokenService } from "../../services/api/axiosClient";

const AVATAR_COLORS = ["#2563eb", "#e6430a", "#059669", "#7c3aed", "#db2777", "#d97706"];

const TIER_DETAILS = {
  "S-Tier (Xuất sắc)": {
    shortLabel: "S-Tier",
    description: "Nhóm nòng cốt, gánh vác vị trí quan trọng hoặc đi hầu hết các event lớn.",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
  },
  "A-Tier (Tích cực)": {
    shortLabel: "A-Tier",
    description: "Thành viên đại trà nhưng tích cực, làm tốt các công việc được giao ở mức tròn vai.",
    chip: "border-slate-200 bg-slate-50 text-slate-700",
  },
  "B-Tier (Hoạt động tốt)": {
    shortLabel: "B-Tier",
    description: "Thành viên có tham gia nhưng ngắt quãng, đóng góp ở mức tối thiểu để duy trì sự hiện diện.",
    chip: "border-orange-200 bg-orange-50 text-orange-800",
  },
  "C-Tier (Cảnh cáo)": {
    shortLabel: "C-Tier",
    description: "Thành viên gần như biến mất, không check-in event, không nhận role hoặc bị trừ nhiều điểm.",
    chip: "border-red-200 bg-red-50 text-red-700",
  },
};

const PODIUM_META = {
  1: {
    title: "1ST PLACE - GOLD",
    icon: Crown,
    shell: "border-amber-300 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200 shadow-[0_16px_34px_rgba(217,119,6,0.22)] md:min-h-[286px] md:-mt-5",
    header: "bg-gradient-to-r from-amber-300 to-yellow-200 text-amber-950",
    accent: "text-amber-700",
    ring: "ring-4 ring-amber-300/70 bg-amber-100 text-amber-800",
  },
  2: {
    title: "2ND PLACE - SILVER",
    icon: Medal,
    shell: "border-slate-300 bg-gradient-to-b from-slate-50 via-white to-slate-200 shadow-[0_12px_26px_rgba(71,85,105,0.16)] md:min-h-[252px]",
    header: "bg-gradient-to-r from-slate-200 to-white text-slate-800",
    accent: "text-slate-600",
    ring: "ring-4 ring-slate-300/80 bg-slate-100 text-slate-700",
  },
  3: {
    title: "3RD PLACE - BRONZE",
    icon: Award,
    shell: "border-orange-300 bg-gradient-to-b from-orange-100 via-white to-orange-200 shadow-[0_12px_26px_rgba(194,65,12,0.16)] md:min-h-[252px]",
    header: "bg-gradient-to-r from-orange-300 to-orange-100 text-orange-950",
    accent: "text-orange-700",
    ring: "ring-4 ring-orange-300/75 bg-orange-100 text-orange-800",
  },
};

function normalizeText(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function resolveMemberTier(totalScore) {
  const score = Number(totalScore ?? 0);
  if (score >= 150) return "S-Tier (Xuất sắc)";
  if (score >= 80) return "A-Tier (Tích cực)";
  if (score >= 20) return "B-Tier (Hoạt động tốt)";
  return "C-Tier (Cảnh cáo)";
}

function getTierDetail(memberTier) {
  return TIER_DETAILS[memberTier] ?? TIER_DETAILS["C-Tier (Cảnh cáo)"];
}

function formatPoints(value) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} pts`;
}

function getStoredClubId() {
  const fromToken = TokenService.getClubId();
  if (fromToken) return fromToken;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.clubId ?? null;
  } catch {
    return null;
  }
}

function pickClubId(item) {
  return item?.clubID ?? item?.clubId ?? item?.id ?? item?.club?.clubID ?? item?.club?.id ?? null;
}

async function resolveReadableClubId() {
  const storedClubId = getStoredClubId();
  if (storedClubId) return storedClubId;

  try {
    const role = await authApi.getMyClubRole();
    const clubId = pickClubId(role);
    if (clubId) return clubId;
  } catch (err) {
    if (err?.code !== "ERR_CANCELED" && err?.name !== "CanceledError") {
      console.warn("Khong lay duoc CLB tu vai tro hien tai:", err);
    }
  }

  try {
    const clubs = await clubService.getMyClubs();
    const list = Array.isArray(clubs) ? clubs : (clubs?.data ?? clubs?.clubs ?? clubs?.content ?? []);
    return pickClubId(list[0]);
  } catch (err) {
    if (err?.code !== "ERR_CANCELED" && err?.name !== "CanceledError") {
      console.warn("Khong lay duoc danh sach CLB cua member:", err);
    }
  }

  return null;
}

function normalizeRankingItem(item, index) {
  const memberTier = item.memberTier ?? resolveMemberTier(item.totalScore);
  return {
    rank: item.rank ?? index + 1,
    userId: item.userId,
    fullName: item.fullName ?? "Thành viên CLB",
    studentId: item.studentId ?? item.email ?? "",
    role: item.clubRoleName ?? "Member",
    memberTier,
    memberTierDescription: item.memberTierDescription ?? getTierDetail(memberTier).description,
    totalScore: Number(item.totalScore ?? 0),
    contributionPoint: Number(item.contributionPoint ?? 0),
    eventParticipationPoint: Number(item.eventParticipationPoint ?? 0),
    performancePoint: Number(item.performancePoint ?? 0),
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
  };
}

function RankingAvatar({ member, large = false }) {
  return (
    <div
      className={`${large ? "w-20 h-20 text-xl" : "w-9 h-9 text-xs"} rounded-full flex items-center justify-center font-extrabold shrink-0 text-white shadow-sm`}
      style={{ background: member.avatarColor }}
    >
      {getInitials(member.fullName)}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 min-w-[108px] text-center">
      <p className="text-[20px] font-extrabold text-gray-950 m-0 leading-none">{value}</p>
      <p className="text-[11px] font-medium text-gray-500 m-0 mt-1">{label}</p>
    </div>
  );
}

function PodiumCard({ member, place }) {
  const meta = PODIUM_META[place];
  const Icon = meta.icon;
  const tier = member ? getTierDetail(member.memberTier) : null;

  if (!member) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-dashed ${meta.shell} opacity-70`}>
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 text-center h-full min-h-[220px]">
          <div className={`w-full rounded-lg px-3 py-2 text-[13px] font-extrabold uppercase tracking-wide ${meta.header}`}>
            {meta.title}
          </div>
          <div className={`mt-6 w-20 h-20 rounded-full flex items-center justify-center ${meta.ring}`}>
            <Icon size={28} />
          </div>
          <p className="text-[13px] font-extrabold text-gray-700 m-0 mt-5 uppercase">Chưa có dữ liệu</p>
          <p className="text-[11.5px] text-gray-500 m-0 mt-1">Hạng này sẽ hiển thị khi CLB có thêm thành viên đủ điểm.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${meta.shell}`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,116,144,0.14)_0%,rgba(15,23,42,0)_42%),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[length:auto,28px_28px,28px_28px]" />
      <div className="relative z-10 flex flex-col items-center px-4 pb-4 text-center h-full">
        <div className={`w-full rounded-b-lg px-3 py-2 text-[13px] font-extrabold uppercase tracking-wide ${meta.header}`}>
          {meta.title}
        </div>
        <div className="mt-4 relative">
          <RankingAvatar member={member} large />
          <div className={`absolute -right-2 -bottom-1 w-8 h-8 rounded-full flex items-center justify-center ${meta.ring}`}>
            <Icon size={16} />
          </div>
        </div>
        <span className="mt-4 px-3 py-1 rounded-full bg-white/70 border border-white text-[11px] font-bold uppercase text-gray-700 shadow-sm">
          {tier.shortLabel}
        </span>
        <h3 className="text-[14px] font-extrabold text-gray-950 m-0 mt-3 uppercase leading-snug">
          {member.fullName}
        </h3>
        <p className="text-[11.5px] text-gray-500 m-0 mt-1 truncate max-w-full">{member.studentId}</p>
        <p className={`text-sm font-extrabold m-0 mt-3 ${meta.accent}`}>{formatPoints(member.totalScore)}</p>
        <p className="text-[11.5px] text-gray-500 m-0 mt-1">Vai trò: {member.role}</p>
      </div>
    </div>
  );
}

export default function MemberLeaderboardPage() {
  const [clubName, setClubName] = useState("CLB");
  const [rankings, setRankings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const activeClubId = await resolveReadableClubId();
      if (!activeClubId) {
        setRankings([]);
        setError("Không tìm thấy CLB active của tài khoản để xem BXH.");
        return;
      }
      const [clubRes, rankingRes] = await Promise.allSettled([
        clubService.getById(activeClubId),
        clubService.getMemberRankings(activeClubId),
      ]);

      if (clubRes.status === "fulfilled") {
        const club = clubRes.value?.data ?? clubRes.value ?? {};
        setClubName(club.clubName ?? club.name ?? club.clubCode ?? `CLB #${activeClubId}`);
      } else {
        setClubName(`CLB #${activeClubId}`);
      }

      if (rankingRes.status === "rejected") {
        throw rankingRes.reason;
      }
      const raw = rankingRes.value?.data ?? rankingRes.value ?? [];
      setRankings(Array.isArray(raw) ? raw : []);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.error("Lỗi khi tải BXH thành viên:", err);
      setError(err?.response?.data?.message ?? err?.message ?? "Không thể tải BXH thành viên.");
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const rows = useMemo(
    () => rankings
      .map(normalizeRankingItem)
      .sort((a, b) => a.rank - b.rank || b.totalScore - a.totalScore || a.fullName.localeCompare(b.fullName)),
    [rankings]
  );

  const filteredRows = useMemo(() => {
    const query = normalizeText(search);
    if (!query) return rows;
    return rows.filter((row) => normalizeText(`${row.fullName} ${row.studentId} ${row.role}`).includes(query));
  }, [rows, search]);

  const topRows = rows.slice(0, 3);
  const averageScore = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.totalScore, 0) / rows.length)
    : 0;

  if (loading) {
    return (
      <div className="content-card min-h-[320px] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm m-0">Đang tải BXH thành viên...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#E6430A] mb-1.5">
            <Trophy size={15} /> Member Leaderboard
          </div>
          <h1 className="text-2xl font-extrabold text-gray-950 m-0">BXH thành viên - {clubName}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatPill label="Thành viên" value={rows.length} />
          <StatPill label="Điểm cao nhất" value={topRows[0]?.totalScore ?? 0} />
          <StatPill label="Điểm TB" value={averageScore} />
          <button
            type="button"
            onClick={loadLeaderboard}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-500 cursor-pointer hover:text-[#E6430A] hover:border-orange-200 transition-colors"
            title="Tải lại BXH"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-2 text-center px-6">
          <Trophy size={38} className="text-red-300" />
          <p className="text-sm font-semibold text-red-500 m-0">{error}</p>
          <p className="text-xs text-gray-400 m-0">Kiểm tra quyền Leader của CLB hoặc thử tải lại trang.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-2 text-center px-6">
          <Trophy size={40} className="text-gray-300" />
          <p className="text-sm font-semibold text-gray-500 m-0">CLB chưa có dữ liệu BXH thành viên.</p>
          <p className="text-xs text-gray-400 m-0">Khi member có điểm đóng góp, dữ liệu sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <>
          <div className="p-6 bg-gradient-to-b from-sky-50 to-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
              <div>
                <p className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wide m-0">Top 3 Member Ranking</p>
                <p className="text-xs text-gray-500 m-0 mt-1">Xếp theo điểm đóng góp, tham gia thực tế và điểm phạt.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-gray-500">
                <div><strong className="block text-gray-900">base</strong>Đóng góp</div>
                <div><strong className="block text-gray-900">bonus</strong>Sự kiện</div>
                <div><strong className="block text-gray-900">penalty</strong>Phạt</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <PodiumCard member={topRows[1]} place={2} />
              <PodiumCard member={topRows[0]} place={1} />
              <PodiumCard member={topRows[2]} place={3} />
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 my-4">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide m-0">Full Leaderboard</h2>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white min-w-[260px]">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  className="flex-1 border-none outline-none text-[13px] text-gray-900 bg-transparent font-[inherit] placeholder:text-gray-300"
                  placeholder="Tìm thành viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold">Rank</th>
                    <th className="text-left px-4 py-3 font-bold">Name</th>
                    <th className="text-left px-4 py-3 font-bold">Role</th>
                    <th className="text-left px-4 py-3 font-bold">Tier</th>
                    <th className="text-left px-4 py-3 font-bold">Ý nghĩa</th>
                    <th className="text-right px-4 py-3 font-bold">Đóng góp</th>
                    <th className="text-right px-4 py-3 font-bold">Sự kiện</th>
                    <th className="text-right px-4 py-3 font-bold">Phạt</th>
                    <th className="text-right px-4 py-3 font-bold">Final Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`${row.rank}-${row.userId ?? row.fullName}`} className="border-t border-gray-100 hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-gray-900">#{row.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <RankingAvatar member={row} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 m-0 truncate">{row.fullName}</p>
                            <p className="text-[11px] text-gray-400 m-0 truncate">{row.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.role}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getTierDetail(row.memberTier).chip}`}>
                          {getTierDetail(row.memberTier).shortLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[280px]">{row.memberTierDescription}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.contributionPoint}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.eventParticipationPoint}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.performancePoint}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-[#E6430A]">{row.totalScore}</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                        Không tìm thấy thành viên phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
