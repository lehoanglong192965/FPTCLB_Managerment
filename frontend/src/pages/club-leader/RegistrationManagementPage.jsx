import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, CheckCircle2, XCircle, Trash2, X, Download } from 'lucide-react';
import eventApi from '../../services/api/events/eventApi';
import { buildEventCsvFileName, downloadCsvFile, getDownloadErrorMessage } from '../../utils/csvDownload';
import { useToast } from '../../contexts/ToastContext';
import { buildRefundVietQrUrl } from '../../utils/refundBanks';

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

const PAYMENT_STATUS_CFG = {
  PENDING: { label: 'Chưa chuyển khoản', color: 'text-orange-700', bg: 'bg-orange-100' },
  AWAITING_VERIFICATION: { label: 'Chờ xác minh CK', color: 'text-blue-700', bg: 'bg-blue-100' },
  PAID: { label: 'Đã thanh toán', color: 'text-green-700', bg: 'bg-green-100' },
  FAILED: { label: 'Thanh toán bị từ chối', color: 'text-red-700', bg: 'bg-red-100' },
  EXPIRED: { label: 'Hết hạn thanh toán', color: 'text-gray-600', bg: 'bg-gray-100' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', color: 'text-amber-700', bg: 'bg-amber-100' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-teal-700', bg: 'bg-teal-100' },
};

