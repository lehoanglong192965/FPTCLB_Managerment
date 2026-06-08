//Nhập thư viện axios
import axios from "axios";

//Định nghĩa một hằng số đối tượng (ROLES) chứa từ khóa của tất cả vai trò.
export const ROLES = {
  GUEST: "GUEST",
  MEMBER: "MEMBER",       // Default sau khi register
  CORE_TEAM: "CORE_TEAM",
  VICE_LEADER: "VICE_LEADER",
  CLUB_LEADER: "CLUB_LEADER",
  CLUB_MANAGER: "CLUB_MANAGER",
  ADMIN: "ADMIN",
  ALUMNI: "ALUMNI",
};

// Thứ tự quyền của các vai trò, dùng để so sánh nhanh trong hasMinRole()
const ROLE_LEVEL = {
  [ROLES.GUEST]: 0,
  [ROLES.MEMBER]: 1,
  [ROLES.CORE_TEAM]: 2,
  [ROLES.VICE_LEADER]: 3,
  [ROLES.CLUB_LEADER]: 4,
  [ROLES.CLUB_MANAGER]: 5,
  [ROLES.ADMIN]: 6,
};

// Kiểm tra role hiện tại có đủ quyền tối thiểu không
// Dùng trong component: hasMinRole(ROLES.CLUB_LEADER) → true/false
export function hasMinRole(requiredRole) {
  const current = TokenService.getRole();
  return (ROLE_LEVEL[current] ?? 0) >= (ROLE_LEVEL[requiredRole] ?? 0);
}

// Không cần token cho các endpoint này.
const PUBLIC_PREFIXES = [
  "/clubs/public",           // Danh sách & chi tiết CLB
  "/events/public",   // Sự kiện công khai
  "/auth/login",
  "/auth/register",   // Đăng ký → backend tự set role = MEMBER
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
];

/*Dùng phương thức .some() để quét qua mảng PUBLIC_PREFIXES. 
 Nếu chuỗi url bắt đầu bằng (startsWith) bất kỳ tiền tố nào trong mảng 
 xác nhận đây là đường dẫn công khai bằng giá trị --> true. */
function isPublicEndpoint(url = "") {
  return PUBLIC_PREFIXES.some(
    (prefix) =>
      url === prefix || url.startsWith(prefix + "/")
  );
}

// ─────────────────────────────────────────────────────────────────
//  TOKEN & ROLE SERVICE  — lưu trữ và truy xuất token/role từ localStorage
// ─────────────────────────────────────────────────────────────────
const storage = typeof window !== "undefined" ? localStorage : null;

export const TokenService = {
  getAccess: () => storage?.getItem("access_token") ?? null,
  getRefresh: () => storage?.getItem("refresh_token") ?? null,
  // Mặc định GUEST nếu chưa đăng nhập
  getRole: () => storage?.getItem("user_role") ?? ROLES.GUEST,

  // Gọi sau khi login/register thành công
  // Ví dụ: TokenService.save(response.data)
  // Backend cần trả về: { access_token, refresh_token, role }
  save({ access_token, refresh_token, role }) {
    storage?.setItem("access_token", access_token);
    storage?.setItem("refresh_token", refresh_token);
    // role = "MEMBER" cho người mới đăng ký
    // role = "CLUB_LEADER" nếu là chủ nhiệm, v.v.
    storage?.setItem("user_role", role ?? ROLES.MEMBER);
  },

  // Dọn dẹp sạch sẽ dữ liệu phiên làm việc, phục vụ cho việc đăng xuất hoặc xóa quyền khi hệ thống phát hiện gian lận/hết hạn.
  clear() {
    storage?.removeItem("access_token");
    storage?.removeItem("refresh_token");
    storage?.removeItem("user_role");
  },
};


//Quy định thời gian chờ tối đa cho một hành động gửi/nhận dữ liệu là 12 giây (12000ms) nhằm tối ưu cho môi trường mạng có thể không ổn định của sinh viên.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "https://your-api-url.com/api",
  headers: { "Content-Type": "application/json" },
  timeout: 12000,
});

// ─────────────────────────────────────────────────────────────────
//  DEDUPLICATION — hủy request trùng chưa hoàn thành
// ─────────────────────────────────────────────────────────────────
const pendingRequests = new Map();

function buildPendingKey(config) {
  return [
    config.method,
    config.url,
    JSON.stringify(config.params),
    JSON.stringify(config.data),
  ].join("&");
}

function addPending(config) {
  const key = buildPendingKey(config);

  if (pendingRequests.has(key)) {
    pendingRequests.get(key).abort();
  }

  const controller = new AbortController();

  config.signal = controller.signal;

  pendingRequests.set(key, controller);
}

function removePending(config) {
  if (!config) return;
  const key = buildPendingKey(config);
  pendingRequests.delete(key);
}

// ─────────────────────────────────────────────────────────────────
//  LOGGER — chỉ chạy ở môi trường dev. Dùng để debug nhanh mà không cần bật Network tab của trình duyệt.
// ─────────────────────────────────────────────────────────────────

//Trích xuất trạng thái môi trường từ trình đóng gói Vite để biết hệ thống có đang trong trạng thái chạy thử nghiệm ở máy lập trình viên hay không (true/false).
const isDev = import.meta.env.DEV;

