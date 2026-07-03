/**
 * FE-CORE-01 — Constants/enum mapping
 *
 * Ánh xạ tất cả enum values từ BE sang nhãn tiếng Việt + màu badge.
 * Nguồn: backend/src/main/java/com/fptu/fcms/enums/
 *
 * Dùng helper getLabel / getColor thay vì truy cập trực tiếp để tránh
 * crash khi BE thêm giá trị enum mới chưa có trong map này.
 */

// ── RegistrationStatus ───────────────────────────────────────────────
export const REGISTRATION_STATUS = {
  PENDING_VERIFICATION: { label: 'Chờ xác thực OTP',       color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  PENDING_APPROVAL:     { label: 'Chờ duyệt',              color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  REGISTERED:           { label: 'Đã đăng ký',             color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  CONFIRMED:            { label: 'Đã xác nhận',            color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  WAITLISTED:           { label: 'Danh sách chờ',          color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700' },
  PROMOTED:             { label: 'Vừa được duyệt từ chờ',  color: 'teal',   bg: 'bg-teal-100',   text: 'text-teal-700'   },
  REJECTED:             { label: 'Đã từ chối',             color: 'red',    bg: 'bg-red-100',    text: 'text-red-700'    },
  CANCELLED:            { label: 'Đã huỷ',                 color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

// ── EventStatus ──────────────────────────────────────────────────────
export const EVENT_STATUS = {
  DRAFT:                          { label: 'Nháp',                           color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
  PENDING:                        { label: 'Chờ phê duyệt',                  color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  PENDING_APPROVAL:               { label: 'Chờ IC-PDP duyệt',              color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  APPROVED:                       { label: 'Đã phê duyệt',                  color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  REJECTED:                       { label: 'Đã từ chối',                    color: 'red',    bg: 'bg-red-100',    text: 'text-red-700'    },
  CANCELLED:                      { label: 'Đã huỷ',                        color: 'red',    bg: 'bg-red-100',    text: 'text-red-700'    },
  REGISTRATION_OPEN:              { label: 'Đang mở đăng ký',               color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  REGISTRATION_CLOSED:            { label: 'Đã đóng đăng ký',               color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
  CHECKIN_OPEN:                   { label: 'Đang điểm danh',                color: 'teal',   bg: 'bg-teal-100',   text: 'text-teal-700'   },
  ONGOING:                        { label: 'Đang diễn ra',                  color: 'teal',   bg: 'bg-teal-100',   text: 'text-teal-700'   },
  COMPLETED:                      { label: 'Đã kết thúc',                   color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  REPORT_UPLOADED:                { label: 'Đã nộp báo cáo',                color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  REPORT_PENDING_APPROVAL:        { label: 'Báo cáo chờ IC-PDP duyệt',      color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  REPORT_APPROVED:                { label: 'Báo cáo đã duyệt',              color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  REPORT_REJECTED:                { label: 'Báo cáo bị từ chối',            color: 'red',    bg: 'bg-red-100',    text: 'text-red-700'    },
  CONTRIBUTION_DRAFT:             { label: 'Đánh giá đóng góp — Nháp',      color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
  CONTRIBUTION_CALCULATED:        { label: 'Đã tính điểm đóng góp',         color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  CONTRIBUTION_SCORING:           { label: 'Đang chấm điểm đóng góp',       color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700' },
  CONTRIBUTION_PENDING_APPROVAL:  { label: 'Đóng góp chờ duyệt',            color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONTRIBUTION_APPROVED:          { label: 'Đóng góp đã duyệt',             color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  CONTRIBUTION_FINALIZED:         { label: 'Đóng góp hoàn tất',             color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  CLOSED:                         { label: 'Đã đóng',                       color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

// ── AttendanceStatus ─────────────────────────────────────────────────
export const ATTENDANCE_STATUS = {
  PRESENT: { label: 'Có mặt', color: 'green',  bg: 'bg-green-100',  text: 'text-green-700' },
  ABSENT:  { label: 'Vắng',   color: 'red',    bg: 'bg-red-100',    text: 'text-red-700'   },
};

// ── AttendanceSessionStatus ──────────────────────────────────────────
export const ATTENDANCE_SESSION_STATUS = {
  DRAFT:  { label: 'Chưa mở',  color: 'gray',  bg: 'bg-gray-100',  text: 'text-gray-600'  },
  OPEN:   { label: 'Đang mở',  color: 'green', bg: 'bg-green-100', text: 'text-green-700' },
  CLOSED: { label: 'Đã đóng',  color: 'red',   bg: 'bg-red-100',   text: 'text-red-700'   },
};

// ── ParticipantType ──────────────────────────────────────────────────
export const PARTICIPANT_TYPE = {
  CORE_TEAM:         { label: 'Ban tổ chức',      color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700' },
  SUPPORT_ORGANIZER: { label: 'Hỗ trợ tổ chức',  color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  PARTICIPANT:       { label: 'Người tham dự',    color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
  GUEST:             { label: 'Khách',            color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700' },
};

// ── ContributionBatchStatus ──────────────────────────────────────────
export const CONTRIBUTION_BATCH_STATUS = {
  DRAFT:             { label: 'Nháp điểm đóng góp', color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  APPEAL_WINDOW:     { label: 'Mở cửa sổ kháng cáo', color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  FINALIZED:         { label: 'Hoàn tất',          color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  SCORING:           { label: 'Đang chấm điểm',   color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  APPEAL_OPEN:       { label: 'Mở cửa sổ kháng cáo', color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  APPEAL_RESOLUTION: { label: 'Đang xử lý kháng cáo', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700' },
};

// ── AppealStatus ─────────────────────────────────────────────────────
export const APPEAL_STATUS = {
  PENDING:  { label: 'Chờ xử lý',    color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  APPROVED: { label: 'Đã chấp nhận', color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  REJECTED: { label: 'Đã từ chối',   color: 'red',    bg: 'bg-red-100',    text: 'text-red-700'    },
};

// ── FeedbackAssessmentStatus ─────────────────────────────────────────
export const FEEDBACK_ASSESSMENT_STATUS = {
  GOOD:               { label: 'Tốt',            color: 'green', bg: 'bg-green-100', text: 'text-green-700' },
  NOT_GOOD:           { label: 'Chưa tốt',       color: 'red',   bg: 'bg-red-100',   text: 'text-red-700'   },
  INSUFFICIENT_SAMPLE:{ label: 'Chưa đủ mẫu đánh giá', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-500' },
};

// ── FeedbackInvitationStatus ─────────────────────────────────────────
export const FEEDBACK_INVITATION_STATUS = {
  ACTIVE:  { label: 'Chưa sử dụng', color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  USED:    { label: 'Đã hoàn thành', color: 'green',  bg: 'bg-green-100',  text: 'text-green-700'  },
  EXPIRED: { label: 'Đã hết hạn',   color: 'gray',   bg: 'bg-gray-100',   text: 'text-gray-500'   },
  REVOKED: { label: 'Đã thu hồi',   color: 'red',    bg: 'bg-red-100',    text: 'text-red-700'    },
};

// ── GuestOtpStatus ───────────────────────────────────────────────────
export const GUEST_OTP_STATUS = {
  ACTIVE:  { label: 'Còn hiệu lực' },
  USED:    { label: 'Đã dùng'      },
  EXPIRED: { label: 'Đã hết hạn'   },
  LOCKED:  { label: 'Bị khoá (nhập sai quá nhiều)' },
};

// ── CheckInMethod ────────────────────────────────────────────────────
export const CHECK_IN_METHOD = {
  STAFF_LOOKUP:       { label: 'Tra cứu thủ công' },
  MANUAL:             { label: 'Nhập tay'          },
  AUTO:               { label: 'Tự động'            },
  WALK_IN:            { label: 'Walk-in tại chỗ'   },
  EMERGENCY_OVERRIDE: { label: 'Override khẩn cấp' },
};

// ── VerificationMethod ───────────────────────────────────────────────
export const VERIFICATION_METHOD = {
  STUDENT_CARD:    { label: 'Thẻ sinh viên'           },
  FPT_ACCOUNT:     { label: 'Tài khoản FPT'           },
  PHONE_LAST4:     { label: '4 số cuối điện thoại'    },
  MANUAL_OVERRIDE: { label: 'Override thủ công'        },
};

// ── DiscoverySource ──────────────────────────────────────────────────
export const DISCOVERY_SOURCE = {
  FACEBOOK: { label: 'Facebook'             },
  FRIEND:   { label: 'Bạn bè giới thiệu'   },
  WEBSITE:  { label: 'Website'              },
  OTHER:    { label: 'Khác'                 },
};

// ── RegistrationChannel ──────────────────────────────────────────────
export const REGISTRATION_CHANNEL = {
  FPTU:    { label: 'Sinh viên FPTU'  },
  ONLINE:  { label: 'Online (Khách)'  },
  WALK_IN: { label: 'Walk-in tại chỗ' },
};

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Lấy label tiếng Việt từ map + key.
 * Nếu key không tồn tại trong map, trả về fallback (mặc định là key gốc).
 */
export function getLabel(map, key, fallback) {
  return map[key]?.label ?? fallback ?? key ?? '—';
}

/**
 * Lấy Tailwind class bg + text cho badge.
 * Trả về object { bg, text } để dùng trong className.
 */
export function getBadgeClasses(map, key) {
  return {
    bg:   map[key]?.bg   ?? 'bg-gray-100',
    text: map[key]?.text ?? 'text-gray-600',
  };
}

/**
 * Render-ready badge string: `${bg} ${text}`.
 */
export function badgeClass(map, key) {
  const c = getBadgeClasses(map, key);
  return `${c.bg} ${c.text}`;
}
