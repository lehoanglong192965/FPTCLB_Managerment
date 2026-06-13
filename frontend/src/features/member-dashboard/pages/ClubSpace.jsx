import { useState } from "react";
import {
  ArrowLeft, Users, Calendar, Bell, Megaphone,
  Pin, Search, MapPin, Clock, ChevronRight,
} from "lucide-react";
import "../../../assets/css/clubSpace.css";

/* ── Mock data per club ──────────────────────────────────── */
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

/* ── Feed post card ──────────────────────────────────────── */
function FeedPost({ post }) {
  const parts = post.content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className={`cs-post${post.type === "pinned" ? " cs-post-pinned" : ""}`}>
      {post.type === "pinned" && (
        <div className="cs-pin-label">
          <Pin size={11} /> Ghim
        </div>
      )}
      <div className="cs-post-header">
        <div className="cs-post-avatar" style={{ background: "#e6430a22", color: "#e6430a" }}>
          {post.avatar}
        </div>
        <div>
          <p className="cs-post-author">{post.author} <span className="cs-post-role">{post.role}</span></p>
          <p className="cs-post-time">{post.time}</p>
        </div>
      </div>
      <p className="cs-post-content">
        {parts.map((p, i) =>
          p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p
        )}
      </p>
    </div>
  );
}

/* ── Member row ──────────────────────────────────────────── */
function MemberRow({ member }) {
  return (
    <div className="cs-member-row">
      <div className="cs-member-avatar" style={{ background: member.color + "22", color: member.color }}>
        {member.avatar}
      </div>
      <div className="cs-member-info">
        <p className="cs-member-name">{member.name}</p>
        <p className="cs-member-id">{member.studentId}</p>
      </div>
      <span className={`cs-member-badge ${member.role === "Trưởng CLB" ? "cs-badge-leader" : member.role === "Phó CLB" ? "cs-badge-vice" : "cs-badge-member"}`}>
        {member.role}
      </span>
      <p className="cs-member-join">Tham gia {member.joinDate}</p>
    </div>
  );
}

/* ── Event row ───────────────────────────────────────────── */
function EventRow({ event }) {
  return (
    <div className="cs-event-row">
      <div className={`cs-event-status-dot ${event.status === "upcoming" ? "cs-dot-upcoming" : "cs-dot-done"}`} />
      <div className="cs-event-info">
        <p className="cs-event-name">{event.name}</p>
        <div className="cs-event-meta">
          <span><Calendar size={12} /> {event.date}</span>
          <span><Clock size={12} /> {event.time}</span>
          <span><MapPin size={12} /> {event.location}</span>
        </div>
      </div>
      <span className={`cs-event-badge ${event.status === "upcoming" ? "cs-event-upcoming" : "cs-event-done"}`}>
        {event.status === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc"}
      </span>
    </div>
  );
}

/* ── Main ClubSpace component ────────────────────────────── */
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
    <div className="cs-wrap">
      {/* ── Back bar ───────────────────────────────────────── */}
      <div className="cs-back-bar">
        <button className="cs-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <span className="cs-back-name">{club.name}</span>
      </div>

      {/* ── Club banner ────────────────────────────────────── */}
      <div className="cs-banner" style={{ background: space.cover }}>
        <div className="cs-banner-emoji">{club.emoji}</div>
        <div className="cs-banner-info">
          <h1 className="cs-banner-name">{club.name}</h1>
          <p className="cs-banner-tag">{club.tag}</p>
        </div>
        <div className="cs-banner-stats">
          <div className="cs-stat-item">
            <span className="cs-stat-value">{club.members}</span>
            <span className="cs-stat-label">Thành viên</span>
          </div>
          <div className="cs-stat-divider" />
          <div className="cs-stat-item">
            <span className="cs-stat-value">{space.stats.events}</span>
            <span className="cs-stat-label">Sự kiện</span>
          </div>
          <div className="cs-stat-divider" />
          <div className="cs-stat-item">
            <span className="cs-stat-value">{space.stats.posts}</span>
            <span className="cs-stat-label">Bài đăng</span>
          </div>
        </div>
        <span className="cs-role-pill">{club.role}</span>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="cs-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`cs-tab${tab === t.key ? " cs-tab-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────── */}
      <div className="cs-content">

        {/* Feed */}
        {tab === "feed" && (
          <div className="cs-feed">
            {space.feed.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Members */}
        {tab === "members" && (
          <div className="cs-members-wrap">
            <div className="cs-member-search-wrap">
              <Search size={15} className="cs-member-search-icon" />
              <input
                className="cs-member-search"
                placeholder="Tìm tên hoặc MSSV..."
                value={memberSearch}
                onChange={(e) => setMS(e.target.value)}
              />
            </div>
            <div className="cs-member-list">
              {filteredMembers.map((m) => <MemberRow key={m.id} member={m} />)}
              {filteredMembers.length === 0 && (
                <p className="cs-empty-msg">Không tìm thấy thành viên phù hợp.</p>
              )}
            </div>
          </div>
        )}

        {/* Events */}
        {tab === "events" && (
          <div className="cs-events-wrap">
            <p className="cs-events-group-label">Sắp diễn ra</p>
            {space.events.filter((e) => e.status === "upcoming").map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
            <p className="cs-events-group-label" style={{ marginTop: 20 }}>Đã kết thúc</p>
            {space.events.filter((e) => e.status === "done").map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
