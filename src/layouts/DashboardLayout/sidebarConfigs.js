import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  Bell,
  BarChart2,
  Library,
  Settings,
  Users,
  Home,
  Star,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

/*
 * Để thêm / xoá mục menu cho một role, chỉnh sửa mảng tương ứng.
 * Mỗi item:
 *   key          – định danh duy nhất
 *   label        – văn bản hiển thị
 *   icon         – Lucide icon component
 *   path         – đường dẫn route
 *   exact        – true nếu chỉ active khi khớp chính xác (dùng cho index route)
 */

export const SIDEBAR_CONFIGS = {
  ADMIN: [
    { key: "semesters",  label: "Quản Lý Học Kỳ",     icon: BookOpen,        path: "/admin",              exact: true },
    { key: "users",      label: "Quản Lý Người Dùng",  icon: Users,           path: "/admin/users" },
    { key: "discipline", label: "Quản Lý Kỷ Luật",     icon: AlertTriangle,   path: "/admin/discipline" },
  ],

  ICPDP: [
    { key: "overview",      label: "Tổng Quan",            icon: LayoutDashboard, path: "/icpdp",              exact: true },
    { key: "clubs",         label: "Quản Lý CLB",          icon: Building2,       path: "/icpdp/clubs" },
    { key: "members",       label: "Quản Lý Thành Viên",   icon: Users,           path: "/icpdp/members" },
    { key: "events",        label: "Sự Kiện",              icon: Calendar,        path: "/icpdp/events" },
    { key: "reports",       label: "Báo Cáo",              icon: BarChart2,       path: "/icpdp/reports" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/icpdp/notifications" },
  ],

  CLUB_MANAGER: [
    { key: "overview",      label: "Tổng Quan",            icon: Home,            path: "/manager",             exact: true },
    { key: "clubs",         label: "Quản Lý CLB",          icon: Building2,       path: "/manager/clubs" },
    { key: "members",       label: "Quản Lý Thành Viên",   icon: Users,           path: "/manager/members" },
    { key: "events",        label: "Sự Kiện",              icon: Calendar,        path: "/manager/events" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/manager/notifications" },
    { key: "reports",       label: "Báo Cáo",              icon: BarChart2,       path: "/manager/reports" },
  ],

  CLUB_LEADER: [
    { key: "overview",      label: "Tổng Quan CLB",        icon: Home,            path: "/club-leader",         exact: true },
    { key: "members",       label: "Quản Lý Thành Viên",   icon: Users,           path: "/club-leader/members" },
    { key: "events",        label: "Sự Kiện CLB",          icon: Calendar,        path: "/club-leader/events" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/club-leader/notifications" },
    { key: "reports",       label: "Báo Cáo CLB",          icon: BarChart2,       path: "/club-leader/reports" },
  ],

  VICE_LEADER: [
    { key: "overview",      label: "Tổng Quan CLB",        icon: Home,            path: "/vice-leader",         exact: true },
    { key: "members",       label: "Quản Lý Thành Viên",   icon: Users,           path: "/vice-leader/members" },
    { key: "events",        label: "Sự Kiện",              icon: Calendar,        path: "/vice-leader/events" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/vice-leader/notifications" },
  ],

  CORE_TEAM: [
    { key: "overview",      label: "Tổng Quan",            icon: Home,            path: "/core-team",           exact: true },
    { key: "events",        label: "Sự Kiện",              icon: Calendar,        path: "/core-team/events" },
    { key: "members",       label: "Danh Sách Thành Viên", icon: Users,           path: "/core-team/members" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/core-team/notifications" },
  ],

  MEMBER: [
    { key: "home",          label: "Trang Chủ",            icon: Home,            path: "/member",              exact: true },
    { key: "clubs",         label: "Câu Lạc Bộ",           icon: Star,            path: "/member/clubs" },
    { key: "events",        label: "Sự Kiện",              icon: Calendar,        path: "/member/events" },
    { key: "applications",  label: "Đơn Ứng Tuyển",        icon: ClipboardList,   path: "/member/applications" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/member/notifications" },
  ],
};

export const ROLE_LABELS = {
  ADMIN:        "Quản Trị Viên",
  ICPDP:        "Quản Lý CLB (ICPDP)",
  CLUB_MANAGER: "Quản Lý CLB",
  CLUB_LEADER:  "Trưởng CLB",
  VICE_LEADER:  "Phó Trưởng CLB",
  CORE_TEAM:    "Ban Điều Hành",
  MEMBER:       "Thành Viên",
  GUEST:        "Khách",
};

export function getSidebarConfig(role) {
  return SIDEBAR_CONFIGS[role] ?? SIDEBAR_CONFIGS.MEMBER;
}
