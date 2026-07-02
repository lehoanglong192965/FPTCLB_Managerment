import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

/**
 * FE-CORE-05 — Error + Retry component
 *
 * Props:
 *   message  string          — thông báo lỗi (mặc định chung)
 *   onRetry  () => void      — callback khi bấm "Thử lại"
 *   type     'generic'|'network'|'empty'  (default 'generic')
 *   compact  boolean         — dùng trong card nhỏ (default false)
 */
export default function ErrorRetry({
  message,
  onRetry,
  type = 'generic',
  compact = false,
}) {
  const config = {
    generic: {
      Icon: AlertCircle,
      iconColor: 'text-red-400',
      defaultMsg: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    },
    network: {
      Icon: WifiOff,
      iconColor: 'text-orange-400',
      defaultMsg: 'Không thể kết nối máy chủ. Kiểm tra internet rồi thử lại.',
    },
    empty: {
      Icon: AlertCircle,
      iconColor: 'text-gray-300',
      defaultMsg: 'Không có dữ liệu.',
    },
  }[type] ?? { Icon: AlertCircle, iconColor: 'text-red-400', defaultMsg: 'Lỗi không xác định.' };

  const { Icon, iconColor, defaultMsg } = config;
  const displayMsg = message || defaultMsg;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 py-2">
        <Icon size={15} className={iconColor} />
        <span>{displayMsg}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 underline text-red-500 hover:text-red-700 font-medium"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <Icon size={48} className={iconColor} />
      <p className="text-sm text-gray-500 max-w-xs">{displayMsg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          Thử lại
        </button>
      )}
    </div>
  );
}
