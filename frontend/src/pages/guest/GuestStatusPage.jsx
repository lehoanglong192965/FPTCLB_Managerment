import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Calendar, MapPin } from 'lucide-react';
import { MOCK_GUEST_REGISTRATION } from '../../constants/mockData';

// TODO Sprint 4: thay MOCK_GUEST_REGISTRATION bằng guestService.getStatus(ref)

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
  const data = MOCK_GUEST_REGISTRATION;
  const cfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.CONFIRMED;

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
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Mã tham chiếu</span>
            <span className="font-mono font-medium text-gray-800">{data.guestRef}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Họ tên</span>
            <span className="font-medium text-gray-800">{data.fullName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-800">{data.email}</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mt-3">
            <p className="font-semibold text-gray-800 mb-2">{data.event.eventName}</p>
            <p className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} /> {data.event.startDate}
            </p>
            <p className="flex items-center gap-2 text-gray-500 mt-1">
              <MapPin size={14} /> {data.event.location}
            </p>
          </div>
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
