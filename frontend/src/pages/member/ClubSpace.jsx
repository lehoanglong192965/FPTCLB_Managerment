import { useState } from "react";
import {
  ArrowLeft, Users, Calendar, Bell, Megaphone,
  Pin, Search, MapPin, Clock, ChevronRight,
} from "lucide-react";

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

const TABS = [
  { key: "feed",    label: "Bảng tin",     icon: Megaphone },
  { key: "members", label: "Thành viên",   icon: Users     },
  { key: "events",  label: "Sự kiện",      icon: Calendar  },
];

export default function ClubSpace({ club, onBack }) {
  const [tab, setTab]           = useState("feed");
  const [memberSearch, setMS]   = useState("");
  const space = getSpace(club.id);

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
            onClick={() => setTab(t.key)}
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

        {tab === "events" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide m-0 mb-3">Sắp diễn ra</p>
            {space.events.filter((e) => e.status === "upcoming").map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
            <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide m-0 mb-3 mt-5">Đã kết thúc</p>
            {space.events.filter((e) => e.status === "done").map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
