import { useState, useEffect } from "react";
import {
  ArrowLeft, Users, Calendar, Megaphone,
  Pin, Search, MapPin, Clock, Trophy, Medal,
  Crown, Award, Loader2,
} from "lucide-react";
import clubService from "../../services/api/clubs/clubService";

const SPACE_DATA = {
  1: {
    cover: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    stats: { events: 5, posts: 12, founded: "01/2020" },
    feed: [
      {
        id: 1,
        type: "pinned",
        author: "Nguyễn Văn An",
        role: "Trưởng CLB",
        avatar: "A",
        time: "2 giờ trước",
        content:
          "📌 Họp CLB tháng 7 sẽ diễn ra lúc **19:00 ngày 10/07/2026** tại Phòng Lab 3A. Tất cả thành viên vui lòng tham dự đầy đủ và đúng giờ.",
      },
      {
        id: 2,
        type: "post",
        author: "Trần Thị Bình",
        role: "Phó CLB",
        avatar: "B",
        time: "1 ngày trước",
        content:
          "🎉 Kết quả Hackathon nội bộ đã có! Chúc mừng team **Infinity** với dự án AI Chatbot xuất sắc. Cảm ơn tất cả thành viên đã tham gia!",
      },
      {
        id: 3,
        type: "post",
        author: "Lê Minh Khoa",
        role: "Thành viên",
        avatar: "K",
        time: "3 ngày trước",
        content:
          "Chia sẻ tài liệu ôn tập Data Structures cho buổi workshop tuần tới. Mọi người tải về và đọc trước nhé 📚",
      },
    ],
    members: [
      { id: 1, name: "Nguyễn Văn An",   studentId: "SE171234", role: "Trưởng CLB", joinDate: "01/2020", avatar: "A", color: "#1d4ed8" },
      { id: 2, name: "Trần Thị Bình",   studentId: "SE181205", role: "Phó CLB",    joinDate: "03/2021", avatar: "B", color: "#7c3aed" },
      { id: 3, name: "Lê Minh Khoa",    studentId: "SE201034", role: "Thành viên", joinDate: "09/2022", avatar: "K", color: "#059669" },
      { id: 4, name: "Phạm Thị Lan",    studentId: "SE211089", role: "Thành viên", joinDate: "01/2023", avatar: "L", color: "#db2777" },
      { id: 5, name: "Hoàng Đức Mạnh",  studentId: "SE221156", role: "Thành viên", joinDate: "09/2023", avatar: "M", color: "#d97706" },
      { id: 6, name: "Vũ Thu Nga",      studentId: "SE231001", role: "Thành viên", joinDate: "01/2024", avatar: "N", color: "#0284c7" },
    ],
    events: [
      { id: 1, name: "Code War 2026",          date: "15/07/2026", time: "15:00", location: "Hall A",        status: "upcoming" },
      { id: 2, name: "IT Workshop — AI cơ bản",date: "28/07/2026", time: "09:00", location: "Phòng Lab 3A",  status: "upcoming" },
      { id: 3, name: "Hackathon nội bộ 2026",  date: "05/06/2026", time: "08:00", location: "Tòa FPT",       status: "done"     },
      { id: 4, name: "Tech Talk Vol.3",         date: "18/04/2026", time: "18:00", location: "Phòng hội thảo",status: "done"     },
    ],
  },
};

const DEFAULT_SPACE = SPACE_DATA[1];

function getSpace(clubId) {
  return SPACE_DATA[clubId] ?? DEFAULT_SPACE;
}

