import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ── Config ─────────────────────────────────────────────────── */

const VARIANTS = {
  success: {
    icon:  CheckCircle2,
    bg:    'bg-green-50',
    border:'border-green-200',
    icon_color: 'text-green-500',
    title_color:'text-green-800',
    msg_color:  'text-green-700',
  },
  error: {
    icon:  XCircle,
    bg:    'bg-red-50',
    border:'border-red-200',
    icon_color: 'text-red-500',
    title_color:'text-red-800',
    msg_color:  'text-red-700',
  },
  warning: {
    icon:  AlertTriangle,
    bg:    'bg-yellow-50',
    border:'border-yellow-200',
    icon_color: 'text-yellow-500',
    title_color:'text-yellow-800',
    msg_color:  'text-yellow-700',
  },
  info: {
    icon:  Info,
    bg:    'bg-blue-50',
    border:'border-blue-200',
    icon_color: 'text-blue-500',
    title_color:'text-blue-800',
    msg_color:  'text-blue-700',
  },
};

const DEFAULT_DURATION = 4000;

/* ── Context ────────────────────────────────────────────────── */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Hiện toast.
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} message   — dòng chính
   * @param {string} [title]   — tiêu đề (tuỳ chọn)
   * @param {number} [duration]— ms tự đóng (0 = không tự đóng)
   */
  const show = useCallback((type, message, { title, duration = DEFAULT_DURATION } = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title }]);

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (msg, opts) => show('success', msg, opts ?? {}),
    error:   (msg, opts) => show('error',   msg, opts ?? {}),
    warning: (msg, opts) => show('warning', msg, opts ?? {}),
    info:    (msg, opts) => show('info',    msg, opts ?? {}),
  }), [show]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

/* ── Toast item ─────────────────────────────────────────────── */

function ToastItem({ toast: t, onDismiss }) {
  const v = VARIANTS[t.type] ?? VARIANTS.info;
  const Icon = v.icon;

  return (
    <div
      className={`flex items-start gap-3 w-80 max-w-full p-4 rounded-xl border shadow-lg ${v.bg} ${v.border} transition-all`}
      role="alert"
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${v.icon_color}`} />
      <div className="flex-1 min-w-0">
        {t.title && (
          <p className={`text-sm font-semibold leading-tight ${v.title_color}`}>{t.title}</p>
        )}
        <p className={`text-sm leading-snug ${t.title ? 'mt-0.5' : ''} ${v.msg_color}`}>
          {t.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Đóng"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ── Container (góc dưới phải) ──────────────────────────────── */

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
