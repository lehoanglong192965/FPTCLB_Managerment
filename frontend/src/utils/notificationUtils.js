import { Bell, CalendarDays, Clock, Send, ShieldCheck, AlarmClock } from "lucide-react";
import { TokenService } from "../services/api/axiosClient";
import { decodeJwtPayload } from "./tokenGuard";

export const TYPE_META = {
  event:    { Icon: CalendarDays, iconBg: "bg-blue-50",   iconColor: "text-blue-600",   tagBg: "bg-blue-600",   tagLabel: "Sự kiện"          },
  deadline: { Icon: Clock,        iconBg: "bg-rose-50",   iconColor: "text-rose-600",   tagBg: "bg-rose-600",   tagLabel: "Hạn chót"         },
  recruit:  { Icon: Send,         iconBg: "bg-orange-50", iconColor: "text-orange-500", tagBg: "bg-orange-500", tagLabel: "Tuyển thành viên" },
  approval: { Icon: ShieldCheck,  iconBg: "bg-green-50",  iconColor: "text-green-600",  tagBg: "bg-green-600",  tagLabel: "Kết quả duyệt"   },
  reminder: { Icon: AlarmClock,   iconBg: "bg-amber-50",  iconColor: "text-amber-500",  tagBg: "bg-amber-500",  tagLabel: "Nhắc lịch"       },
  general:  { Icon: Bell,         iconBg: "bg-purple-50", iconColor: "text-purple-600", tagBg: "bg-purple-600", tagLabel: "Thông báo"        },
};

export function relativeTime(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "Vừa xong";
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days  <  7) return `${days} ngày trước`;
  const d = new Date(dateStr);
  return `${d.getDate()} thg ${d.getMonth() + 1}`;
}

export function resolveUserInfo(authUser) {
  const token   = TokenService.getAccess();
  const payload = token ? decodeJwtPayload(token) : null;
  const name    = authUser?.name || payload?.name || payload?.email?.split("@")[0] || "Người dùng";
  const role    = authUser?.role
    || (TokenService.getRole() !== "GUEST" ? TokenService.getRole() : null)
    || payload?.roles?.[0]?.toUpperCase()
    || "MEMBER";
  return { name, role };
}
