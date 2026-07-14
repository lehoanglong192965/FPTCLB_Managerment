import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import AlertModal from '../components/ui/AlertModal';

const TITLES = {
  success: 'Thành công',
  error:   'Có lỗi xảy ra',
  warning: 'Cảnh báo',
  info:    'Thông báo',
};

/* ── Context ────────────────────────────────────────────────── */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const dismiss = useCallback(() => setToast(null), []);

  /**
   * Hiện popup thông báo (dùng chung giao diện với AlertModal).
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} message   — dòng chính
   * @param {string} [title]   — tiêu đề (mặc định theo type)
   */
  const show = useCallback((type, message, { title } = {}) => {
    // Chỉ hiện 1 popup tại một thời điểm — popup mới thay thế popup cũ,
    // giống cách ConfirmContext xử lý dialog chồng nhau.
    setToast({ type, message, title: title ?? TITLES[type] });
  }, []);

  const api = useMemo(() => ({
    success: (msg, opts) => show('success', msg, opts ?? {}),
    error:   (msg, opts) => show('error',   msg, opts ?? {}),
    warning: (msg, opts) => show('warning', msg, opts ?? {}),
    info:    (msg, opts) => show('info',    msg, opts ?? {}),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <AlertModal
          type={toast.type}
          title={toast.title}
          message={toast.message}
          confirmLabel="Đã hiểu"
          onClose={dismiss}
        />
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