function logReq(config) {
  if (!isDev) return;
  const role = TokenService.getRole();
  console.groupCollapsed(`[API] ➡️  ${config.method?.toUpperCase()} ${config.url} [${role}]`);
  if (config.params) console.log("Params:", config.params);
  if (config.data) console.log("Body:", config.data);
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
//  AUTO REFRESH TOKEN — tự động làm mới token khi hết hạn mà không cần ép người dùng đăng nhập lại
// ─────────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

const enqueueRefresh = (cb) => refreshQueue.push(cb);
const flushQueue = (token) => { refreshQueue.forEach((cb) => cb(token)); refreshQueue = []; };
const rejectQueue = (err) => { refreshQueue.forEach((cb) => cb(null, err)); refreshQueue = []; };

async function doRefresh() {
  const refreshToken = TokenService.getRefresh();
  if (!refreshToken) throw new Error("No refresh token");
  // Gọi thẳng axios để tránh vòng lặp interceptor
  const { data } = await axios.post(
    `${axiosClient.defaults.baseURL}/auth/refresh`,
    { refreshToken }
  );
  // Lưu lại token mới, giữ nguyên role (role không đổi khi refresh)
  TokenService.save({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    role: TokenService.getRole(),
  });
  return data.access_token;
}

// ─────────────────────────────────────────────────────────────────
//  RETRY — tự động thử lại khi server lỗi 5xx
// ─────────────────────────────────────────────────────────────────
const MAX_RETRY = 3;
const RETRY_BASE_DELAY = 600; // ms

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────
//  REQUEST INTERCEPTOR — gắn token, log request, thêm vào pending
// ─────────────────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    config._startTime = Date.now();
    config._retryCount = config._retryCount ?? 0;

    addPending(config);
    logReq(config);

    // Gắn token cho mọi route NGOẠI TRỪ public endpoints
    if (!isPublicEndpoint(config.url)) {
      const token = TokenService.getAccess();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      // Không có token → server trả 401 → interceptor xử lý bên dưới
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────
//  RESPONSE INTERCEPTOR  — log response, xử lý lỗi, refresh token, retry, v.v.
// ─────────────────────────────────────────────────────────────────
axiosClient.interceptors.response.use(
  // ================= SUCCESS =================
  (response) => {
    removePending(response.config);
    logRes(response);

    return "data" in response ? response.data : response;
  },

  // ================= ERROR =================
  async (error) => {
    // Request bị huỷ
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalConfig = error.config || {};

    removePending(originalConfig);
    logErr(error);

    const status = error.response?.status;

    // =========================================================
    // NETWORK ERROR
    // =========================================================
    if (!error.response) {
      console.error("Network Error!!!");
      return Promise.reject(error);
    }



    // Refresh token cũng hết hạn / invalid
    if (originalConfig.url?.includes("/auth/refresh")) {
      console.warn("[API] 🔒 Refresh token hết hạn");

      TokenService.clear();

      // Không reload toàn bộ app
      window.dispatchEvent(
        new CustomEvent("auth:logout", {
          detail: {
            reason: "refresh_expired",
            returnUrl:
              window.location.pathname + window.location.search,
          },
        })
      );

      return Promise.reject(error);
    }

    // =========================================================
    // 401 - ACCESS TOKEN EXPIRED
    // =========================================================
    if (
      status === 401 &&
      !originalConfig._retry &&
      !isPublicEndpoint(originalConfig.url)
    ) {
      originalConfig._retry = true;

      // Nếu đang refresh -> chờ token mới
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          enqueueRefresh((newToken, err) => {
            if (err) {
              reject(err);
              return;
            }

            originalConfig.headers = originalConfig.headers || {};
            originalConfig.headers.Authorization = `Bearer ${newToken}`;

            resolve(axiosClient(originalConfig));
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await doRefresh();

        flushQueue(newToken);

        originalConfig.headers.Authorization = `Bearer ${newToken}`;

        return axiosClient(originalConfig);
      } catch (refreshError) {
        rejectQueue(refreshError);

        TokenService.clear();

        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search
        );

        window.location.href = `/login?returnUrl=${returnUrl}`;

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // =========================================================
    // 403 - FORBIDDEN
    // =========================================================
    if (status === 403) {
      const role = TokenService.getRole();

      console.warn(
        `Không đủ quyền truy cập. Role hiện tại: ${role}`
      );

      // Optional:
      // window.dispatchEvent(
      //   new CustomEvent("app:forbidden", {
      //     detail: { role },
      //   })
      // );
    }
    
    // =========================================================
    // 404 - NOT FOUND
    // =========================================================
    // [FIX 6] Thêm xử lý 404 để dễ mở rộng sau này
    if (status === 404) {
      console.warn(`Không tìm thấy resource: ${originalConfig.url}`);
    }

    // =========================================================
    // 5xx - RETRY REQUEST
    // =========================================================
    const retryableMethods = ["get", "head", "options"];

    if (
      status >= 500 &&
      retryableMethods.includes(originalConfig.method?.toLowerCase()) &&
      originalConfig._retryCount < MAX_RETRY
    ) {
      originalConfig._retryCount =
        (originalConfig._retryCount || 0) + 1;

      const delay = RETRY_BASE_DELAY * Math.pow(2, originalConfig._retryCount - 1);

      console.warn(
        `[API] ⏳ Retry ${originalConfig._retryCount}/${MAX_RETRY} sau ${delay}ms`
      );

      await sleep(delay);

      return axiosClient(originalConfig);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;