import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import walkInApi from '../../services/api/attendance/walkInApi';
import attendanceApi from '../../services/api/attendance/attendanceApi';
import { useToast } from '../../contexts/ToastContext';

const TABS = [
  { id: 'fptu',  label: 'Sinh viên FPTU' },
  { id: 'guest', label: 'Khách vãng lai'  },
];

export default function WalkInPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('fptu');
  const [sessionId, setSessionId] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  // FPTU walk-in state
  const [studentIdOrEmail, setStudentIdOrEmail] = useState('');
  const [fptuLoading, setFptuLoading] = useState(false);

  // Guest walk-in state
  const [guestForm, setGuestForm] = useState({ fullName: '', email: '', phone: '' });
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    attendanceApi.getSessions(eventId)
      .then((sessions) => {
        const open = sessions.find((s) => s.status === 'OPEN');
        if (open) {
          setSessionId(open.sessionId ?? open.id);
        } else {
          setSessionError('Không có phiên điểm danh đang mở. Vui lòng mở phiên trong trang điểm danh trước.');
        }
      })
      .catch(() => setSessionError('Không thể tải thông tin phiên điểm danh.'));
  }, [eventId]);

  const handleFptuWalkIn = async (e) => {
    e.preventDefault();
    if (!studentIdOrEmail.trim() || fptuLoading || !sessionId) return;
    setFptuLoading(true);
    try {
      await walkInApi.registerFptuWalkIn(sessionId, { studentIdOrEmail: studentIdOrEmail.trim() });
      toast.success('Đăng ký tại chỗ thành công!');
      setStudentIdOrEmail('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng ký tại chỗ thất bại.');
    } finally {
      setFptuLoading(false);
    }
  };

  const handleGuestWalkIn = async (e) => {
    e.preventDefault();
    if (guestLoading || !sessionId) return;
    setGuestLoading(true);
    try {
      await walkInApi.registerGuestWalkIn(sessionId, {
        fullName: guestForm.fullName.trim(),
        email:    guestForm.email.trim(),
        phone:    guestForm.phone.trim(),
        consent:  true,
        discoverySource: 'WALK_IN',
      });
      toast.success('Đăng ký tại chỗ cho khách thành công!');
      setGuestForm({ fullName: '', email: '', phone: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng ký tại chỗ cho khách thất bại.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <UserPlus size={22} className="text-green-600" /> Đăng Ký Tại Chỗ
      </h1>
      <p className="text-sm text-gray-500 mb-6">Đăng ký tại chỗ cho người tham dự chưa đăng ký trước</p>

      {sessionError && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 text-sm text-yellow-700">
          <AlertCircle size={16} className="shrink-0" />
          {sessionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {tab === 'fptu' ? (
          <form onSubmit={handleFptuWalkIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MSSV hoặc Email FPTU *</label>
              <input
                type="text"
                value={studentIdOrEmail}
                onChange={(e) => setStudentIdOrEmail(e.target.value)}
                placeholder="VD: SE150000 hoặc se@fpt.edu.vn"
                required
                disabled={!sessionId}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!studentIdOrEmail.trim() || fptuLoading || !sessionId}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {fptuLoading ? 'Đang xử lý...' : 'Đăng ký tại chỗ'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGuestWalkIn} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên *</label>
              <input
                type="text" required
                value={guestForm.fullName}
                onChange={(e) => setGuestForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nguyễn Văn A"
                disabled={!sessionId}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input
                type="email" required
                value={guestForm.email}
                onChange={(e) => setGuestForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="example@gmail.com"
                disabled={!sessionId}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại *</label>
              <input
                type="tel" required
                value={guestForm.phone}
                onChange={(e) => setGuestForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="09xxxxxxxx"
                disabled={!sessionId}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={guestLoading || !sessionId}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {guestLoading ? 'Đang xử lý...' : 'Đăng ký tại chỗ cho khách'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
