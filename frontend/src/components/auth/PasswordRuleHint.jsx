import { PASSWORD_RULES } from "../../utils/passwordRules";

/**
 * Một dòng gợi ý gộp chung dưới ô mật khẩu, chỉ nêu những điều kiện **còn thiếu**:
 *   "Mật khẩu cần ít nhất 8 ký tự, 1 chữ hoa và 1 ký tự đặc biệt."
 *
 * Đủ hết điều kiện (hoặc chưa gõ gì) thì ẩn hẳn — không để lại dòng thừa.
 *
 * `invalid` = đã bấm submit mà mật khẩu chưa đạt → chuyển đỏ. Trong lúc gõ
 * vẫn để xám cho đỡ "la làng" ngay ký tự đầu tiên.
 */
export default function PasswordRuleHint({ value, invalid = false, className = "" }) {
  if (!value) return null;

  const missing = PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
  if (missing.length === 0) return null;

  // "a, b và c" — dấu phẩy cho các mục đầu, "và" cho mục cuối.
  const text = missing.length === 1
    ? missing[0]
    : `${missing.slice(0, -1).join(", ")} và ${missing[missing.length - 1]}`;

  return (
    <p className={`text-[11px] leading-[1.4] ${invalid ? "text-[#D0453A]" : "text-[#ABABAB]"} ${className}`}>
      Mật khẩu cần {text}.
    </p>
  );
}
