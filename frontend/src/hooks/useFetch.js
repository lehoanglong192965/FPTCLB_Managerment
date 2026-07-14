import { useState, useEffect, useCallback } from "react";

/**
 * Gói lại khuôn mẫu fetch lặp lại ở hầu hết page: loading/error state,
 * bỏ qua kết quả nếu component đã unmount, và bỏ qua lỗi do request bị huỷ
 * (dedupe request trong axiosClient).
 *
 * @param {() => Promise<any>} fetcher   hàm gọi API, không nhận tham số (đóng gói biến qua deps)
 * @param {any[]} deps                    dependency array, giống useEffect
 * @param {{ initialData?: any, errorMessage?: string }} [options]
 * @returns {{ data, setData, loading, error, refetch }}
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { initialData = null, errorMessage = "Không thể tải dữ liệu." } = options;
  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetcher()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => {
        if (cancelled || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setError(err?.response?.data?.message ?? err?.message ?? errorMessage);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, setData, loading, error, refetch };
}
