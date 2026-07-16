import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';
import guestApi from '../../services/api/guest/guestApi';
import eventApi from '../../services/api/events/eventApi';
import AlertModal from '../../components/ui/AlertModal';
import { guestErrorMessage } from '../../utils/guestErrorMessages';

export default function GuestRegisterPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    eventApi.getEventById(eventId)
      .then((res) => { if (!cancelled) setEvent(res?.data ?? res); })
      .catch((err) => {
        if (cancelled || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setEvent(null);
      })
      .finally(() => { if (!cancelled) setEventLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  const handleChange = (e) => {
    setError(null);
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await guestApi.register(Number(eventId), {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        consent: true,
        discoverySource: 'EVENT_PAGE',
      });
      const data = res?.data ?? res;
      const guestReference = data?.guestReference;
      navigate('/guest/verify-otp', {
        state: { guestReference, email: form.email.trim() },
      });
    } catch (err) {
      setError(guestErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = event ? (event.maxParticipants - (event.currentParticipants ?? 0)) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-50 mb-3">
            <User size={28} className="text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Đăng ký tham gia (Khách)</h1>
          <p className="text-sm text-gray-500 mt-1">Không cần tài khoản FPTU</p>
        </div>

        {/* Event info */}
        {eventLoading ? (
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse mb-6" />
        ) : event ? (
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6 text-sm">
            <p className="font-semibold text-gray-800">{event.eventName}</p>
            {event.startDate && (
              <p className="text-gray-500 mt-1">
                📅 {new Date(event.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {event.location && <>&nbsp;|&nbsp;📍 {event.location}</>}
              </p>
            )}
            {availableSlots !== null && availableSlots > 0 && (
              <p className="text-green-600 font-medium mt-1">Còn {availableSlots} chỗ trống</p>
            )}
            {availableSlots !== null && availableSlots <= 0 && (
              <p className="text-red-500 font-medium mt-1">Hết chỗ — bạn sẽ vào danh sách chờ</p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-700">
            Không tải được thông tin sự kiện.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="09xxxxxxxx"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? 'Đang gửi...' : <><span>Gửi mã xác thực OTP</span> <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Có tài khoản FPTU?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "#F37021" }}>
            Đăng nhập
          </Link>
        </p>
      </div>

      {/* Popup báo lỗi đăng ký */}
      {error && (
        <AlertModal
          type="error"
          title="Đăng ký thất bại"
          message={error}
          confirmLabel="Đóng"
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
}
