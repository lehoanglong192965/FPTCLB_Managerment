import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { TokenService } from "../services/api/axiosClient";
import { decodeJwtPayload } from "../lib/tokenGuard";

const LS_PUSHED_KEY  = "fptclb_club_notifications";
const LS_READ_PREFIX = "fptclb_notif_read_";

const loadLS = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
};

function resolveRole(authUser) {
  if (authUser?.role) return authUser.role;
  const stored = TokenService.getRole();
  if (stored && stored !== "GUEST") return stored;
  const token   = TokenService.getAccess() || sessionStorage.getItem("auth_token");
  const payload = token ? decodeJwtPayload(token) : null;
  return payload?.roles?.[0]?.toUpperCase() ?? "GUEST";
}

/* ── Mock notifications theo từng role ─────────────────────────── */

const now = () => Date.now();

const MOCK_BY_ROLE = {
  MEMBER: [
    {
      id: 101, type: "reminder",
      title: '"Tech Talk #12" diễn ra sau 1 giờ nữa',
      content: "FPT Tech Club bắt đầu lúc 15:00 tại Phòng B201. Bạn đã đăng ký tham gia.",
      clubName: "FPT Tech Club",
      actionUrl: "/member/tickets", actionLabel: "Xem vé",
      createdAt: new Date(now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 102, type: "approval",
      title: '"Code War 2026" đã được phê duyệt',
      content: 'IC-PDP chấp thuận đề xuất của IT Club. Sự kiện diễn ra ngày 28/06 tại Hội trường A.',
      clubName: "IT Club",
      actionUrl: "/member/events", actionLabel: "Xem sự kiện",
      createdAt: new Date(now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 103, type: "deadline",
      title: "Deadline nộp báo cáo sắp đến",
      content: 'Còn 1 ngày để nộp báo cáo tổng kết "Acoustic Night" cho IT Club.',
      clubName: "IT Club",
      actionUrl: "/member/my-clubs", actionLabel: "Xem yêu cầu",
      createdAt: new Date(now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 104, type: "approval",
      title: '"Gen Z Hackathon" cần chỉnh sửa',
      content: "IC-PDP yêu cầu cập nhật ngân sách và địa điểm. Xem phản hồi để biết chi tiết.",
      clubName: "FPT Coder",
      actionUrl: "/member/my-clubs", actionLabel: "Xem phản hồi",
      createdAt: new Date(now() - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 105, type: "recruit",
      title: "IT Club mở đơn tuyển thành viên Gen 13",
      content: "Hạn nộp đơn: 30/06/2026. Còn 10 ngày — nộp sớm để được ưu tiên phỏng vấn.",
      clubName: "IT Club",
      actionUrl: "/member/clubs", actionLabel: "Nộp đơn ngay",
      createdAt: new Date(now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 106, type: "event",
      title: "Sự kiện mới: Acoustic Night Vol.5",
      content: 'CLB Âm Nhạc FPT tổ chức đêm nhạc ngày 05/07. Đăng ký để nhận vé sớm.',
      clubName: "CLB Âm Nhạc FPT",
      actionUrl: "/member/events", actionLabel: "Xem sự kiện",
      createdAt: new Date(now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 107, type: "general",
      title: "Gia hạn thành viên kỳ Summer 2026",
      content: "Vui lòng xác nhận tham gia tiếp kỳ Summer 2026 trước ngày 31/07.",
      clubName: "Hệ thống",
      actionUrl: null, actionLabel: null,
      createdAt: new Date(now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  CLUB_LEADER: [
    {
      id: 201, type: "approval",
      title: '"Workshop UI/UX Design" được IC-PDP phê duyệt',
      content: "IC-PDP chấp thuận đề xuất sự kiện. Tiến hành chuẩn bị và thông báo cho thành viên.",
      clubName: "IC-PDP",
      actionUrl: "/club-leader/events", actionLabel: "Xem sự kiện",
      createdAt: new Date(now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 202, type: "general",
      title: "5 đơn ứng tuyển mới đang chờ xét duyệt",
      content: "Có 5 đơn ứng tuyển Gen 13 mới cần bạn xem xét và phản hồi trong 3 ngày tới.",
      clubName: "Hệ thống",
      actionUrl: "/club-leader/applications", actionLabel: "Xem đơn",
      createdAt: new Date(now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 203, type: "deadline",
      title: "Hạn nộp báo cáo hoạt động kỳ SP2026",
      content: "Hoàn thành và nộp báo cáo tổng kết hoạt động kỳ SP2026 trước ngày 30/06/2026.",
      clubName: "IC-PDP",
      actionUrl: "/club-leader/reports", actionLabel: "Nộp báo cáo",
      createdAt: new Date(now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 204, type: "approval",
      title: '"Tech Talk #12" bị từ chối — cần chỉnh sửa',
      content: "IC-PDP yêu cầu điều chỉnh ngân sách và kế hoạch nhân sự. Xem chi tiết phản hồi.",
      clubName: "IC-PDP",
      actionUrl: "/club-leader/events", actionLabel: "Xem phản hồi",
      createdAt: new Date(now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 205, type: "general",
      title: "Nhắc lịch: Họp ban điều hành ngày 25/06",
      content: "Buổi họp định kỳ lúc 17:00 tại Phòng Lab IT. Chuẩn bị báo cáo tiến độ sự kiện.",
      clubName: "CLB IT",
      actionUrl: null, actionLabel: null,
      createdAt: new Date(now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  VICE_LEADER: [
    {
      id: 211, type: "approval",
      title: '"Workshop UI/UX Design" được IC-PDP phê duyệt',
      content: "IC-PDP chấp thuận đề xuất sự kiện. Hỗ trợ trưởng CLB chuẩn bị công tác tổ chức.",
      clubName: "IC-PDP",
      actionUrl: "/vice-leader/events", actionLabel: "Xem sự kiện",
      createdAt: new Date(now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 212, type: "general",
      title: "5 đơn ứng tuyển Gen 13 chờ xem xét",
      content: "Trưởng CLB đã giao bạn phụ trách sơ loại đơn ứng tuyển đợt này.",
      clubName: "Hệ thống",
      actionUrl: "/vice-leader/members", actionLabel: "Xem đơn",
      createdAt: new Date(now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 213, type: "deadline",
      title: "Hạn nộp báo cáo kỳ SP2026",
      content: "Hỗ trợ trưởng CLB hoàn thiện báo cáo tổng kết trước ngày 30/06/2026.",
      clubName: "IC-PDP",
      actionUrl: null, actionLabel: null,
      createdAt: new Date(now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  CORE_TEAM: [
    {
      id: 221, type: "event",
      title: '"Workshop UI/UX Design" được phê duyệt — cần chuẩn bị',
      content: "Sự kiện diễn ra ngày 10/07. Phân công nhân sự ban kỹ thuật và hậu cần đã sẵn sàng.",
      clubName: "IC-PDP",
      actionUrl: "/core-team/events", actionLabel: "Xem phân công",
      createdAt: new Date(now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 222, type: "general",
      title: "Nhắc lịch họp ban điều hành ngày 25/06",
      content: "Họp lúc 17:00 tại Phòng Lab IT. Trưởng CLB yêu cầu tất cả ban điều hành có mặt.",
      clubName: "CLB IT",
      actionUrl: null, actionLabel: null,
      createdAt: new Date(now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  ICPDP: [
    {
      id: 301, type: "general",
      title: "Đơn thành lập CLB Photography mới",
      content: "Nhóm sinh viên K18 nộp đơn xin thành lập CLB Nhiếp ảnh. Hồ sơ chờ IC-PDP xét duyệt.",
      clubName: "Hệ thống",
      actionUrl: "/icpdp/club-requests", actionLabel: "Xét duyệt",
      createdAt: new Date(now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 302, type: "general",
      title: 'IT Club đề xuất sự kiện "Code War 2026"',
      content: "Cuộc thi lập trình ngày 28/06. Ngân sách 6.500.000 đ — vượt giới hạn, cần xem xét kỹ.",
      clubName: "IT Club",
      actionUrl: "/icpdp/event-approval", actionLabel: "Xét duyệt",
      createdAt: new Date(now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 303, type: "deadline",
      title: "Hạn xét duyệt đơn CLB AI Research còn 3 ngày",
      content: "Theo quy định, đơn thành lập CLB phải được xử lý trong 14 ngày kể từ ngày nộp.",
      clubName: "Hệ thống",
      actionUrl: "/icpdp/club-requests", actionLabel: "Xử lý ngay",
      createdAt: new Date(now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 304, type: "general",
      title: 'English Club đề xuất "Workshop Public Speaking"',
      content: "Sự kiện ngày 15/07 tại Hội trường B. Ngân sách 3.000.000 đ. Không có xung đột lịch.",
      clubName: "English Club",
      actionUrl: "/icpdp/event-approval", actionLabel: "Xét duyệt",
      createdAt: new Date(now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 305, type: "general",
      title: "Báo cáo hoạt động Q2/2026 từ 8 CLB",
      content: "8 câu lạc bộ đã nộp báo cáo quý 2. Vui lòng xem xét và phê duyệt trước 30/06.",
      clubName: "Hệ thống",
      actionUrl: null, actionLabel: null,
      createdAt: new Date(now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  ADMIN: [
    {
      id: 401, type: "general",
      title: "Hệ thống cập nhật thành công lên v2.1.0",
      content: "Phiên bản mới bổ sung thông báo theo vai trò và cải thiện hiệu suất tổng thể.",
      clubName: "Hệ thống",
      actionUrl: null, actionLabel: null,
      createdAt: new Date(now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 402, type: "general",
      title: "5 tài khoản sinh viên mới đăng ký hôm nay",
      content: "5 tài khoản đang chờ xác nhận. Kiểm tra và kích hoạt nếu cần.",
      clubName: "Hệ thống",
      actionUrl: "/admin/users", actionLabel: "Xem người dùng",
      createdAt: new Date(now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 403, type: "deadline",
      title: "Học kỳ SP2026 kết thúc ngày 31/07/2026",
      content: "Còn 41 ngày. Nhắc các CLB hoàn thành báo cáo và tổng kết hoạt động.",
      clubName: "Hệ thống",
      actionUrl: "/admin", actionLabel: "Quản lý học kỳ",
      createdAt: new Date(now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  CLUB_MANAGER: [
    {
      id: 501, type: "general",
      title: "3/5 CLB đã nộp báo cáo tháng 6",
      content: "IT Club, English Club, Art Club đã nộp. FPTU FC và Melody Club chưa nộp.",
      clubName: "Hệ thống",
      actionUrl: "/manager/reports", actionLabel: "Xem báo cáo",
      createdAt: new Date(now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 502, type: "deadline",
      title: "Hạn nộp báo cáo quản lý còn 5 ngày",
      content: "Tổng hợp và nộp báo cáo quản lý CLB trước ngày 25/06/2026.",
      clubName: "Hệ thống",
      actionUrl: "/manager/reports", actionLabel: "Nộp báo cáo",
      createdAt: new Date(now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 503, type: "general",
      title: "FPTU FC xin tổ chức giải thể thao nội bộ",
      content: "CLB Bóng đá nộp đề xuất FPTU Cup 2026. Cần xem xét và chuyển IC-PDP phê duyệt.",
      clubName: "FPTU FC",
      actionUrl: "/manager/events", actionLabel: "Xem đề xuất",
      createdAt: new Date(now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user }  = useAuth();
  const role      = resolveRole(user);
  const lsReadKey = `${LS_READ_PREFIX}${role}`;

  const [pushed,  setPushed]  = useState(() => loadLS(LS_PUSHED_KEY, []));
  const [readIds, setReadIds] = useState(() => new Set(loadLS(lsReadKey, [])));

  // Khi role đổi (đăng nhập role khác), load readIds của role đó
  const persistRead = useCallback((ids) => {
    localStorage.setItem(lsReadKey, JSON.stringify([...ids]));
  }, [lsReadKey]);

  const roleMocks = MOCK_BY_ROLE[role] ?? [];

  // Pushed notifications (Club Leader → Member) chỉ hiển thị cho MEMBER
  const notifications = useMemo(() => {
    const visiblePushed = role === "MEMBER"
      ? pushed.map((n) => ({
          ...n,
          type:        n.type ?? "general",
          clubName:    n.clubName ?? "CLB",
          actionUrl:   n.actionUrl ?? null,
          actionLabel: n.actionLabel ?? null,
        }))
      : [];
    return [...visiblePushed, ...roleMocks];
  }, [pushed, roleMocks, role]);

  const markRead = useCallback((id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistRead(next);
      return next;
    });
  }, [persistRead]);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set([...prev, ...notifications.map((n) => n.id)]);
      persistRead(next);
      return next;
    });
  }, [notifications, persistRead]);

  const isRead = useCallback((id) => readIds.has(id), [readIds]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const addNotification = useCallback(({ title, content, clubId, clubName }) => {
    const item = {
      id:          Date.now(),
      title,
      content,
      clubId:      clubId ?? null,
      clubName:    clubName ?? "CLB",
      type:        "general",
      actionUrl:   null,
      actionLabel: null,
      createdAt:   new Date().toISOString(),
    };
    setPushed((prev) => {
      const next = [item, ...prev];
      localStorage.setItem(LS_PUSHED_KEY, JSON.stringify(next));
      return next;
    });
    return item;
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, markRead, markAllRead, isRead, unreadCount }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
