import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import walkInApi from '../../services/api/attendance/walkInApi';
import attendanceApi from '../../services/api/attendance/attendanceApi';
import eventApi from '../../services/api/events/eventApi';
import { useToast } from '../../contexts/ToastContext';

export default function IcpdpEmergencyOverridePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [sessionError, setSessionError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // name of overridden person

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    reason: '',
    note: '',
  });

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [evRes, sessRes] = await Promise.allSettled([
          eventApi.getEventByIdForIcpdp(eventId),
          attendanceApi.getSessions(eventId),
        ]);
        if (evRes.status === 'fulfilled') setEvent(evRes.value?.data ?? evRes.value);
        if (sessRes.status === 'fulfilled') {
          const sessions = sessRes.value;
          const open = sessions.find((s) => s.status === 'OPEN');
          if (open) {
            setSessionId(open.sessionId ?? open.id);
            setSessionName(open.sessionName ?? open.name ?? '');
          } else {
            setSessionError(
              sessions.length === 0
                ? 'Sự kiện này chưa có phiên điểm danh nào.'
                : 'Không có phiên điểm danh đang mở. Yêu cầu Leader mở phiên trước.'
            );
          }
        }
      } catch {
        setSessionError('Không thể tải thông tin sự kiện.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      toast.error('Lý do ghi đè là bắt buộc.');
      return;
    }
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await walkInApi.emergencyOverride(sessionId, {
        fullName:        form.fullName.trim(),
        email:           form.email.trim(),
        phone:           form.phone.trim(),
        reason:          form.reason.trim(),
        note:            form.note.trim() || undefined,
        consent:         true,
        discoverySource: 'EMERGENCY_OVERRIDE',
      });
      const name = form.fullName.trim();
      toast.success(`Ghi đè thành công: ${name}`);
      setSuccess(name);
      setForm({ fullName: '', email: '', phone: '', reason: '', note: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Ghi đè thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <ShieldAlert size={20} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Điểm Danh Ghi Đè Khẩn Cấp</h1>
          <p className="text-sm text-gray-500">
            Bỏ qua giới hạn sức chứa — chỉ dùng trong trường hợp khẩn cấp
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 mt-10 text-center">Đang tải...</p>
      ) : (
        <div className="mt-6 max-w-xl">
          {/* Event info */}
          {event && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm">
              <p className="font-semibold text-gray-800">{event.eventName}</p>
              {sessionId ? (
                <p className="text-green-600 mt-1 font-medium">
                  ✓ Phiên đang mở{sessionName ? `: ${sessionName}` : ''}
                </p>
              ) : (
                <p className="text-red-500 mt-1">Không có phiên mở</p>
              )}
            </div>
          )}

          {/* Session error */}
          {sessionError && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm text-yellow-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {sessionError}
            </div>
          )}

          {/* Warning banner */}
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>
              Ghi đè sẽ bỏ qua mọi kiểm tra sức chứa và tự động điểm danh ngay lập tức.
              Hành động này được ghi lại trong audit log.
            </span>
          </div>

          {/* Success banner */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-700">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Check-in thành công: <strong>{success}</strong></span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  disabled={!sessionId || submitting}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  disabled={!sessionId || submitting}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="09xxxxxxxx"
                  disabled={!sessionId || submitting}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do ghi đè <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                rows={3}
                required
                value={form.reason}
                onChange={handleChange}
                placeholder="Ví dụ: Khách mời đặc biệt của BGH, VIP speaker, sự cố kỹ thuật đăng ký trước..."
                disabled={!sessionId || submitting}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú thêm <span className="text-gray-400">(tuỳ chọn)</span>
              </label>
              <input
                name="note"
                type="text"
                value={form.note}
                onChange={handleChange}
                placeholder="Thông tin bổ sung nếu cần..."
                disabled={!sessionId || submitting}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!sessionId || submitting || !form.reason.trim()}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <ShieldAlert size={15} />
                {submitting ? 'Đang xử lý...' : 'Xác nhận Ghi Đè'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
