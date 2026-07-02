import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Search, CheckCircle2, XCircle } from 'lucide-react';
import { MOCK_WALKIN_LOG } from '../../constants/mockData';

// TODO Sprint 5: thay MOCK_WALKIN_LOG bằng walkInService.getWalkInLog(eventId)

const TABS = [
  { id: 'fptu',  label: 'Sinh viên FPTU' },
  { id: 'guest', label: 'Khách vãng lai' },
];

export default function WalkInPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('fptu');
  const [studentId, setStudentId] = useState('');
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '' });
  const [result, setResult] = useState(null); // { success, message }
  const [log, setLog] = useState(MOCK_WALKIN_LOG);

  const handleFptuWalkIn = (e) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    // TODO Sprint 5: walkInService.registerFptu(eventId, studentId)
    setResult({ success: true, message: `Walk-in thành công: ${studentId}` });
    setLog((p) => [{ id: Date.now(), fullName: '–', studentId, type: 'FPTU', checkInAt: new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) }, ...p]);
    setStudentId('');
    setTimeout(() => setResult(null), 3000);
  };

  const handleGuestWalkIn = (e) => {
    e.preventDefault();
    // TODO Sprint 5: walkInService.registerGuest(eventId, guestForm) → gửi OTP
    setResult({ success: true, message: `Đã gửi OTP tới ${guestForm.email}` });
    setGuestForm({ name: '', email: '', phone: '' });
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate('/club-leader/events')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quản lý sự kiện
      </button>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <UserPlus size={22} className="text-green-600" /> Đăng Ký Walk-in
      </h1>
      <p className="text-sm text-gray-500 mb-6">Đăng ký tại chỗ cho người tham dự chưa đăng ký trước</p>

      {/* Result banner */}
      {result && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm font-medium ${
          result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {result.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {result.message}
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

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        {tab === 'fptu' ? (
          <form onSubmit={handleFptuWalkIn} className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Nhập MSSV (VD: SE150000)"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!studentId.trim()}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Check-in
            </button>
          </form>
        ) : (
          <form onSubmit={handleGuestWalkIn} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên *</label>
              <input
                type="text" required
                value={guestForm.name}
                onChange={(e) => setGuestForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input
                type="email" required
                value={guestForm.email}
                onChange={(e) => setGuestForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="example@gmail.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại *</label>
              <input
                type="tel" required
                value={guestForm.phone}
                onChange={(e) => setGuestForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="09xxxxxxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Gửi OTP & Check-in
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Log */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Walk-in hôm nay ({log.length})
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Tên</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">MSSV</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Loại</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Giờ vào</th>
            </tr>
          </thead>
          <tbody>
            {log.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2.5 font-medium text-gray-900">{r.fullName}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.studentId ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.type === 'FPTU' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>{r.type}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-500">{r.checkInAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
