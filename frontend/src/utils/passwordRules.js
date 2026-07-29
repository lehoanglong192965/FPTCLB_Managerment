/**
 * Điều kiện mật khẩu dùng chung cho mọi form đặt/đổi mật khẩu
 * (đăng ký tài khoản, đặt lại mật khẩu sau khi quên).
 *
 * Khai báo 1 chỗ để phần validate lúc submit và phần checklist gợi ý
 * lúc người dùng gõ không bao giờ lệch nhau — và khi đổi luật thì
 * mọi form đổi theo cùng lúc.
 *
 * Lưu ý: backend hiện không ràng buộc gì cho password (RegisterRequest /
 * ResetPasswordRequest chỉ là String trần), nên đây là chốt chặn duy nhất.
 */

export const PASSWORD_RULES = [
  { key: "length",  label: "ít nhất 8 ký tự",  test: (v) => v.length >= 8 },
  { key: "upper",   label: "1 chữ hoa",        test: (v) => /[A-Z]/.test(v) },
  { key: "lower",   label: "1 chữ thường",     test: (v) => /[a-z]/.test(v) },
  // Dấu cách cố ý không tính là ký tự đặc biệt.
  { key: "special", label: "1 ký tự đặc biệt", test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v) },
];

/** true nếu mật khẩu thoả toàn bộ điều kiện. */
export function isPasswordValid(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value ?? ""));
}

/**
 * Sentinel cho lỗi "mật khẩu chưa đủ mạnh".
 *
 * Form vẫn set lỗi này để chặn submit, nhưng **không render hộp lỗi** cho nó —
 * PasswordRuleHint đã nói rõ thiếu gì rồi, hiện thêm hộp lỗi là thừa.
 */
export const WEAK_PASSWORD_ERROR = "__weak_password__";
