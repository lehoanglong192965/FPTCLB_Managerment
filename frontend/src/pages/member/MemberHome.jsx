import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Award, Flame, CalendarDays, ChevronRight, Loader2, Building2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
import eventService from "../../services/api/events/eventService";
import clubService from "../../services/api/clubs/clubService";
import { getGreeting } from "../../utils/greeting";

const STAT_DEFS = [
  { key: "clubCount",    label: "CLB Tham Gia",   icon: null,     bg: "bg-[#fff0ed]" },
  { key: "activityHours",label: "Giờ Hoạt Động",  icon: null,     bg: "bg-[#fff7ed]" },
  { key: "certificates", label: "Chứng Nhận",      icon: Award,    bg: "bg-[#eff6ff]" },
  { key: "streak",       label: "Streak Sự Kiện",  icon: Flame,    bg: "bg-[#fff1f2]" },
];

function ClubAvatar({ name, coverImage }) {
  if (coverImage && !coverImage.includes("placehold.co")) {
    return <img src={coverImage} alt={name} className="w-14 h-14 rounded-[10px] object-cover bg-gray-100 flex-shrink-0" />;
  }
  const initials = name?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() ?? "?";
  const colors = ["#1d4ed8", "#7c3aed", "#065f46", "#9a3412", "#831843"];
  const bg = colors[name?.charCodeAt(0) % colors.length] ?? colors[0];
  return (
    <div
      className="w-14 h-14 rounded-[10px] flex items-center justify-center flex-shrink-0 text-white text-base font-bold"
      style={{ background: bg }}
    >
      {initials}
    </div>
  );
}