const TABS = [
  { id: '',          label: 'Tất cả'    },
  { id: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { id: 'PAYMENT_VERIFICATION', label: 'Chờ xác minh CK' },
  { id: 'REFUND_PENDING', label: 'Chờ hoàn tiền' },
  { id: 'CONFIRMED', label: 'Đã duyệt'  },
  { id: 'REJECTED',  label: 'Từ chối'   },
];

/** Modal nhập lý do dùng chung cho từ chối đăng ký / từ chối thanh toán / huỷ vé. */
function ReasonModal({ title, description, placeholder, confirmLabel, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef(null);
  const trimmed = reason.trim();

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <textarea
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={500}
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
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed}
            className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function RefundModal({ registration, onConfirm, onClose }) {
  const [transactionReference, setTransactionReference] = useState('');
  const [note, setNote] = useState('');
  const amount = registration.refundAmount ?? registration.amountDue ?? 0;
  const originalAmount = Number(registration.amountPaid) > 0 ? registration.amountPaid : registration.amountDue;
  const hasRecipientDetails = Boolean(
    registration.refundBankName
    && /^\d{6,30}$/.test(registration.refundAccountNumber || '')
    && registration.refundAccountHolder
  );
  const qrUrl = buildRefundVietQrUrl({
    bankCode: registration.refundBankCode,
    bankName: registration.refundBankName,
    accountNumber: registration.refundAccountNumber,
    accountName: registration.refundAccountHolder,
    amount,
    reference: `HOAN VE ${registration.paymentReference || registration.registrationId || registration.guestRegistrationId || ''}`,
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Xác nhận đã hoàn tiền</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Người nhận: <strong>{registration.fullName || registration.name}</strong><br />
          Tiền vé đã trả: <strong>{Number(originalAmount || 0).toLocaleString('vi-VN')} {registration.paymentCurrency || 'VND'}</strong><br />
          Tỷ lệ hoàn: <strong>{Number(registration.refundRate ?? 100)}%</strong><br />
          Cần hoàn: <strong className="text-orange-600">{Number(amount).toLocaleString('vi-VN')} {registration.paymentCurrency || 'VND'}</strong>
        </p>
        {registration.refundCalculationNote && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Cách tính: {registration.refundCalculationNote}
          </div>
        )}
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
          Đối chiếu thông tin khách đã cung cấp, quét QR bằng ứng dụng ngân hàng rồi nhập mã giao dịch. Chỉ xác nhận sau khi chuyển đúng người nhận và đúng số tiền.
        </div>
        {hasRecipientDetails ? (
          <div className="mb-5 grid gap-5 md:grid-cols-[1fr_220px]">
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-gray-500">Thông tin khách cung cấp</p>
              <div><span className="block text-gray-500">Ngân hàng</span><strong className="text-gray-900">{registration.refundBankName}</strong></div>
              <div><span className="block text-gray-500">Số tài khoản</span><strong className="font-mono text-base text-gray-900">{registration.refundAccountNumber}</strong></div>
              <div><span className="block text-gray-500">Chủ tài khoản</span><strong className="uppercase text-gray-900">{registration.refundAccountHolder}</strong></div>
              <div><span className="block text-gray-500">Số tiền hoàn</span><strong className="text-orange-600">{Number(amount).toLocaleString('vi-VN')} {registration.paymentCurrency || 'VND'}</strong></div>
              <div><span className="block text-gray-500">Tỷ lệ chính sách</span><strong className="text-gray-900">{Number(registration.refundRate ?? 100)}%</strong></div>
            </div>
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-center">
              {qrUrl ? (
                <div>
                  <img src={qrUrl} alt="VietQR hoàn tiền" className="mx-auto h-[200px] w-[200px] object-contain" />
                  <p className="mt-1 text-xs text-gray-500">Quét để chuyển đúng số tiền</p>
                </div>
              ) : (
                <p className="px-3 text-sm text-red-600">Chưa tạo được QR vì ngân hàng không nằm trong danh sách VietQR hỗ trợ.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Khách chưa cung cấp đủ thông tin nhận hoàn tiền. Chưa thể xử lý khoản hoàn này.
          </div>
        )}
        <label className="block text-sm font-medium text-gray-700 mb-1">Mã giao dịch ngân hàng *</label>
        <input value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} maxLength={100}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" placeholder="VD: FT261234567890" />
        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Thông tin đối soát bổ sung..." />
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Hủy</button>
          <button disabled={!hasRecipientDetails || !transactionReference.trim()}
            onClick={() => onConfirm({ transactionReference: transactionReference.trim(), note: note.trim() || null })}
            className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg font-medium disabled:opacity-50">Xác nhận đã chuyển</button>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationManagementPage({ eventId: eventIdProp, embedded = false, maxParticipants } = {}) {
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
  const [exportLoading, setExportLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // { id, name }
  const [paymentRejectTarget, setPaymentRejectTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);

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

  const handleCancelConfirm = async (reason) => {
    const reg = cancelTarget;
    setCancelTarget(null);
    if (!reg || !reason) return;
    const isGuest = reg.type === 'GUEST';
    const loadingKey = isGuest
      ? 'guest-' + (reg.guestRegistrationId ?? reg.registrationId)
      : 'fptu-' + (reg.registrationId ?? reg.id);
    setActionLoading(loadingKey);
    try {
      if (isGuest) {
        await eventApi.cancelGuestRegistration(eventId, reg.guestRegistrationId ?? reg.registrationId, reason);
      } else {
        await eventApi.cancelRegistration(reg.registrationId ?? reg.id, reason);
      }
      toast.success('Đã huỷ đăng ký.');
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Huỷ thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovePayment = async (reg) => {
    const isGuest = reg.type === 'GUEST';
    const registrationId = isGuest ? (reg.guestRegistrationId ?? reg.registrationId) : (reg.registrationId ?? reg.id);
    const loadingKey = `${isGuest ? 'guest' : 'fptu'}-${registrationId}`;
    setActionLoading(loadingKey);
    try {
      if (isGuest) await eventApi.approveGuestPayment(eventId, registrationId);
      else await eventApi.approveMemberPayment(eventId, registrationId);
      toast.success(`Đã xác nhận thanh toán của ${reg.fullName || reg.name}`);
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xác nhận thanh toán.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async (reason) => {
    const target = paymentRejectTarget;
    setPaymentRejectTarget(null);
    if (!target || !reason) {
      toast.error('Vui lòng nhập lý do từ chối thanh toán.');
      return;
    }
    const loadingKey = `${target.isGuest ? 'guest' : 'fptu'}-${target.id}`;
    setActionLoading(loadingKey);
    try {
      if (target.isGuest) await eventApi.rejectGuestPayment(eventId, target.id, reason);
      else await eventApi.rejectMemberPayment(eventId, target.id, reason);
      toast.success(`Đã từ chối thanh toán của ${target.name}`);
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể từ chối thanh toán.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkRefunded = async (payload) => {
    const reg = refundTarget;
    if (!reg) return;
    const isGuest = reg.type === 'GUEST';
    const registrationId = isGuest ? (reg.guestRegistrationId ?? reg.registrationId) : (reg.registrationId ?? reg.id);
    setRefundTarget(null);
    const loadingKey = `${isGuest ? 'guest' : 'fptu'}-${registrationId}`;
    setActionLoading(loadingKey);
    try {
      if (isGuest) await eventApi.markGuestRefunded(eventId, registrationId, payload);
      else await eventApi.markMemberRefunded(eventId, registrationId, payload);
      toast.success('Đã ghi nhận hoàn tiền thành công.');
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể ghi nhận hoàn tiền.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async (exportType) => {
    if (!eventId || exportLoading) return;

    const isAttendance = exportType === 'attendance';
    setExportLoading(exportType);
    try {
      const csvData = isAttendance
        ? await eventApi.exportAttendance(eventId)
        : await eventApi.exportRegistrations(eventId);
      downloadCsvFile(csvData, buildEventCsvFileName(eventId, exportType));
      toast.success(isAttendance
        ? '\u0110\u00e3 t\u1ea3i CSV \u0111i\u1ec3m danh.'
        : '\u0110\u00e3 t\u1ea3i CSV \u0111\u0103ng k\u00fd.');
    } catch (err) {
      toast.error(await getDownloadErrorMessage(
        err,
        isAttendance
          ? 'Kh\u00f4ng th\u1ec3 xu\u1ea5t CSV \u0111i\u1ec3m danh.'
          : 'Kh\u00f4ng th\u1ec3 xu\u1ea5t CSV \u0111\u0103ng k\u00fd.',
      ));
    } finally {
      setExportLoading(null);
    }
  };

  const filtered = registrations.filter((r) => {
    if (tab) {
      const matchTab = tab === 'PENDING_APPROVAL'
        ? isPendingApproval(r.status)
        : tab === 'PAYMENT_VERIFICATION'
          ? r.paymentStatus === 'AWAITING_VERIFICATION'
          : tab === 'REFUND_PENDING'
            ? r.paymentStatus === 'REFUND_PENDING'
          : r.status === tab;
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
    PAYMENT_VERIFICATION: registrations.filter((r) => r.paymentStatus === 'AWAITING_VERIFICATION').length,
    REFUND_PENDING: registrations.filter((r) => r.paymentStatus === 'REFUND_PENDING').length,
    // Vé Ban tổ chức là vé miễn phí và không chiếm quota người tham gia.
    CONFIRMED: registrations.filter((r) => r.status === 'CONFIRMED' && !r.capacityExempt).length,
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
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleExport('registrations')}
            disabled={Boolean(exportLoading) || !eventId}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} />
            {exportLoading === 'registrations'
              ? '\u0110ang xu\u1ea5t...'
              : 'Xu\u1ea5t CSV \u0111\u0103ng k\u00fd'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('attendance')}
            disabled={Boolean(exportLoading) || !eventId}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} />
            {exportLoading === 'attendance'
              ? '\u0110ang xu\u1ea5t...'
              : 'Xu\u1ea5t CSV \u0111i\u1ec3m danh'}
          </button>
        </div>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Thanh toán</th>
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
                const paymentCfg = PAYMENT_STATUS_CFG[r.paymentStatus];
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
                      {paymentCfg ? (
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentCfg.bg} ${paymentCfg.color}`}>
                            {paymentCfg.label}
                          </span>
                          {r.paymentReference && <p className="mt-1 text-[11px] text-gray-500">{r.paymentReference}</p>}
                          {r.amountDue != null && <p className="text-[11px] text-gray-500">{Number(r.amountDue).toLocaleString('vi-VN')} {r.paymentCurrency || 'VND'}</p>}
                          {r.refundTransactionReference && <p className="text-[11px] text-teal-700">Mã hoàn: {r.refundTransactionReference}</p>}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
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
                        {r.paymentStatus === 'AWAITING_VERIFICATION' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(r)}
                              disabled={isLoading}
                              title="Xác nhận đã nhận chuyển khoản"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => setPaymentRejectTarget({
                                id: isGuest ? (r.guestRegistrationId ?? r.registrationId) : (r.registrationId ?? r.id),
                                name: r.fullName || r.name,
                                isGuest,
                              })}
                              disabled={isLoading}
                              title="Từ chối thanh toán"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {r.paymentStatus === 'REFUND_PENDING' && (
                          <button
                            onClick={() => setRefundTarget(r)}
                            disabled={isLoading}
                            title="Xác nhận đã hoàn tiền"
                            className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
            Xử lý hoàn
                          </button>
                        )}
                        {(isGuest
                          ? r.status !== 'CANCELLED' && r.status !== 'REJECTED'
                          : (r.status === 'CONFIRMED' || isPendingApproval(r.status))) && (
                          <button
                            onClick={() => setCancelTarget(r)}
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
        <ReasonModal
          title="Từ chối đăng ký"
          description={<>Từ chối đăng ký của <strong>{rejectTarget.name}</strong>?</>}
          placeholder="Lý do từ chối..."
          confirmLabel="Xác nhận từ chối"
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
        />
      )}
      {paymentRejectTarget && (
        <ReasonModal
          title="Từ chối thanh toán"
          description={<>Không xác nhận chuyển khoản của <strong>{paymentRejectTarget.name}</strong>?</>}
          placeholder="Lý do không xác nhận thanh toán..."
          confirmLabel="Từ chối thanh toán"
          onConfirm={handleRejectPayment}
          onClose={() => setPaymentRejectTarget(null)}
        />
      )}
      {cancelTarget && (
        <ReasonModal
          title="Huỷ vé tham gia"
          description={<>Huỷ vé của <strong>{cancelTarget.fullName || cancelTarget.name || 'người tham gia'}</strong>?</>}
          placeholder="Lý do huỷ vé..."
          confirmLabel="Xác nhận huỷ vé"
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {refundTarget && (
        <RefundModal registration={refundTarget} onConfirm={handleMarkRefunded} onClose={() => setRefundTarget(null)} />
      )}
    </div>
  );
}