function FeedPost({ post }) {
  const parts = post.content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className={`rounded-2xl p-5 shadow-sm border ${post.type === "pinned" ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}>
      {post.type === "pinned" && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E6430A] uppercase tracking-wide mb-3">
          <Pin size={11} /> Ghim
        </div>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "#e6430a22", color: "#e6430a" }}
        >
          {post.avatar}
        </div>
        <div>
          <p className="text-[13.5px] font-semibold text-gray-900 m-0 mb-0.5">
            {post.author} <span className="text-[11.5px] font-normal text-gray-500 ml-1.5">{post.role}</span>
          </p>
          <p className="text-[11.5px] text-gray-400 m-0">{post.time}</p>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed m-0">
        {parts.map((p, i) =>
          p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p
        )}
      </p>
    </div>
  );
}

function MemberRow({ member }) {
  return (
    <div className="flex items-center gap-3.5 px-4.5 py-3.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div
        className="w-9.5 h-9.5 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: member.color + "22", color: member.color }}
      >
        {member.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-gray-900 m-0 mb-0.5">{member.name}</p>
        <p className="text-xs text-gray-400 m-0">{member.studentId}</p>
      </div>
      <span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-medium whitespace-nowrap shrink-0 border ${
        member.role === "Trưởng CLB"
          ? "bg-orange-50 text-[#E6430A] border-orange-200"
          : member.role === "Phó CLB"
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-gray-100 text-gray-600 border-gray-200"
      }`}>
        {member.role}
      </span>
      <p className="text-xs text-gray-400 m-0 whitespace-nowrap shrink-0">Tham gia {member.joinDate}</p>
    </div>
  );
}

function EventRow({ event }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-b-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${event.status === "upcoming" ? "bg-emerald-500" : "bg-gray-300"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 m-0 mb-1">{event.name}</p>
        <div className="flex items-center gap-3.5 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${
        event.status === "upcoming" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}>
        {event.status === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc"}
      </span>
    </div>
  );
}

const LEADERBOARD_META = {
  1: {
    title: "1ST PLACE - GOLD",
    label: "Top Contributor",
    icon: Crown,
    shell: "border-amber-300 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200 shadow-[0_16px_34px_rgba(217,119,6,0.24)] md:min-h-[286px] md:-mt-5",
    header: "bg-gradient-to-r from-amber-300 to-yellow-200 text-amber-950",
    accent: "text-amber-700",
    ring: "ring-4 ring-amber-300/70 bg-amber-100 text-amber-800",
  },
  2: {
    title: "2ND PLACE - SILVER",
    label: "Active Participant",
    icon: Medal,
    shell: "border-slate-300 bg-gradient-to-b from-slate-50 via-white to-slate-200 shadow-[0_12px_26px_rgba(71,85,105,0.18)] md:min-h-[252px]",
    header: "bg-gradient-to-r from-slate-200 to-white text-slate-800",
    accent: "text-slate-600",
    ring: "ring-4 ring-slate-300/80 bg-slate-100 text-slate-700",
  },
  3: {
    title: "3RD PLACE - BRONZE",
    label: "Innovation Lead",
    icon: Award,
    shell: "border-orange-300 bg-gradient-to-b from-orange-100 via-white to-orange-200 shadow-[0_12px_26px_rgba(194,65,12,0.18)] md:min-h-[252px]",
    header: "bg-gradient-to-r from-orange-300 to-orange-100 text-orange-950",
    accent: "text-orange-700",
    ring: "ring-4 ring-orange-300/75 bg-orange-100 text-orange-800",
  },
};

const AVATAR_COLORS = ["#2563eb", "#e6430a", "#059669", "#7c3aed", "#db2777", "#d97706"];

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

