export const CLUB_ROLE_NAMES = {
  LEADER:       "Leader",
  VICE_LEADER:  "ViceLeader",
  MEMBER:       "Member",
};

export const ROLE_MAP = {
  1: "ADMIN",
  2: "ICPDP",
  3: "MEMBER",
};

export const ROLE_REDIRECT = {
  ADMIN:        "/admin",
  ICPDP:        "/icpdp/club-management",
  MEMBER:       "/member",
  CLUB_LEADER:  "/club-leader",
  VICE_LEADER:  "/vice-leader",
};

// Claim "clubRole" trong JWT → role hiển thị ở frontend.
// Backend chỉ set claim này khi user là Leader/ViceLeader của một CLB
// (AuthServiceImpl.login và OAuth2SuccessHandler dùng chung logic đó),
// Member thường không có claim ⇒ giữ nguyên role hệ thống.
const CLUB_ROLE_CLAIM_TO_APP_ROLE = {
  Leader:     "CLUB_LEADER",
  ViceLeader: "VICE_LEADER",
};

/**
 * Suy ra role hiển thị + clubId trực tiếp từ payload JWT.
 *
 * Trước đây frontend gọi thêm GET /user/my-club-role sau khi đăng nhập để biết
 * user có phải Leader/ViceLeader không. Request đó vừa thừa (token đã mang sẵn
 * claim clubRole/clubId) vừa nguy hiểm: chỉ cần nó lỗi mạng là Leader bị tụt
 * xuống Member và mất toàn bộ menu quản lý CLB cho tới lần đăng nhập sau.
 *
 * @param {object|null} payload payload đã decode từ access token
 * @returns {{ role: string, clubId: number|null }}
 */
export function resolveRoleFromClaims(payload) {
  const systemRole = ROLE_MAP[payload?.roleID] ?? "MEMBER";
  if (systemRole !== "MEMBER") return { role: systemRole, clubId: null };

  const elevatedRole = CLUB_ROLE_CLAIM_TO_APP_ROLE[payload?.clubRole];
  if (!elevatedRole) return { role: systemRole, clubId: null };

  return { role: elevatedRole, clubId: payload?.clubId ?? null };
}