export default function MemberHome() {
  const navigate              = useNavigate();
  const { profile }           = useAuth();
  const { notifications }     = useNotifications();
  const displayName = profile?.fullName?.split(" ").pop() ?? profile?.fullName ?? "bạn";

  const [events,  setEvents]  = useState([]);
  const [evLoading, setEvLoading] = useState(true);
  const [myClubs, setMyClubs] = useState([]);
  const [stats, setStats]     = useState({ clubCount: 0, activityHours: 0, certificates: 0, streak: 0 });

  useEffect(() => {
    let cancelled = false;
    eventService.getMyRegistrations()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const now = Date.now();
        const upcoming = list
          .filter((e) => e.startDate && new Date(e.startDate).getTime() > now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 3)
          .map((e) => {
            const dt = new Date(e.startDate);
            return {
              id:       e.eventID,
              name:     e.eventName,
              month:    dt.toLocaleString("vi-VN", { month: "long" }).toUpperCase(),
              day:      String(dt.getDate()),
              time:     dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              location: e.location || "Chưa xếp phòng",
            };
          });
        setEvents(upcoming);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setEvLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    clubService.getMyClubs()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.clubs ?? []);
        setMyClubs(list.map((c) => ({
          id:          c.clubId   ?? c.id,
          name:        c.clubName ?? c.name ?? "—",
          category:    c.category ?? c.type ?? "",
          coverImage:  c.coverImageUrl ?? c.avatar ?? c.image ?? "",
          role:        c.clubRoleName  ?? c.roleName ?? "Thành viên",
        })));
        setStats((prev) => ({ ...prev, clubCount: list.length }));
      })
      .catch(() => {});
  }, []);

  const recentNotifs = notifications.slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 m-0 mb-1">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="text-sm text-gray-500 m-0">
            Chúc bạn một ngày học tập và hoạt động thật năng suất.
          </p>
        </div>
        <button
          className="relative w-11 h-11 rounded-[10px] border border-gray-200 bg-white flex items-center justify-center cursor-pointer flex-shrink-0 hover:border-[#e6430a] transition-colors"
          onClick={() => navigate("/member/notifications")}
        >
          <Bell size={20} color="#374151" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {STAT_DEFS.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-[14px] px-5 py-[18px] flex flex-col items-center gap-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]`}>
            <div className="flex items-center gap-1.5">
              {s.icon && <s.icon size={22} color="#e6430a" />}
              <span className="text-[32px] font-bold text-[#e6430a] leading-none">{stats[s.key] ?? 0}</span>
            </div>
            <span className="text-xs text-gray-500 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Left column */}
        <div>
          {/* Clubs */}
          <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-5 last:mb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900 m-0">Câu lạc bộ của tôi</h2>
              <Link to="/member/clubs" className="text-[13px] text-gray-500 hover:text-[#e6430a] transition-colors" style={{ color: "inherit" }}>
                Xem tất cả
              </Link>
            </div>
            {myClubs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-5 text-gray-400">
                <Building2 size={28} strokeWidth={1.5} />
                <p className="text-[13px] m-0">Bạn chưa tham gia câu lạc bộ nào.</p>
              </div>
            ) : (
              myClubs.slice(0, 3).map((club) => (
                <div key={club.id} className="flex items-center gap-3.5 mb-3 last:mb-0">
                  <ClubAvatar name={club.name} coverImage={club.coverImage} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-gray-900 m-0 mb-0.5">{club.name}</p>
                    <p className="text-xs text-blue-500 m-0">{club.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="px-3 py-0.5 rounded-full border border-gray-900 text-xs font-medium text-gray-900 bg-transparent whitespace-nowrap">
                      {club.role}
                    </span>
                    <Link
                      to="/member/my-clubs"
                      className="flex items-center gap-1 text-[13px] text-gray-700 whitespace-nowrap hover:text-[#e6430a] transition-colors"
                      style={{ color: "inherit" }}
                    >
                      Vào không gian <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-5 last:mb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900 m-0">Lịch trình sắp tới</h2>
              <Link to="/member/tickets" className="text-[13px] text-gray-500 hover:text-[#e6430a] transition-colors" style={{ color: "inherit" }}>
                Tất cả lịch
              </Link>
            </div>
            {evLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-4 m-0">Không có sự kiện nào sắp tới.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-b-0 last:pb-0 first:pt-0">
                  <div className="flex flex-col items-center justify-center w-[54px] min-h-[62px] bg-[#fff3ee] rounded-[12px] flex-shrink-0 py-2 px-1.5">
                    <span className="text-[10px] font-semibold text-[#e6430a] uppercase tracking-[0.3px] leading-none">{ev.month}</span>
                    <span className="text-2xl font-bold text-[#e6430a] leading-[1.1]">{ev.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 m-0 mb-1 truncate">{ev.name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 m-0">
                      <CalendarDays size={12} />
                      {ev.time} • {ev.location}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/member/tickets")}
                    className="px-[18px] py-2 bg-blue-700 text-white border-none rounded-lg text-[13px] font-medium cursor-pointer whitespace-nowrap flex-shrink-0 transition-colors hover:bg-blue-800"
                  >
                    Xem vé
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* AI Assistant */}
          <div className="bg-[#e6430a] rounded-[14px] px-[22px] pt-[22px] pb-5 text-white">
            <div className="flex items-center gap-2 mb-2.5">
              <h3 className="text-base font-bold text-white m-0">Trợ lý AI CLB</h3>
              <span className="px-2 py-0.5 bg-white/25 rounded-full text-[11px] font-semibold text-white">BETA</span>
            </div>
            <p className="text-[13px] text-white/85 m-0 mb-4 leading-relaxed">
              Bạn có câu hỏi về hoạt động, tài liệu hay quy trình? Hãy hỏi Trợ lý AI ngay.
            </p>
            <button
              className="w-full py-2.5 bg-white text-[#e6430a] border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => navigate("/member/ai-chat")}
            >
              Trò chuyện ngay
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-[14px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3.5">Thông báo mới</h3>
            <div className="flex flex-col gap-3 mb-3.5">
              {recentNotifs.length === 0 ? (
                <p className="text-[13px] text-gray-400 m-0">Không có thông báo mới.</p>
              ) : (
                recentNotifs.map((n) => (
                  <div key={n.id} className="flex gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#e6430a] flex-shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 m-0 mb-0.5 truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 m-0 truncate">{n.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/member/notifications"
              className="block text-center text-[13px] text-gray-500 pt-2.5 border-t border-gray-100 hover:text-[#e6430a] transition-colors"
              style={{ color: "inherit" }}
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
