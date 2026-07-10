const AVATAR_COLORS = ["#2563eb", "#e6430a", "#059669", "#7c3aed", "#db2777", "#d97706"];

function normalizeNameKey(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Sinh initials (1-2 ký tự) từ tên đầy đủ.
 * ≥2 từ: chữ cái đầu của từ đầu + từ cuối. 1 từ: 2 ký tự đầu.
 */
export function getInitials(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Sinh màu avatar ổn định cho 1 danh tính — dùng chung 1 seed (ưu tiên id
 * ổn định như userID; nếu không có, dùng tên đã chuẩn hoá) để cùng 1 tài
 * khoản luôn ra cùng 1 màu ở mọi nơi, không phụ thuộc vị trí trong danh sách.
 */
export function getAvatarColor(seed) {
  const key = typeof seed === "string" ? normalizeNameKey(seed) : String(seed ?? "");
  return AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
}
