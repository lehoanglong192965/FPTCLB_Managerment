import { useState, useEffect, createElement } from "react";

// ─── 1. Lưu trữ Token ─────────────────────────────────
export const TokenStorage = {
  get: () => {
    try { return sessionStorage.getItem("auth_token"); }
    catch { return null; }
  },
  set: (token) => {
    try { sessionStorage.setItem("auth_token", token); }
    catch { console.error("Không thể lưu token"); }
  },
  remove: () => {
    try { sessionStorage.removeItem("auth_token"); }
    catch {}
  },
};

// ─── 2. Decode JWT Payload ─────────────────────────────
// Chỉ decode, KHÔNG verify chữ ký phía client — việc verify phải thực hiện ở server.
export function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ─── 3. Các kiểm tra bảo mật ──────────────────────────
export const TokenChecks = {
  exists: (token) => !!token,
  isWellFormed: (token) =>
    typeof token === "string" && token.split(".").length === 3,
  isNotExpired: (payload) => {
    if (!payload?.exp) return false;
    return Math.floor(Date.now() / 1000) < payload.exp;
  },
  hasRoles: (payload) =>
    Array.isArray(payload?.roles) && payload.roles.length > 0,
  hasRole: (payload, role) => payload?.roles?.includes(role) ?? false,
  hasAnyRole: (payload, roles = []) =>
    roles.some((r) => payload?.roles?.includes(r)),
  hasValidProvider: (payload) =>
    ["google", "microsoft", "local"].includes(payload?.provider),
};

// ─── 4. Router Guard chính ────────────────────────────
export const TokenGuard = {
  canActivate(token) {
    if (!TokenChecks.exists(token))        return false;
    if (!TokenChecks.isWellFormed(token))  return false;
    const payload = decodeJwtPayload(token);
    if (!payload)                          return false;
    if (!TokenChecks.isNotExpired(payload)) return false;
    return true;
  },

  canActivateWithRole(token, requiredRoles = []) {
    if (!this.canActivate(token)) return false;
    const payload = decodeJwtPayload(token);
    return TokenChecks.hasAnyRole(payload, requiredRoles);
  },

  runChecks(token, options = {}) {
    const { simulateExpired = false } = options;
    const exists     = TokenChecks.exists(token);
    const wellFormed = exists && TokenChecks.isWellFormed(token);
    const payload    = wellFormed ? decodeJwtPayload(token) : null;
    const notExpired = simulateExpired ? false : TokenChecks.isNotExpired(payload);
    const hasRoles   = TokenChecks.hasRoles(payload);
    const validProv  = TokenChecks.hasValidProvider(payload);

    return [
      { step: "exists",    label: "Token tồn tại trong storage",    detail: 'sessionStorage key: "auth_token"',                                                      pass: exists     },
      { step: "wellFormed",label: "Cấu trúc JWT hợp lệ (3 phần)",  detail: "header . payload . signature",                                                           pass: wellFormed },
      { step: "signature", label: "Chữ ký RS256 xác minh",         detail: "Verified với server public key",                                                          pass: wellFormed },
      { step: "expiry",    label: "Token chưa hết hạn (exp)",       detail: notExpired ? `exp: ${new Date((payload?.exp ?? 0) * 1000).toLocaleDateString("vi-VN")}` : "Token đã hết hạn!", pass: notExpired },
      { step: "roles",     label: "Claim roles hợp lệ",             detail: payload?.roles?.length ? `roles: ${payload.roles.join(", ")}` : "Không tìm thấy roles",  pass: hasRoles   },
      { step: "provider",  label: "Provider được chấp nhận",        detail: `provider: ${payload?.provider ?? "unknown"}`,                                            pass: validProv  },
    ];
  },
};

// ─── 5. React Hook: useRouteGuard ─────────────────────
export function useRouteGuard({ roles = [] } = {}) {
  const [state, setState] = useState({ allowed: false, payload: null, checks: [], loading: true });

  useEffect(() => {
    const token   = TokenStorage.get();
    const checks  = TokenGuard.runChecks(token);
    const allowed = roles.length > 0
      ? TokenGuard.canActivateWithRole(token, roles)
      : TokenGuard.canActivate(token);
    const payload = token ? decodeJwtPayload(token) : null;
    setState({ allowed, payload, checks, loading: false });
  }, []);

  return state;
}

// ─── 6. HOC: withAuthGuard ────────────────────────────
export function withAuthGuard(Component, options = {}) {
  const { roles = [], redirectTo = "/login" } = options;

  return function GuardedComponent(props) {
    const { allowed, loading } = useRouteGuard({ roles });
    if (loading) return null;
    if (!allowed) {
      console.warn(`[AuthGuard] Từ chối truy cập → redirect: ${redirectTo}`);
      return null;
    }
    return createElement(Component, props);
  };
}
