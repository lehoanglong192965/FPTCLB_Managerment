import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Calendar, MapPin, RefreshCw } from 'lucide-react';
import guestApi from '../../services/api/guest/guestApi';
import { guestErrorMessage } from '../../utils/guestErrorMessages';

const STATUS_CONFIG = {
  CONFIRMED: {
    icon: <CheckCircle2 size={40} className="text-green-500" />,
    bg: 'bg-green-50',
    title: 'Đăng ký thành công!',
    desc: 'Vui lòng kiểm tra email để nhận hướng dẫn check-in.',
    badge: 'Đã xác nhận',
    badgeColor: 'bg-green-100 text-green-700',
  },
  PENDING_VERIFICATION: {
    icon: <Clock size={40} className="text-yellow-500" />,
    bg: 'bg-yellow-50',
    title: 'Chờ xác thực OTP',
    desc: 'Vui lòng kiểm tra email và nhập mã OTP.',
    badge: 'Chờ xác thực',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
  WAITLISTED: {
    icon: <Clock size={40} className="text-blue-500" />,
    bg: 'bg-blue-50',
    title: 'Trong danh sách chờ',
    desc: 'Bạn sẽ được thông báo nếu có chỗ trống.',
    badge: 'Danh sách chờ',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  CANCELLED: {
    icon: <XCircle size={40} className="text-red-500" />,
    bg: 'bg-red-50',
    title: 'Đăng ký đã huỷ',
    desc: 'Đăng ký của bạn đã bị huỷ.',
    badge: 'Đã huỷ',
    badgeColor: 'bg-red-100 text-red-700',
  },
};

export default function GuestStatusPage() {
  const { ref } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await guestApi.getStatus(ref);
      setData(res?.data ?? res);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      setError(guestErrorMessage(err, 'Không tìm thấy thông tin đăng ký.'));
    } finally {
      setLoading(false);
    }
  }, [ref]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">Không tìm thấy đăng ký</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 mx-auto text-sm text-orange-500 hover:underline"
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.CONFIRMED;
  const ev = data.event ?? {};

  const dateStr = ev.startDate
    ? new Date(ev.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ev.startDate;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        {/* Status banner */}
        <div className={`${cfg.bg} rounded-xl p-6 text-center mb-6`}>
          <div className="flex justify-center mb-3">{cfg.icon}</div>
          <h1 className="text-xl font-bold text-gray-900">{cfg.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{cfg.desc}</p>
          <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeColor}`}>
            {cfg.badge}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-3 text-sm">
          {data.email && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800">{data.email}</span>
            </div>
          )}

          {ev.eventName && (
            <div className="bg-gray-50 rounded-lg p-4 mt-3">
              <p className="font-semibold text-gray-800 mb-2">{ev.eventName}</p>
              {dateStr && (
                <p className="flex items-center gap-2 text-gray-500">
                  <Calendar size={14} /> {dateStr}
                </p>
              )}
              {ev.location && (
                <p className="flex items-center gap-2 text-gray-500 mt-1">
                  <MapPin size={14} /> {ev.location}
                </p>
              )}
            </div>
          )}
        </div>

        <Link
          to="/"
          className="block text-center mt-6 text-sm text-orange-500 hover:underline font-medium"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
