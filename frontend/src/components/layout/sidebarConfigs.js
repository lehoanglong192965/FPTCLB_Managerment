import {
  Building2,
  Calendar,
  LayoutDashboard,
  BarChart2,
  BookOpen,
  Bell,
  Ban,
  Settings,
  Users,
  Home,
  Star,
  Send,
  UserCircle,
  ArrowRightLeft,
  ShieldAlert,
  Layers,
  UserPlus,
  Network,
  ClipboardList,
  PlusCircle,
  Trophy,
  Award,
  MessageSquare,
  Library,
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
    { key: "semesters",     label: "Quản Lý Học Kỳ",        icon: BookOpen,    path: "/admin",               exact: true },
    { key: "club-dashboard", label: "Dashboard CLB",         icon: LayoutDashboard, path: "/admin/club-dashboard" },
    { key: "users",         label: "Quản Lý Người Dùng",     icon: Users,       path: "/admin/users" },
    { key: "system-config", label: "Cấu Hình Hệ Thống",     icon: Settings,    path: "/admin/system-config" },
    { key: "knowledge-archive", label: "Kho Tri Thức",       icon: Library,     path: "/admin/knowledge-archive" },
    { key: "profile",       label: "Thông Tin Tài Khoản",    icon: UserCircle,  path: "/admin/profile" },
  ],

  ICPDP: [
    { key: "club-dashboard",    label: "Dashboard CLB",       icon: LayoutDashboard, path: "/icpdp/club-dashboard" },
    { key: "club-overview",      label: "Tổng Quan CLB",       icon: Building2,      path: "/icpdp/club-overview" },
    { key: "club-management",    label: "Quản Lý CLB",         icon: Layers,         path: "/icpdp/club-management" },
    { key: "club-create",        label: "Tạo CLB",             icon: PlusCircle,     path: "/icpdp/clubs/create" },
    { key: "event-approval",     label: "Phê Duyệt Sự Kiện",   icon: Calendar,       path: "/icpdp/event-approval" },
    { key: "report-review",      label: "Duyệt Báo Cáo",        icon: ClipboardList,  path: "/icpdp/report-review" },
    { key: "personnel-reassign", label: "Điều Động Nhân Sự",   icon: ArrowRightLeft, path: "/icpdp/personnel-reassign" },
    { key: "discipline-log",     label: "Nhật Ký Kỷ Luật",     icon: ShieldAlert,    path: "/icpdp/discipline-log" },
    { key: "recruitment",        label: "Tuyển Dụng",          icon: UserPlus,       path: "/icpdp/recruitment" },
    { key: "competition",          label: "Cuộc Thi CLB",          icon: Trophy,         path: "/icpdp/competition" },
    { key: "emergency-override",  label: "Ghi Đè Khẩn Cấp",       icon: ShieldAlert,    path: "/icpdp/emergency-override" },
    { key: "notifications",       label: "Thông Báo",             icon: Bell,           path: "/icpdp/notifications" },
    { key: "knowledge-archive", label: "Kho Tri Thức",          icon: Library,        path: "/icpdp/knowledge-archive" },
    { key: "profile",            label: "Thông Tin Tài Khoản", icon: UserCircle,     path: "/icpdp/profile" },
  ],

  CLUB_LEADER: [
    { key: "overview",      label: "Tổng Quan CLB",        icon: Home,            path: "/club-leader",              exact: true },
    { key: "dashboard",     label: "Dashboard CLB",         icon: LayoutDashboard, path: "/club-leader/dashboard" },
    { key: "club-info",     label: "Thông Tin CLB",        icon: Building2,       path: "/club-leader/club-info" },
    { key: "members",       label: "Quản Lý Thành Viên",   icon: Users,           path: "/club-leader/members" },
    { key: "applications",  label: "Đơn Ứng Tuyển",        icon: ClipboardList,   path: "/club-leader/applications" },
    { key: "event-create",  label: "Tạo Sự Kiện",          icon: PlusCircle,      path: "/club-leader/event-create" },
    { key: "events",        label: "Quản Lý Sự Kiện",      icon: Calendar,        path: "/club-leader/events" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/club-leader/notifications" },
    { key: "reports",       label: "Báo Cáo CLB",          icon: BarChart2,       path: "/club-leader/reports" },
    { key: "blacklist",     label: "Danh Sách Đen",        icon: Ban,             path: "/club-leader/blacklist" },
    { key: "leaderboard",   label: "BXH Thành Viên",       icon: Trophy,          path: "/club-leader/leaderboard" },
    { key: "profile",       label: "Thông Tin Tài Khoản",  icon: UserCircle,      path: "/club-leader/profile" },
  ],

  VICE_LEADER: [
    { key: "overview",      label: "Tổng Quan CLB",        icon: Home,            path: "/vice-leader",              exact: true },
    { key: "dashboard",     label: "Dashboard CLB",         icon: LayoutDashboard, path: "/vice-leader/dashboard" },
    { key: "club-info",     label: "Thông Tin CLB",        icon: Building2,       path: "/vice-leader/club-info" },
    { key: "members",       label: "Quản Lý Thành Viên",   icon: Users,           path: "/vice-leader/members" },
    { key: "event-create",  label: "Tạo Sự Kiện",          icon: PlusCircle,      path: "/vice-leader/event-create" },
    { key: "events",        label: "Quản Lý Sự Kiện",      icon: Calendar,        path: "/vice-leader/events" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/vice-leader/notifications" },
    { key: "leaderboard",   label: "BXH Thành Viên",       icon: Trophy,          path: "/vice-leader/leaderboard" },
    { key: "profile",       label: "Thông Tin Tài Khoản",  icon: UserCircle,      path: "/vice-leader/profile" },
  ],

  MEMBER: [
    { key: "my-clubs",      label: "Câu Lạc Bộ Của Tôi",   icon: Building2,       path: "/member/my-clubs" },
    { key: "clubs",         label: "Khám Phá CLB",         icon: Star,            path: "/member/clubs" },
    { key: "apply",         label: "Đơn Ứng Tuyển",       icon: Send,            path: "/member/apply" },
    { key: "events",        label: "Khám Phá Sự Kiện",     icon: Calendar,        path: "/member/events" },
    { key: "tickets",        label: "Vé Của Tôi",           icon: ClipboardList,   path: "/member/tickets" },
    { key: "pending-feedback", label: "Feedback Cần Gửi",   icon: MessageSquare,    path: "/member/pending-feedback" },
    { key: "contributions", label: "Đóng Góp Của Tôi",    icon: Award,           path: "/member/contributions" },
    { key: "profile",       label: "Thông Tin Tài Khoản",  icon: UserCircle,      path: "/member/profile" },
  ],

  ALUMNI: [
    { key: "home",    label: "Bảng Tin Cựu Sinh Viên", icon: Home,       path: "/alumni",         exact: true },
    { key: "clubs",   label: "Câu Lạc Bộ Cũ",          icon: Star,       path: "/alumni/clubs" },
    { key: "events",  label: "Sự Kiện",                 icon: Calendar,   path: "/alumni/events" },
    { key: "network", label: "Mạng Lưới",               icon: Network,    path: "/alumni/network" },
    { key: "profile", label: "Thông Tin Tài Khoản",     icon: UserCircle, path: "/alumni/profile" },
  ],
};

export const ROLE_LABELS = {
  ADMIN:        "Quản Trị Viên",
  ICPDP:        "Quản Lý CLB (ICPDP)",
  CLUB_LEADER:  "Trưởng CLB",
  VICE_LEADER:  "Phó Trưởng CLB",
  MEMBER:       "Thành Viên",
  ALUMNI:       "Cựu Sinh Viên",
  GUEST:        "Khách",
};

export function getSidebarConfig(role) {
  return SIDEBAR_CONFIGS[role] ?? SIDEBAR_CONFIGS.MEMBER;
}