function formatPoints(value) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} pts`;
}

const MEMBER_TIER_DETAILS = {
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

function resolveMemberTier(totalScore) {
  const score = Number(totalScore ?? 0);
  if (score >= 150) return "S-Tier (Xuất sắc)";
  if (score >= 80) return "A-Tier (Tích cực)";
  if (score >= 20) return "B-Tier (Hoạt động tốt)";
  return "C-Tier (Cảnh cáo)";
}

function getMemberTierDetail(memberTier) {
  return MEMBER_TIER_DETAILS[memberTier] ?? MEMBER_TIER_DETAILS["C-Tier (Cảnh cáo)"];
}

function normalizeRankingItem(item, index, members) {
  const matchedMember = members.find((member) =>
    normalizeText(member.name) === normalizeText(item.fullName)
  );

  return {
    rank: item.rank ?? index + 1,
    userId: item.userId,
    fullName: item.fullName ?? "Thành viên CLB",
    email: item.studentId ?? item.email ?? matchedMember?.studentId ?? "",
    role: item.clubRoleName ?? matchedMember?.role ?? (item.rank === 1 ? "Top Contributor" : "Thành viên"),
    memberTier: item.memberTier ?? resolveMemberTier(item.totalScore),
    memberTierDescription: item.memberTierDescription ?? getMemberTierDetail(item.memberTier ?? resolveMemberTier(item.totalScore)).description,
    clubName: item.clubName,
    totalScore: Number(item.totalScore ?? 0),
    contributionPoint: Number(item.contributionPoint ?? 0),
    eventParticipationPoint: Number(item.eventParticipationPoint ?? 0),
    performancePoint: Number(item.performancePoint ?? 0),
    avatarColor: matchedMember?.color ?? AVATAR_COLORS[index % AVATAR_COLORS.length],
  };
}

function RankingAvatar({ member, size = "md" }) {
  const dimension = size === "lg" ? "w-20 h-20 text-xl" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${dimension} rounded-full flex items-center justify-center font-extrabold shrink-0 text-white shadow-sm`}
      style={{ background: member.avatarColor }}
    >
      {getInitials(member.fullName)}
    </div>
  );
}

function LeaderboardStat({ label, value }) {
  return (
    <div className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100 min-w-[92px] text-center">
      <p className="text-[18px] font-extrabold text-gray-900 m-0 leading-none">{value}</p>
      <p className="text-[11px] font-medium text-gray-500 m-0 mt-1">{label}</p>
    </div>
  );
}

function TopMemberCard({ member, place }) {
  const meta = LEADERBOARD_META[place];
  const Icon = meta.icon;
  const tier = member ? getMemberTierDetail(member.memberTier) : null;

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
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,116,144,0.16)_0%,rgba(15,23,42,0)_42%),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[length:auto,28px_28px,28px_28px]" />
      <div className="relative z-10 flex flex-col items-center px-4 pb-4 text-center h-full">
        <div className={`w-full rounded-b-lg px-3 py-2 text-[13px] font-extrabold uppercase tracking-wide ${meta.header}`}>
          {meta.title}
        </div>
        <div className="mt-4 relative">
          <RankingAvatar member={member} size="lg" />
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
        <p className="text-[11.5px] text-gray-500 m-0 mt-1 truncate max-w-full">{member.email}</p>
        <p className={`text-sm font-extrabold m-0 mt-3 ${meta.accent}`}>{formatPoints(member.totalScore)}</p>
        <p className="text-[11.5px] text-gray-500 m-0 mt-1">Vai trò: {member.role}</p>
      </div>
    </div>
  );
}

