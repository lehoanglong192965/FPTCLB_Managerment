import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';

// Mock event data — thay bằng API call trong Sprint 4
const MOCK_EVENT = {
  eventId: 1,
  eventName: 'Hackathon FPT 2026 – Build The Future',
  clubName: 'FPT Coder',
  startDate: '15/08/2026',
  location: 'Hội trường A – ĐH FPT Hà Nội',
  availableSlots: 12,
};

export default function GuestRegisterPage() {
  const { eventId } = useParams();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO Sprint 4: gọi guestService.register(eventId, form) → navigate('/guest/verify-otp')
    alert('[Sprint 4] Sẽ gửi OTP tới: ' + form.email);
  };

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
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6 text-sm">
          <p className="font-semibold text-gray-800">{MOCK_EVENT.eventName}</p>
          <p className="text-gray-500 mt-1">📅 {MOCK_EVENT.startDate} &nbsp;|&nbsp; 📍 {MOCK_EVENT.location}</p>
          <p className="text-green-600 font-medium mt-1">Còn {MOCK_EVENT.availableSlots} chỗ trống</p>
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (không phải @fpt.edu.vn) *</label>
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
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Gửi mã xác thực OTP <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Có tài khoản FPTU?{' '}
          <Link to="/login" className="text-orange-500 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
