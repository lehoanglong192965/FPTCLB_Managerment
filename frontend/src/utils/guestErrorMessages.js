// Dịch mã lỗi từ backend (GuestRegistrationService) sang thông báo tiếng Việt thân thiện.
// Backend trả mã dạng ALL_CAPS trong response.data.message, ví dụ "GUEST_DUPLICATE_PHONE".
const GUEST_ERROR_MESSAGES = {
  GUEST_DUPLICATE_EMAIL: 'Email này đã được dùng để đăng ký sự kiện này rồi. Vui lòng kiểm tra lại hoặc dùng email khác.',
  GUEST_DUPLICATE_PHONE: 'Số điện thoại này đã được dùng để đăng ký sự kiện này rồi. Vui lòng kiểm tra lại hoặc dùng số khác.',
  FPT_EMAIL_LOGIN_REQUIRED: 'Email FPT (@fpt.edu.vn / @fe.edu.vn) không dùng form khách — vui lòng đăng nhập để đăng ký.',
  EVENT_NOT_FOUND: 'Sự kiện không tồn tại hoặc đã bị gỡ.',
  OTP_INVALID: 'Mã OTP không đúng. Vui lòng kiểm tra lại.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng bấm "Gửi lại mã" để nhận mã mới.',
  OTP_LOCKED: 'Bạn đã nhập sai quá số lần cho phép. Vui lòng gửi lại mã mới.',
  OTP_RESEND_COOLDOWN: 'Bạn vừa yêu cầu mã OTP. Vui lòng đợi một lát rồi thử gửi lại.',
  GUEST_REFERENCE_INVALID: 'Liên kết đăng ký không hợp lệ hoặc đã hết hạn.',
};

const ERROR_CODE_PATTERN = /^[A-Z0-9_]+$/;

/**
 * Lấy thông báo lỗi hiển thị cho user từ một axios error.
 * - Mã lỗi đã biết → câu tiếng Việt tương ứng.
 * - Mã lỗi lạ (dạng ALL_CAPS) → fallback, không hiển thị mã thô cho user.
 * - Backend trả message dạng câu chữ bình thường → hiển thị nguyên văn.
 */
export function guestErrorMessage(err, fallback) {
  const raw = String(err?.response?.data?.message ?? '').trim();
  if (!raw) return fallback;
  const mapped = GUEST_ERROR_MESSAGES[raw.toUpperCase()];
  if (mapped) return mapped;
  return ERROR_CODE_PATTERN.test(raw) ? fallback : raw;
}
