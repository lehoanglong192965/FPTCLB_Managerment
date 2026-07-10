import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  Bell,
  BarChart2,
  Settings,
  Users,
  Home,
  Star,
  FileText,
  Send,
  UserCircle,
  ArrowRightLeft,
  ShieldAlert,
  Layers,
  UserPlus,
  Ban,
  Network,
  ClipboardList,
  PlusCircle,
  Trophy,
  Award,
  MessageSquare,
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
    { key: "users",         label: "Quản Lý Người Dùng",     icon: Users,       path: "/admin/users" },
    { key: "system-config", label: "Cấu Hình Hệ Thống",     icon: Settings,    path: "/admin/system-config" },
    { key: "profile",       label: "Thông Tin Tài Khoản",    icon: UserCircle,  path: "/admin/profile" },
  ],

  ICPDP: [
    { key: "club-overview",      label: "Tổng Quan CLB",       icon: Building2,      path: "/icpdp/club-overview" },
    { key: "club-management",    label: "Quản Lý CLB",         icon: Layers,         path: "/icpdp/club-management" },
    { key: "club-create",        label: "Tạo CLB",             icon: PlusCircle,     path: "/icpdp/clubs/create" },
    { key: "club-requests",      label: "Duyệt Đơn CLB",       icon: FileText,       path: "/icpdp/club-requests" },
    { key: "event-approval",     label: "Phê Duyệt Sự Kiện",   icon: Calendar,       path: "/icpdp/event-approval" },
    { key: "report-review",      label: "Duyệt Báo Cáo",        icon: ClipboardList,  path: "/icpdp/report-review" },
    { key: "personnel-reassign", label: "Điều Động Nhân Sự",   icon: ArrowRightLeft, path: "/icpdp/personnel-reassign" },
    { key: "discipline-log",     label: "Nhật Ký Kỷ Luật",     icon: ShieldAlert,    path: "/icpdp/discipline-log" },
    { key: "recruitment",        label: "Tuyển Dụng",          icon: UserPlus,       path: "/icpdp/recruitment" },
    { key: "competition",          label: "Cuộc Thi CLB",          icon: Trophy,         path: "/icpdp/competition" },
    { key: "emergency-override",  label: "Emergency Override",    icon: ShieldAlert,    path: "/icpdp/emergency-override" },
    { key: "notifications",       label: "Thông Báo",             icon: Bell,           path: "/icpdp/notifications" },
    { key: "profile",            label: "Thông Tin Tài Khoản", icon: UserCircle,     path: "/icpdp/profile" },
  ],

  CLUB_MANAGER: [
    { key: "overview",      label: "Tổng Quan",            icon: Home,            path: "/manager",             exact: true },
    { key: "clubs",         label: "Quản Lý CLB",          icon: Building2,       path: "/manager/clubs" },
    { key: "members",       label: "Quản Lý Thành Viên",   icon: Users,           path: "/manager/members" },
    { key: "events",        label: "Sự Kiện",              icon: Calendar,        path: "/manager/events" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/manager/notifications" },
    { key: "reports",       label: "Báo Cáo",              icon: BarChart2,       path: "/manager/reports" },
    { key: "profile",       label: "Thông Tin Tài Khoản",  icon: UserCircle,      path: "/manager/profile" },
  ],

  CLUB_LEADER: [
    { key: "overview",      label: "Tổng Quan",            icon: Home,       path: "/club-leader",             exact: true },
    { key: "my-club",       label: "Câu Lạc Bộ Của Tôi",   icon: Building2,  path: "/club-leader/my-club" },
    { key: "clubs",         label: "Khám Phá CLB",         icon: Star,       path: "/club-leader/clubs" },
    { key: "events",        label: "Khám Phá Sự Kiện",     icon: Calendar,   path: "/club-leader/events" },
    { key: "tickets",       label: "Vé Của Tôi",           icon: ClipboardList, path: "/club-leader/tickets" },
    { key: "pending-feedback", label: "Feedback Cần Gửi",  icon: MessageSquare, path: "/club-leader/pending-feedback" },
    { key: "contributions", label: "Đóng Góp Của Tôi",     icon: Award,      path: "/club-leader/contributions" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,       path: "/club-leader/notifications" },
    { key: "profile",       label: "Thông Tin Tài Khoản",  icon: UserCircle, path: "/club-leader/profile" },
  ],

  VICE_LEADER: [
    { key: "overview",      label: "Tổng Quan",            icon: Home,       path: "/vice-leader",             exact: true },
    { key: "my-club",       label: "Câu Lạc Bộ Của Tôi",   icon: Building2,  path: "/vice-leader/my-club" },
    { key: "clubs",         label: "Khám Phá CLB",         icon: Star,       path: "/vice-leader/clubs" },
    { key: "events",        label: "Khám Phá Sự Kiện",     icon: Calendar,   path: "/vice-leader/events" },
    { key: "tickets",       label: "Vé Của Tôi",           icon: ClipboardList, path: "/vice-leader/tickets" },
    { key: "pending-feedback", label: "Feedback Cần Gửi",  icon: MessageSquare, path: "/vice-leader/pending-feedback" },
    { key: "contributions", label: "Đóng Góp Của Tôi",     icon: Award,      path: "/vice-leader/contributions" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,       path: "/vice-leader/notifications" },
    { key: "profile",       label: "Thông Tin Tài Khoản",  icon: UserCircle, path: "/vice-leader/profile" },
  ],

  MEMBER: [
    { key: "home",          label: "Bảng Điều Khiển",      icon: LayoutDashboard, path: "/member",              exact: true },
    { key: "my-clubs",      label: "Câu Lạc Bộ Của Tôi",   icon: Building2,       path: "/member/my-clubs" },
    { key: "clubs",         label: "Khám Phá CLB",         icon: Star,            path: "/member/clubs" },
    { key: "apply",         label: "Đơn Ứng Tuyển",       icon: Send,            path: "/member/apply" },
    { key: "events",        label: "Khám Phá Sự Kiện",     icon: Calendar,        path: "/member/events" },
    { key: "tickets",        label: "Vé Của Tôi",           icon: ClipboardList,   path: "/member/tickets" },
    { key: "pending-feedback", label: "Feedback Cần Gửi",   icon: MessageSquare,    path: "/member/pending-feedback" },
    { key: "contributions", label: "Đóng Góp Của Tôi",    icon: Award,           path: "/member/contributions" },
    { key: "notifications", label: "Thông Báo",            icon: Bell,            path: "/member/notifications" },
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
  CLUB_MANAGER: "Quản Lý CLB",
  CLUB_LEADER:  "Trưởng CLB",
  VICE_LEADER:  "Phó Trưởng CLB",
  MEMBER:       "Thành Viên",
  ALUMNI:       "Cựu Sinh Viên",
  GUEST:        "Khách",
};

export function getSidebarConfig(role) {
  return SIDEBAR_CONFIGS[role] ?? SIDEBAR_CONFIGS.MEMBER;
}

