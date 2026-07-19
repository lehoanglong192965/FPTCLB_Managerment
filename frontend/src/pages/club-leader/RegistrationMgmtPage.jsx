import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, CheckCircle2, XCircle, Trash2, X } from 'lucide-react';
import eventApi from '../../services/api/events/eventApi';
import { useToast } from '../../contexts/ToastContext';

const STATUS_CFG = {
  PENDING:   { label: 'Chờ duyệt',  color: 'text-yellow-700', bg: 'bg-yellow-100' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  PENDING_VERIFICATION: { label: 'Chờ OTP', color: 'text-orange-700', bg: 'bg-orange-100' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-green-700',  bg: 'bg-green-100'  },
  REJECTED:  { label: 'Từ chối',    color: 'text-red-700',    bg: 'bg-red-100'    },
  CANCELLED: { label: 'Đã hủy',     color: 'text-gray-600',   bg: 'bg-gray-100'   },
  WAITLISTED:{ label: 'Danh sách chờ', color: 'text-blue-700', bg: 'bg-blue-100'  },
};

const isPendingApproval = (status) => status === 'PENDING_APPROVAL' || status === 'PENDING';

const TABS = [
  { id: '',          label: 'Tất cả'    },
  { id: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { id: 'CONFIRMED', label: 'Đã duyệt'  },
  { id: 'REJECTED',  label: 'Từ chối'   },
];

function RejectModal({ name, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Từ chối đăng ký</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Từ chối đăng ký của <strong>{name}</strong>?
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do từ chối (tuỳ chọn)..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationMgmtPage({ eventId: eventIdProp, embedded = false, maxParticipants } = {}) {
  const { eventId: eventIdParam } = useParams();
  const eventId = eventIdProp ?? eventIdParam;
  const navigate = useNavigate();
  const toast = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // registrationId
  const [rejectTarget, setRejectTarget] = useState(null); // { id, name }

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventApi.listRegistrations(eventId, {});
      const raw = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
      const data = raw.map((r) => ({
        ...r,
        registrationId: r.registrationID ?? r.registrationId ?? r.id,
        guestRegistrationId: r.guestRegistrationID ?? r.guestRegistrationId,
        fullName:       r.fullName || r.guestFullName,
        email:          r.email    || r.guestEmail,
        type:           r.participantType ?? r.type,
      }));
      setRegistrations(data);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
        setLoading(false);
        return;
      }
      setError(err?.response?.data?.message || 'Không thể tải danh sách đăng ký.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleApprove = async (reg) => {
    setActionLoading(reg.registrationId ?? reg.id);
    try {
      await eventApi.approveRegistration(eventId, reg.registrationId ?? reg.id);
      toast.success(`Đã duyệt đăng ký của ${reg.fullName || reg.name}`);
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Duyệt thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    const { id, name } = rejectTarget;
    setRejectTarget(null);
    setActionLoading(id);
    try {
      await eventApi.rejectRegistration(eventId, id, reason);
      toast.success(`Đã từ chối đăng ký của ${name}`);
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Từ chối thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (reg) => {
    const isGuest = reg.type === 'GUEST';
    const loadingKey = isGuest
      ? 'guest-' + (reg.guestRegistrationId ?? reg.registrationId)
      : 'fptu-' + (reg.registrationId ?? reg.id);
    setActionLoading(loadingKey);
    try {
      if (isGuest) {
        await eventApi.cancelGuestRegistration(eventId, reg.guestRegistrationId ?? reg.registrationId);
      } else {
        await eventApi.cancelRegistration(reg.registrationId ?? reg.id);
      }
      toast.success('Đã huỷ đăng ký.');
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Huỷ thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = registrations.filter((r) => {
    if (tab) {
      const matchTab = tab === 'PENDING_APPROVAL' ? isPendingApproval(r.status) : r.status === tab;
      if (!matchTab) return false;
    }
    const q = search.toLowerCase();
    return (
      (r.fullName || r.name || '').toLowerCase().includes(q) ||
      (r.studentId || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.guestPhone || '').toLowerCase().includes(q)
    );
  });

  const counts = {
    '': registrations.length,
    PENDING_APPROVAL: registrations.filter((r) => isPendingApproval(r.status)).length,
    CONFIRMED: registrations.filter((r) => r.status === 'CONFIRMED').length,
    REJECTED:  registrations.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className={embedded ? "" : "p-6 max-w-5xl mx-auto"}>
      {/* Header */}
      {!embedded && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      )}
      <div className="flex items-center justify-between mb-6">
        {embedded ? (
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 m-0">
              <Users size={16} className="text-blue-600" /> Danh sách đăng ký
            </p>
            {typeof maxParticipants === 'number' && maxParticipants > 0 && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                counts.CONFIRMED >= maxParticipants ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {counts.CONFIRMED}/{maxParticipants} đã đăng ký
              </span>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users size={22} className="text-blue-600" /> Quản lý đăng ký
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              Duyệt và quản lý danh sách đăng ký tham gia sự kiện
              {typeof maxParticipants === 'number' && maxParticipants > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  counts.CONFIRMED >= maxParticipants ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {counts.CONFIRMED}/{maxParticipants}
                </span>
              )}
            </p>
          </div>
        )}
        <button
          onClick={fetchRegistrations}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-gray-200 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 ${
              tab === t.id ? 'text-[#e6430a] border-[#e6430a] font-semibold' : 'text-gray-500 border-transparent hover:text-[#e6430a]'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${
                tab === t.id ? 'bg-[#e6430a]' : 'bg-gray-500'
              }`}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, MSSV, email..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Không có đăng ký nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Họ tên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">MSSV</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const isGuest = r.type === 'GUEST';
                const regId = isGuest
                  ? 'guest-' + (r.guestRegistrationId ?? r.registrationId ?? idx)
                  : 'fptu-' + (r.registrationId ?? r.id ?? idx);
                const cfg = STATUS_CFG[r.status] ?? { label: r.status, color: 'text-gray-600', bg: 'bg-gray-100' };
                const isLoading = actionLoading === regId;
                return (
                  <tr key={regId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.fullName || r.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.studentId || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.type === 'GUEST' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>{r.type === 'GUEST' ? 'Khách' : 'FPTU'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!isGuest && isPendingApproval(r.status) && (
                          <>
                            <button
                              onClick={() => handleApprove(r)}
                              disabled={isLoading}
                              title="Duyệt"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => setRejectTarget({ id: r.registrationId ?? r.id, name: r.fullName || r.name })}
                              disabled={isLoading}
                              title="Từ chối"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {(isGuest
                          ? r.status !== 'CANCELLED' && r.status !== 'REJECTED'
                          : (r.status === 'CONFIRMED' || isPendingApproval(r.status))) && (
                          <button
                            onClick={() => handleCancel(r)}
                            disabled={isLoading}
                            title="Huỷ đăng ký"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        {isLoading && (
                          <span className="text-xs text-gray-400">...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          name={rejectTarget.name}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
