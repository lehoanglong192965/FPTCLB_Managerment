/**
 * FE-CORE-03 — API error → UI message mapping
 *
 * axiosClient đã xử lý HTTP status (401 → logout, 5xx → retry).
 * Utility này xử lý tầng business error: trích message từ response BE
 * và map về tiếng Việt có nghĩa với người dùng.
 *
 * Cấu trúc response lỗi của BE (theo BE-CORE-06):
 *   { message: string, errorCode?: string, status?: number }
 */

// ── Business error code → tiếng Việt ─────────────────────────────────
// Mở rộng khi BE định nghĩa thêm error codes (BE-CORE-06).
const ERROR_CODE_MAP = {
  // Registration
  CAPACITY_EXCEEDED:           'Sự kiện đã đầy chỗ.',
  QUOTA_EXCEEDED:              'Hết suất dành cho nhóm đăng ký của bạn.',
  ALREADY_REGISTERED:          'Bạn đã đăng ký sự kiện này rồi.',
  REGISTRATION_CLOSED:         'Đăng ký đã đóng.',
  REGISTRATION_NOT_FOUND:      'Không tìm thấy đăng ký.',
  REGISTRATION_NOT_CANCELLABLE:'Không thể huỷ đăng ký ở trạng thái hiện tại.',
  NOT_ELIGIBLE:                'Bạn không đủ điều kiện đăng ký sự kiện này.',

  // Guest OTP
  OTP_INVALID:                 'Mã OTP không đúng.',
  OTP_EXPIRED:                 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
  OTP_LOCKED:                  'Tài khoản tạm bị khoá do nhập sai quá nhiều lần.',
  OTP_ALREADY_USED:            'Mã OTP đã được sử dụng.',
  GUEST_ALREADY_EXISTS:        'Email này đã có đăng ký đang hoạt động cho sự kiện.',

  // Attendance
  ALREADY_CHECKED_IN:          'Người tham dự đã được điểm danh.',
  SESSION_NOT_OPEN:            'Phiên điểm danh chưa mở hoặc đã đóng.',
  SESSION_NOT_FOUND:           'Không tìm thấy phiên điểm danh.',
  VERIFICATION_FAILED:         'Xác minh danh tính thất bại.',
  REGISTRATION_NOT_CONFIRMED:  'Đăng ký chưa được xác nhận, không thể điểm danh.',

  // Walk-in
  FPTU_STUDENT_NOT_FOUND:      'Không tìm thấy sinh viên FPTU với MSSV / email này.',
  WALK_IN_NOT_ALLOWED:         'Sự kiện này không cho phép walk-in.',

  // Event
  EVENT_NOT_FOUND:             'Không tìm thấy sự kiện.',
  EVENT_NOT_IN_VALID_STATE:    'Sự kiện đang ở trạng thái không cho phép thao tác này.',

  // Report
  REPORT_ALREADY_EXISTS:       'Báo cáo đã tồn tại.',
  REPORT_NOT_FOUND:            'Không tìm thấy báo cáo.',

  // Contribution
  CONTRIBUTION_LOCKED:         'Đánh giá đóng góp đã bị khoá.',
  SELF_EVALUATION_NOT_ALLOWED: 'Không thể tự đánh giá bản thân.',
  APPEAL_WINDOW_CLOSED:        'Cửa sổ kháng cáo đã đóng.',
  APPEAL_ALREADY_SUBMITTED:    'Bạn đã nộp kháng cáo rồi.',

  // Auth / Permission
  UNAUTHORIZED:                'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN:                   'Bạn không có quyền thực hiện thao tác này.',
  ACCESS_DENIED:               'Truy cập bị từ chối.',
};

// ── HTTP status fallback ──────────────────────────────────────────────
const HTTP_STATUS_MAP = {
  400: 'Dữ liệu không hợp lệ.',
  401: 'Phiên đăng nhập hết hạn.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy tài nguyên.',
  409: 'Xung đột dữ liệu. Vui lòng thử lại.',
  422: 'Dữ liệu không thể xử lý.',
  429: 'Quá nhiều yêu cầu. Vui lòng chờ một lúc.',
  500: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  502: 'Máy chủ không phản hồi.',
  503: 'Dịch vụ tạm thời không khả dụng.',
};

/**
 * Trích xuất message từ Axios error.
 *
 * Thứ tự ưu tiên:
 *   1. ERROR_CODE_MAP[errorCode] — nếu BE trả về errorCode cụ thể
 *   2. response.data.message     — message text trực tiếp từ BE
 *   3. HTTP_STATUS_MAP[status]   — fallback theo HTTP status code
 *   4. fallback param            — do caller cung cấp
 *   5. 'Đã xảy ra lỗi. Vui lòng thử lại.'
 */
export function extractError(err, fallback) {
  if (!err) return fallback ?? 'Đã xảy ra lỗi. Vui lòng thử lại.';

  const data   = err?.response?.data;
  const status = err?.response?.status;

  // 1. Business error code từ BE
  if (data?.errorCode && ERROR_CODE_MAP[data.errorCode]) {
    return ERROR_CODE_MAP[data.errorCode];
  }

  // 2. Message text trực tiếp từ BE (nếu đã là tiếng Việt)
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }

  // 3. HTTP status fallback
  if (status && HTTP_STATUS_MAP[status]) {
    return HTTP_STATUS_MAP[status];
  }

  // 4. Caller fallback hoặc generic
  return fallback ?? 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

/**
 * Kiểm tra lỗi có phải do network không (không có response).
 */
export function isNetworkError(err) {
  return Boolean(err && !err.response);
}

/**
 * Kiểm tra lỗi có phải 404 không.
 */
export function isNotFound(err) {
  return err?.response?.status === 404;
}

/**
 * Kiểm tra lỗi có phải 403 không.
 */
export function isForbidden(err) {
  return err?.response?.status === 403;
}
