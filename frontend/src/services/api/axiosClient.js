import axios from "axios";

// Endpoint không cần đính kèm Authorization header — đồng bộ với
// SecurityConfig.java phía backend (permitAll). Một số route chỉ public với
// một HTTP method cụ thể (vd: GET /clubs công khai nhưng PATCH /clubs/{id}/review
// vẫn cần đăng nhập), nên khai báo kèm method khi cần để tránh đánh dấu nhầm
// các endpoint yêu cầu xác thực là public.
const PUBLIC_ROUTES = [
  { prefix: "/auth" },
  { prefix: "/uploads" },
  { prefix: "/clubs", method: "get" },
  { prefix: "/v1/events/approved", method: "get" },
  { pattern: /^\/v1\/events\/\d+$/, method: "get" },
  { pattern: /^\/events\/[^/]+\/guest-registrations$/, method: "post" },
  { pattern: /^\/events\/[^/]+\/registrations\/guest$/, method: "post" },
  { pattern: /^\/v1\/events\/[^/]+\/registrations\/guest$/, method: "post" },
  { prefix: "/guest-registrations" },
  { prefix: "/guest-feedback" },
  { prefix: "/v1/feedback/guest" },
];

function isPublicEndpoint(url = "", method = "get") {
  const m = (method || "get").toLowerCase();
  return PUBLIC_ROUTES.some((route) => {
    if (route.method && route.method !== m) return false;
    if (route.pattern) return route.pattern.test(url);
    return url === route.prefix || url.startsWith(route.prefix + "/");
  });
}

// ─────────────────────────────────────────────────────────────────
//  TOKEN SERVICE — lưu trữ và truy xuất token/role từ localStorage
// ─────────────────────────────────────────────────────────────────
const storage = typeof window !== "undefined" ? localStorage : null;

export const TokenService = {
  getAccess:  () => storage?.getItem("access_token")  ?? null,
  getRefresh: () => storage?.getItem("refresh_token") ?? null,
  getRole:    () => storage?.getItem("user_role")     ?? "GUEST",
  getClubId: () => {
    const v = storage?.getItem("user_club_id");
    return v ? parseInt(v, 10) : null;
  },

  save({ access_token, refresh_token, role, clubId }) {
    if (access_token)  storage?.setItem("access_token",  access_token);
    if (refresh_token) storage?.setItem("refresh_token", refresh_token);
    storage?.setItem("user_role", role ?? "MEMBER");
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

// GET/HEAD/OPTIONS là idempotent — nhiều nơi trong app có thể hợp lệ cùng gọi
// một endpoint giống hệt nhau (vd: nhiều component cùng fetch "/clubs/my").
// Huỷ request cũ trong các trường hợp này chỉ gây ra race condition ở nơi gọi
// không liên quan, nên chỉ áp dụng dedup-abort cho các method có side effect.
const DEDUP_METHODS = new Set(["post", "put", "patch", "delete"]);

function addPending(config) {
  if (config.data instanceof FormData) return;
  const method = (config.method || "get").toLowerCase();
  if (!DEDUP_METHODS.has(method)) return;
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

    if (!isPublicEndpoint(config.url, config.method)) {
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
    // (bỏ qua nếu request tự đánh dấu skipAuthLogout, vd: request dò quyền phụ trong lúc login,
    // vốn đã được caller tự xử lý lỗi cục bộ, không nên coi là mất phiên đăng nhập)
    if (status === 401 && !isPublicEndpoint(originalConfig.url, originalConfig.method) && !originalConfig.skipAuthLogout) {
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

export const getServerOrigin = () =>
  (import.meta.env.VITE_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

export default axiosClient;
