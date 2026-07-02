/**
 * FE-CORE-06 — PII masking utilities
 *
 * Dùng để hiển thị thông tin cá nhân đã được ẩn bớt trên UI.
 * Backend (BE-2) cũng mask ở tầng response — các hàm này dùng thêm
 * ở FE khi cần format lại dữ liệu local trước khi render.
 *
 * Quy tắc chung: giữ lại đủ ký tự để người dùng nhận ra thông tin
 * của mình, nhưng không đủ để bên thứ ba khai thác.
 */

/**
 * Mask email.
 * "example@gmail.com" → "exa***@gmail.com"
 * Giữ 3 ký tự đầu local part; nếu local part ≤ 3 ký tự thì giữ 1.
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return email;

  const local  = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  const keep   = Math.min(Math.max(1, Math.floor(local.length / 2)), 3);

  return `${local.slice(0, keep)}***${domain}`;
}

/**
 * Mask số điện thoại.
 * "0912345678" → "091***5678"
 * Giữ 3 số đầu và 4 số cuối.
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return phone; // quá ngắn, không mask
  return `${digits.slice(0, 3)}***${digits.slice(-4)}`;
}

/**
 * Mask họ tên.
 * "Nguyễn Văn An" → "Nguyễn V*** A***"
 * Giữ lại họ đầy đủ, ẩn từ thứ 2 trở đi (chỉ giữ ký tự đầu).
 */
export function maskName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}***`;

  const [first, ...rest] = parts;
  const maskedRest = rest.map((p) => `${p[0]}***`).join(' ');
  return `${first} ${maskedRest}`;
}

/**
 * Mask mã sinh viên / CMND / CCCD.
 * "SE150042" → "SE1***42"
 * Giữ 3 ký tự đầu và 2 ký tự cuối.
 */
export function maskStudentId(id) {
  if (!id || typeof id !== 'string') return '';
  if (id.length <= 5) return `${id[0]}***`;
  return `${id.slice(0, 3)}***${id.slice(-2)}`;
}

/**
 * Detect xem một chuỗi đã được mask chưa (chứa ***).
 * Dùng để tránh mask hai lần.
 */
export function isMasked(value) {
  return typeof value === 'string' && value.includes('***');
}