function LeaderboardView({ club, members, rankings, loading, error, search, onSearch }) {
  const leaderboardRows = rankings
    .map((item, index) => normalizeRankingItem(item, index, members))
    .sort((a, b) => a.rank - b.rank || b.totalScore - a.totalScore || a.fullName.localeCompare(b.fullName));
  const filteredRows = leaderboardRows.filter((row) => {
    const query = normalizeText(search);
    return !query || normalizeText(`${row.fullName} ${row.email} ${row.role}`).includes(query);
  });
  const topRows = leaderboardRows.slice(0, 3);
  const averageScore = leaderboardRows.length
    ? Math.round(leaderboardRows.reduce((sum, row) => sum + row.totalScore, 0) / leaderboardRows.length)
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[260px] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={30} className="animate-spin" />
        <p className="text-sm m-0">Đang tải BXH thành viên...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 min-h-[220px] flex flex-col items-center justify-center gap-2 text-center px-6">
        <Trophy size={34} className="text-red-300" />
        <p className="text-sm font-semibold text-red-500 m-0">{error}</p>
        <p className="text-xs text-gray-400 m-0">Vui lòng thử lại sau hoặc kiểm tra quyền thành viên trong CLB.</p>
      </div>
    );
  }

  if (leaderboardRows.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[240px] flex flex-col items-center justify-center gap-2 text-center px-6">
        <Trophy size={38} className="text-gray-300" />
        <p className="text-sm font-semibold text-gray-500 m-0">CLB chưa có dữ liệu BXH thành viên.</p>
        <p className="text-xs text-gray-400 m-0">Khi hệ thống ghi nhận điểm đóng góp, dữ liệu sẽ hiển thị tại đây.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#E6430A] mb-1.5">
            <Trophy size={15} /> Member Leaderboard
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 m-0">BXH thành viên - {club.name}</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LeaderboardStat label="Thành viên" value={leaderboardRows.length} />
          <LeaderboardStat label="Điểm cao nhất" value={topRows[0]?.totalScore ?? 0} />
          <LeaderboardStat label="Điểm TB" value={averageScore} />
        </div>
      </div>

      <div className="p-5 bg-gradient-to-b from-sky-50 to-white">
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
          <TopMemberCard member={topRows[1]} place={2} />
          <TopMemberCard member={topRows[0]} place={1} />
          <TopMemberCard member={topRows[2]} place={3} />
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 my-4">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide m-0">Full Leaderboard</h3>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white min-w-[240px]">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 border-none outline-none text-[13px] text-gray-900 bg-transparent font-[inherit] placeholder:text-gray-300"
              placeholder="Tìm thành viên..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
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
                        <p className="text-[11px] text-gray-400 m-0 truncate">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.role}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getMemberTierDetail(row.memberTier).chip}`}>
                      {getMemberTierDetail(row.memberTier).shortLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[260px]">{row.memberTierDescription}</td>
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
    </div>
  );
}

const TABS = [
  { key: "feed",        label: "Bảng tin",       icon: Megaphone },
  { key: "members",     label: "Thành viên",     icon: Users     },
  { key: "leaderboard", label: "BXH thành viên", icon: Trophy    },
  { key: "events",      label: "Sự kiện",        icon: Calendar  },
];

export default function ClubSpace({ club, onBack }) {
  const [tab, setTab]             = useState("feed");
  const [memberSearch, setMS]     = useState("");
  const [rankingSearch, setRankingSearch] = useState("");
  const [rankings, setRankings]   = useState([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsError, setRankingsError] = useState("");
  const [realEvents, setRealEvents]     = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const space = getSpace(club.id);

  useEffect(() => {
    if (tab === "events" && club?.id) {
      clubService.getAllEvents(club.id)
        .then((res) => {
          const data = Array.isArray(res) ? res : (res.data || []);
          setRealEvents(data);
        })
        .catch((err) => {
          console.error("Lỗi khi tải sự kiện CLB:", err);
        })
        .finally(() => {
          setEventsLoading(false);
        });
    }
  }, [tab, club?.id]);

  useEffect(() => {
    if (tab !== "leaderboard" || !club?.id) return;

    let cancelled = false;

    clubService.getMemberRankings(club.id)
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : (data?.data ?? []);
        setRankings(rows);
      })
      .catch((err) => {
        if (cancelled || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.error("Lỗi khi tải BXH thành viên:", err);
        setRankingsError("Không thể tải BXH thành viên.");
      })
      .finally(() => {
        if (!cancelled) setRankingsLoading(false);
      });

    return () => { cancelled = true; };
  }, [tab, club?.id]);

  const handleTabChange = (nextTab) => {
    if (nextTab === tab) return;

    if (nextTab === "events") {
      setEventsLoading(true);
    }

    if (nextTab === "leaderboard") {
      setRankingsLoading(true);
      setRankingsError("");
    }

    setTab(nextTab);
  };

  const filteredMembers = space.members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.studentId.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="animate-[csFadeIn_0.22s_ease-out]">
      <style>{`@keyframes csFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="flex items-center gap-3.5 mb-4">
        <button
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors font-[inherit]"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <span className="text-sm font-semibold text-gray-500">{club.name}</span>
      </div>

      <div
        className="rounded-2xl p-7 flex items-center gap-5 relative overflow-hidden flex-wrap mb-0"
        style={{ background: space.cover, rowGap: 16 }}
      >
        <div className="absolute inset-0 bg-black/[0.12] pointer-events-none rounded-2xl" />
        <div className="text-[52px] leading-none shrink-0 relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
          {club.emoji}
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <h1 className="text-2xl font-extrabold text-white m-0 mb-1.5" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            {club.name}
          </h1>
          <p className="inline-block px-3 py-0.5 bg-white/20 rounded-full text-xs font-semibold text-white m-0">
            {club.tag}
          </p>
        </div>
        <div className="flex items-center bg-white/[0.18] rounded-xl px-4.5 py-2.5 relative z-10 shrink-0">
          <div className="flex flex-col items-center gap-0.5 px-4">
            <span className="text-xl font-bold text-white leading-none">{club.members}</span>
            <span className="text-[11px] text-white/80">Thành viên</span>
          </div>
          <div className="w-px h-7 bg-white/25" />
          <div className="flex flex-col items-center gap-0.5 px-4">
            <span className="text-xl font-bold text-white leading-none">{space.stats.events}</span>
            <span className="text-[11px] text-white/80">Sự kiện</span>
          </div>
          <div className="w-px h-7 bg-white/25" />
          <div className="flex flex-col items-center gap-0.5 px-4">
            <span className="text-xl font-bold text-white leading-none">{space.stats.posts}</span>
            <span className="text-[11px] text-white/80">Bài đăng</span>
          </div>
        </div>
        <span className="relative z-10 px-3.5 py-1.5 rounded-full bg-white/90 text-[12.5px] font-semibold text-gray-700 shrink-0">
          {club.role}
        </span>
      </div>

      <div className="flex gap-1 bg-white rounded-b-2xl px-4 border-t border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`flex items-center gap-1.5 px-4 py-3.5 border-b-2 text-[13.5px] font-medium cursor-pointer transition-colors bg-none border-l-0 border-r-0 border-t-0 font-[inherit] whitespace-nowrap ${
              tab === t.key
                ? "text-[#E6430A] border-b-[#E6430A] font-semibold"
                : "text-gray-500 border-b-transparent hover:text-gray-700"
            }`}
            onClick={() => handleTabChange(t.key)}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "feed" && (
          <div className="flex flex-col gap-3.5 max-w-[680px]">
            {space.feed.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}
          </div>
        )}

        {tab === "members" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4.5 py-3.5 border-b border-gray-100">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                className="flex-1 border-none outline-none text-[13.5px] text-gray-900 bg-transparent font-[inherit] placeholder:text-gray-300"
                placeholder="Tìm tên hoặc MSSV..."
                value={memberSearch}
                onChange={(e) => setMS(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              {filteredMembers.map((m) => <MemberRow key={m.id} member={m} />)}
              {filteredMembers.length === 0 && (
                <p className="text-center py-7 text-sm text-gray-400 m-0">Không tìm thấy thành viên phù hợp.</p>
              )}
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <LeaderboardView
            club={club}
            members={space.members}
            rankings={rankings}
            loading={rankingsLoading}
            error={rankingsError}
            search={rankingSearch}
            onSearch={setRankingSearch}
          />
        )}

        {tab === "events" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            {eventsLoading ? (
              <p className="text-center py-5 text-sm text-gray-400">Đang tải danh sách sự kiện...</p>
            ) : realEvents.length === 0 ? (
              <p className="text-center py-5 text-sm text-gray-400">Câu lạc bộ chưa có sự kiện nào.</p>
            ) : (
              <>
                <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide m-0 mb-3">Sắp diễn ra</p>
                {realEvents
                  .filter((e) => e.eventStatus === "Approved" || e.eventStatus === "Upcoming" || e.eventStatus === "Ongoing")
                  .map((e) => (
                    <EventRow
                      key={e.eventID}
                      event={{
                        id: e.eventID,
                        name: e.eventName,
                        date: e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "",
                        time: e.startDate ? new Date(e.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
                        location: e.location || "Chưa xếp phòng",
                        status: "upcoming",
                      }}
                    />
                  ))}
                <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide m-0 mb-3 mt-5">Đã kết thúc</p>
                {realEvents
                  .filter((e) => e.eventStatus === "Completed" || e.eventStatus === "Closed")
                  .map((e) => (
                    <EventRow
                      key={e.eventID}
                      event={{
                        id: e.eventID,
                        name: e.eventName,
                        date: e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "",
                        time: e.startDate ? new Date(e.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
                        location: e.location || "Chưa xếp phòng",
                        status: "done",
                      }}
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
