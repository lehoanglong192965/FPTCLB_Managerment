import axios from "axios";

export const ROLES = {
  GUEST: "GUEST",
  MEMBER: "MEMBER",
  CORE_TEAM: "CORE_TEAM",
  VICE_LEADER: "VICE_LEADER",
  ROLE_Leader: "ROLE_Leader",
  CLUB_MANAGER: "CLUB_MANAGER",
  ADMIN: "ADMIN",
  ALUMNI: "ALUMNI",
};

const ROLE_LEVEL = {
  [ROLES.GUEST]: 0,
  [ROLES.MEMBER]: 1,
  [ROLES.CORE_TEAM]: 2,
  [ROLES.VICE_LEADER]: 3,
  [ROLES.ROLE_Leader]: 4,
  [ROLES.CLUB_MANAGER]: 5,
  [ROLES.ADMIN]: 6,
};

export function hasMinRole(requiredRole) {
  const current = TokenService.getRole();
  return (ROLE_LEVEL[current] ?? 0) >= (ROLE_LEVEL[requiredRole] ?? 0);
}

// Endpoint không cần đính kèm Authorization header
const PUBLIC_PREFIXES = [
  "/clubs/public",
  "/events/public",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/guest-feedback",
  "/v1/feedback/guest",
];

function isPublicEndpoint(url = "") {
  return PUBLIC_PREFIXES.some(
    (prefix) => url === prefix || url.startsWith(prefix + "/")
  );
}

// ─────────────────────────────────────────────────────────────────
//  TOKEN SERVICE — lưu trữ và truy xuất token/role từ localStorage
// ─────────────────────────────────────────────────────────────────
const storage = typeof window !== "undefined" ? localStorage : null;

export const TokenService = {
  getAccess:  () => storage?.getItem("access_token")  ?? null,
  getRefresh: () => storage?.getItem("refresh_token") ?? null,
  getRole:    () => storage?.getItem("user_role")     ?? ROLES.GUEST,
  getClubId: () => {
    const v = storage?.getItem("user_club_id");
    return v ? parseInt(v, 10) : null;
  },

  save({ access_token, refresh_token, role, clubId }) {
    if (access_token)  storage?.setItem("access_token",  access_token);
    if (refresh_token) storage?.setItem("refresh_token", refresh_token);
    storage?.setItem("user_role", role ?? ROLES.MEMBER);
    if (clubId != null) storage?.setItem("user_club_id", String(clubId));
    else storage?.removeItem("user_club_id");
  },

  clear() {
    storage?.removeItem("access_token");
    storage?.removeItem("refresh_token");
    storage?.removeItem("user_role");
    storage?.removeItem("user_club_id");
  },
};

// ─────────────────────────────────────────────────────────────────
//  AXIOS INSTANCE
// ─────────────────────────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ─────────────────────────────────────────────────────────────────
//  DEDUPLICATION — hủy request trùng chưa hoàn thành
// ─────────────────────────────────────────────────────────────────
const pendingRequests = new Map();

function buildPendingKey(config) {
  return [config.method, config.url, JSON.stringify(config.params), JSON.stringify(config.data)].join("&");
}

function addPending(config) {
  const key = buildPendingKey(config);
  if (pendingRequests.has(key)) pendingRequests.get(key).abort();
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(key, controller);
}

function removePending(config) {
  if (!config) return;
  pendingRequests.delete(buildPendingKey(config));
}

// ─────────────────────────────────────────────────────────────────
//  LOGGER — chỉ chạy ở môi trường dev
// ─────────────────────────────────────────────────────────────────
const isDev = import.meta.env.DEV;

function logReq(config) {
  if (!isDev) return;
  console.groupCollapsed(`[API] ➡️  ${config.method?.toUpperCase()} ${config.url} [${TokenService.getRole()}]`);
  if (config.params) console.log("Params:", config.params);
  if (config.data)   console.log("Body:",   config.data);
  console.groupEnd();
}

function logRes(res) {
  if (!isDev) return;
  const ms = Date.now() - res.config._startTime;
  console.groupCollapsed(`[API] ✅ ${res.status} ${res.config.url} (${ms}ms)`);
  console.log("Data:", res.data);
  console.groupEnd();
}

function logErr(err) {
  if (!isDev) return;
  const ms = Date.now() - (err.config?._startTime ?? Date.now());
  console.groupCollapsed(`[API] ❌ ${err.response?.status ?? "Network"} ${err.config?.url} (${ms}ms)`);
  console.error(err.response?.data ?? err.message);
  console.groupEnd();
}

// ─────────────────────────────────────────────────────────────────
//  REQUEST INTERCEPTOR
// ─────────────────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    config._startTime  = Date.now();
    config._retryCount = config._retryCount ?? 0;

    addPending(config);
    logReq(config);

    if (!isPublicEndpoint(config.url)) {
      const token = TokenService.getAccess();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────
//  RESPONSE INTERCEPTOR
// ─────────────────────────────────────────────────────────────────
const MAX_RETRY       = 3;
const RETRY_BASE_DELAY = 600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

axiosClient.interceptors.response.use(
  (response) => {
    removePending(response.config);
    logRes(response);
    return "data" in response ? response.data : response;
  },

  async (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const originalConfig = error.config || {};
    removePending(originalConfig);
    logErr(error);

    const status = error.response?.status;

    if (!error.response) {
      console.error("[API] Network Error");
      return Promise.reject(error);
    }

    // 401 — token hết hạn hoặc không hợp lệ → logout
    if (status === 401 && !isPublicEndpoint(originalConfig.url)) {
      TokenService.clear();
      window.dispatchEvent(
        new CustomEvent("auth:logout", {
          detail: {
            reason:    "token_expired",
            returnUrl: window.location.pathname + window.location.search,
          },
        })
      );
      return Promise.reject(error);
    }

    // 403 — không đủ quyền
    if (status === 403) {
      console.warn(`[API] Forbidden — role hiện tại: ${TokenService.getRole()}`);
    }

    // 404 — resource không tồn tại
    if (status === 404) {
      console.warn(`[API] Not Found: ${originalConfig.url}`);
    }

    // 5xx — retry với exponential backoff (chỉ GET/HEAD/OPTIONS)
    const retryableMethods = ["get", "head", "options"];
    if (
      status >= 500 &&
      retryableMethods.includes(originalConfig.method?.toLowerCase()) &&
      originalConfig._retryCount < MAX_RETRY
    ) {
      originalConfig._retryCount += 1;
      const delay = RETRY_BASE_DELAY * Math.pow(2, originalConfig._retryCount - 1);
      console.warn(`[API] Retry ${originalConfig._retryCount}/${MAX_RETRY} sau ${delay}ms`);
      await sleep(delay);
      return axiosClient(originalConfig);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
