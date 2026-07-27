import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Calendar, MapPin, RefreshCw, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import guestApi from '../../services/api/guest/guestApi';
import { guestErrorMessage } from '../../utils/guestErrorMessages';
import { REFUND_BANKS } from '../../utils/refundBanks';
import { getRefundPolicyPreview } from '../../utils/refundPolicy';

const PAYMENT_BANK = {
  id: import.meta.env.VITE_PAYMENT_BANK_ID || 'MB',
  name: import.meta.env.VITE_PAYMENT_BANK_NAME || 'MB Bank',
  accountNumber: import.meta.env.VITE_PAYMENT_ACCOUNT_NUMBER || '0796578863',
  accountName: import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || 'LE HOANG LONG',
  branch: import.meta.env.VITE_PAYMENT_BANK_BRANCH || 'MB Bank',
};

const buildVietQrUrl = ({ amount, paymentReference }) => {
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(Number(amount) || 0))),
    addInfo: String(paymentReference || '').slice(0, 25),
    accountName: PAYMENT_BANK.accountName,
  });
  return `https://img.vietqr.io/image/${PAYMENT_BANK.id}-${PAYMENT_BANK.accountNumber}-compact2.png?${params.toString()}`;
};

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
  const [loadErrorStatus, setLoadErrorStatus] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentMethod] = useState('BANK_TRANSFER');
  const [cancelReason, setCancelReason] = useState('');
  const [refundBankCode, setRefundBankCode] = useState('');
  const [refundBankName, setRefundBankName] = useState('');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountHolder, setRefundAccountHolder] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [refundFormOpen, setRefundFormOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const res = await guestApi.getStatus(ref);
      setData(res?.data ?? res);
      setError(null);
      setLoadErrorStatus(null);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      if (!silent) {
        setLoadErrorStatus(err?.response?.status ?? null);
        setError(guestErrorMessage(err, 'Không thể tải thông tin đăng ký.'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [ref]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (!['PENDING', 'AWAITING_VERIFICATION'].includes(data?.paymentStatus)) return undefined;
    const timer = window.setInterval(() => fetchStatus(true), 5000);
    return () => window.clearInterval(timer);
  }, [data?.paymentStatus, fetchStatus]);

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
          <p className="text-gray-700 font-medium mb-1">
            {loadErrorStatus === 404 ? 'Không tìm thấy đăng ký' : 'Không thể tải đăng ký'}
          </p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => fetchStatus(false)}
            className="flex items-center gap-2 mx-auto text-sm text-orange-500 hover:underline"
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  const paymentPending = data.paymentStatus === 'PENDING';
  const awaitingPaymentVerification = data.paymentStatus === 'AWAITING_VERIFICATION';
  const refundPreview = getRefundPolicyPreview(
    data.eventStart ?? data.event?.startDate,
    Number(data.amountPaid) > 0 ? data.amountPaid : data.amountDue,
  );
  const refundDetailsRequired = ['PAID', 'AWAITING_VERIFICATION'].includes(data.paymentStatus)
    && refundPreview.rate > 0;

  const submitCancellation = async (payload) => {
    setCancelling(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const res = await guestApi.cancel(ref, payload);
      setData(res?.data ?? res);
      setRefundFormOpen(false);
      setActionNotice('Đăng ký đã được huỷ và slot đã được giải phóng.');
    } catch (err) {
      setActionError(guestErrorMessage(err, 'Không thể hủy đăng ký.'));
    } finally {
      setCancelling(false);
    }
  };

  const submitRefundRecipient = async (payload) => {
    setCancelling(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const res = await guestApi.updateRefundRecipient(ref, payload);
      setData(res?.data ?? res);
      setRefundFormOpen(false);
      setActionNotice('Đã lưu thông tin tài khoản nhận hoàn tiền.');
    } catch (err) {
      setActionError(guestErrorMessage(err, 'Không thể cập nhật tài khoản nhận hoàn tiền.'));
    } finally {
      setCancelling(false);
    }
  };
  const cfg = awaitingPaymentVerification ? {
    icon: <Clock size={40} className="text-blue-500" />,
    bg: 'bg-blue-50',
    title: 'Đang chờ xác minh chuyển khoản',
    desc: 'Ban tổ chức đang đối chiếu giao dịch. Vé chỉ được phát hành sau khi thanh toán được duyệt.',
    badge: 'Chờ leader xác minh',
    badgeColor: 'bg-blue-100 text-blue-700',
  } : paymentPending ? {
    icon: <Clock size={40} className="text-orange-500" />,
    bg: 'bg-orange-50',
    title: 'Đã giữ chỗ — Chờ thanh toán',
    desc: 'Vé chỉ có hiệu lực sau khi thanh toán thành công.',
    badge: 'Chờ thanh toán',
    badgeColor: 'bg-orange-100 text-orange-700',
  } : (STATUS_CONFIG[data.status] ?? STATUS_CONFIG.CONFIRMED);
  const ev = data.event ?? {
    eventName: data.eventName,
    startDate: data.eventStart,
    location: data.eventLocation,
  };
  const paymentDeadline = data.paymentExpiresAt ? new Date(data.paymentExpiresAt) : null;
  const remainingMs = paymentDeadline ? Math.max(0, paymentDeadline.getTime() - now) : 0;
  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
  const vietQrUrl = buildVietQrUrl({
    amount: data.amountDue,
    paymentReference: data.paymentReference,
  });

  const dateStr = ev.startDate
    ? new Date(ev.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ev.startDate;

  const handlePayment = async () => {
    if (paying) return;
    setPaying(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const response = await guestApi.confirmPayment(ref, {
        paymentMethod,
        transactionReference: data.paymentReference,
      });
      const updated = response?.data ?? response;
      setData(updated);
      setActionNotice(updated?.paymentStatus === 'PAID'
        ? 'Thanh toán đã được xác nhận. Vé của bạn đã được phát hành.'
        : 'Yêu cầu xác minh chuyển khoản đã được gửi.');
    } catch (err) {
      try {
        const latestResponse = await guestApi.getStatus(ref);
        const latest = latestResponse?.data ?? latestResponse;
        setData(latest);
        if (latest?.paymentStatus === 'AWAITING_VERIFICATION') {
          setActionNotice('Yêu cầu xác minh đã được gửi trước đó. Ban tổ chức đang đối chiếu giao dịch.');
        } else if (latest?.paymentStatus === 'PAID') {
          setActionNotice('Thanh toán đã được xác nhận. Vé của bạn đã được phát hành.');
        } else if (latest?.paymentStatus === 'EXPIRED' || latest?.status === 'CANCELLED') {
          setActionError('Đăng ký đã hết hạn hoặc bị huỷ, slot đã được giải phóng.');
        } else {
          setActionError(guestErrorMessage(err, 'Không thể xác nhận thanh toán vé.'));
        }
      } catch {
        setActionError(guestErrorMessage(err, 'Không thể xác nhận thanh toán vé.'));
      }
    } finally {
      setPaying(false);
    }
  };

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

        {actionNotice && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {actionNotice}
          </div>
        )}
        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {data.paymentStatus === 'PENDING' && (
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
            <p className="font-bold text-orange-800">Thanh toán vé khách</p>
            <div className="mt-2 rounded-lg border border-orange-200 bg-white px-3 py-2 text-orange-800">
              <p className="font-semibold">Chỗ của bạn đang được giữ tạm thời.</p>
              {paymentDeadline && (
                <p className="mt-1 text-xs">
                  Thanh toán trước {paymentDeadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}{remainingMs > 0 ? `còn ${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}` : 'đã hết thời gian giữ chỗ'}
                </p>
              )}
            </div>
            <p className="mt-1 text-lg font-bold text-orange-600">
              {Number(data.amountDue || 0).toLocaleString('vi-VN')} {data.paymentCurrency || 'VND'}
            </p>
            <p className="mt-1 break-all text-xs text-gray-600">Mã đối chiếu: {data.paymentReference}</p>
            <div className="mt-3 w-full rounded-lg border border-orange-200 bg-white p-2 font-medium text-gray-800">
              Chuyển khoản ngân hàng
            </div>
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="mt-3 space-y-2 rounded-lg border border-orange-200 bg-white p-3 text-center">
                <img
                  src={vietQrUrl}
                  alt={`Mã VietQR chuyển khoản đến ${PAYMENT_BANK.accountNumber}`}
                  className="mx-auto w-full max-w-[260px] rounded-lg"
                  loading="lazy"
                />
                <div className="text-left text-xs text-gray-700">
                  <p><span className="font-semibold">Ngân hàng:</span> {PAYMENT_BANK.name}</p>
                  <p><span className="font-semibold">Số tài khoản:</span> {PAYMENT_BANK.accountNumber}</p>
                  <p><span className="font-semibold">Chủ tài khoản:</span> {PAYMENT_BANK.accountName}</p>
                  <p><span className="font-semibold">Chi nhánh:</span> {PAYMENT_BANK.branch}</p>
                  <p className="break-all"><span className="font-semibold">Nội dung:</span> {data.paymentReference}</p>
                </div>
              </div>
            )}
            <button type="button" onClick={handlePayment} disabled={paying || remainingMs === 0} className="mt-3 w-full rounded-lg border-0 bg-orange-500 px-3 py-2 font-bold text-white disabled:opacity-50">
              {paying ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
            </button>
            <p className="mt-2 text-center text-xs text-orange-700">
              Bấm nút này không phát hành vé ngay. Ban tổ chức sẽ kiểm tra giao dịch trước khi xác nhận.
            </p>
          </div>
        )}

        {awaitingPaymentVerification && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-bold">Đã gửi yêu cầu xác minh thanh toán</p>
            <p className="mt-1">Chỗ của bạn tiếp tục được giữ trong khi ban tổ chức đối chiếu giao dịch.</p>
            <p className="mt-2 break-all text-xs">Mã đối chiếu: {data.paymentReference}</p>
            {data.paymentSubmittedAt && (
              <p className="mt-1 text-xs">
                Báo chuyển khoản lúc {new Date(data.paymentSubmittedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        )}

        {data.paymentStatus === 'FAILED' && data.paymentRejectionReason && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-bold">Thanh toán không được xác nhận</p>
            <p className="mt-1">Lý do: {data.paymentRejectionReason}</p>
          </div>
        )}

        {data.paymentStatus === 'REFUND_PENDING' && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-bold">Đang chờ hoàn tiền</p>
            <p className="mt-1">Vé và mã QR đã bị thu hồi. Ban tổ chức đang xử lý khoản hoàn của bạn.</p>
            <p className="mt-2 font-semibold">Tỷ lệ: {Number(data.refundRate || 0)}% · Số tiền: {Number(data.refundAmount || 0).toLocaleString('vi-VN')} {data.paymentCurrency || 'VND'}</p>
            <button
              type="button"
              onClick={() => { setActionError(null); setRefundFormOpen(true); }}
              className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Cung cấp / cập nhật tài khoản nhận hoàn
            </button>
          </div>
        )}

        {data.paymentStatus === 'REFUNDED' && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
            <p className="font-bold">{Number(data.refundAmount || 0) > 0 ? 'Đã hoàn tiền' : 'Đã áp dụng chính sách hoàn'}</p>
            <p className="mt-1">{Number(data.refundAmount || 0) > 0
              ? 'Khoản hoàn đã được ban tổ chức xác nhận. Vui lòng kiểm tra tài khoản nhận tiền và email.'
              : 'Tỷ lệ hoàn tại thời điểm hủy là 0%, vì vậy không phát sinh giao dịch chuyển tiền.'}</p>
            <p className="mt-2 font-semibold">Tỷ lệ: {Number(data.refundRate || 0)}% · Số tiền: {Number(data.refundAmount || 0).toLocaleString('vi-VN')} {data.paymentCurrency || 'VND'}</p>
            {data.refundTransactionReference && <p className="mt-1 text-xs">Mã giao dịch: {data.refundTransactionReference}</p>}
          </div>
        )}

        {data.ticketCode && data.status === 'CONFIRMED' && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
            <p className="mb-3 font-bold text-green-800">Vé QR của khách</p>
            <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm">
              <QRCode value={data.ticketCode} size={190} />
            </div>
            <p className="mt-3 break-all text-xs text-gray-600">{data.ticketCode}</p>
            <p className="mt-1 text-xs text-green-700">Xuất trình mã này khi check-in.</p>
          </div>
        )}

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

        {['CONFIRMED', 'WAITLISTED', 'PENDING_VERIFICATION'].includes(data.status) && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={paymentPending ? "Lý do hủy (không bắt buộc)..." : "Lý do không thể tham gia..."}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-red-400"
            />
            <button
              disabled={cancelling || (!paymentPending && !cancelReason.trim())}
              onClick={() => refundDetailsRequired
                ? setRefundFormOpen(true)
                : submitCancellation({ reason: cancelReason.trim() })}
              className="mt-2 w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? 'Đang xử lý...' : (refundDetailsRequired ? 'Tiếp tục hủy và nhận hoàn tiền' : (refundPreview.rate === 0 && data.paymentStatus === 'PAID' ? 'Hủy vé — không hoàn tiền' : (paymentPending ? 'Hủy và trả chỗ' : 'Hủy đăng ký')))}
            </button>
          </div>
        )}

        <Link
          to="/"
          onClick={(event) => {
            if (paymentPending) {
              event.preventDefault();
              setLeaveOpen(true);
            }
          }}
          className="block text-center mt-6 text-sm text-orange-500 hover:underline font-medium"
        >
          {paymentPending ? 'Thanh toán sau — về trang chủ' : 'Về trang chủ'}
        </Link>
      </div>

      {refundFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-4" onClick={(e) => e.target === e.currentTarget && setRefundFormOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-xl font-bold text-gray-900">Thông tin nhận hoàn tiền</h2>
              <button type="button" onClick={() => setRefundFormOpen(false)} className="text-gray-400 hover:text-gray-700" aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              Vé sẽ bị thu hồi sau khi xác nhận. Ban tổ chức sẽ dùng đúng thông tin dưới đây để chuyển khoản hoàn tiền.
              <p className="mt-2 font-semibold">{refundPreview.label}: hoàn {refundPreview.rate}% — {refundPreview.amount.toLocaleString('vi-VN')} {data.paymentCurrency || 'VND'}</p>
            </div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Ngân hàng nhận hoàn *</label>
            <select
              value={refundBankCode}
              onChange={(e) => {
                const bank = REFUND_BANKS.find((item) => item.code === e.target.value);
                setRefundBankCode(bank?.code || '');
                setRefundBankName(bank?.name || '');
              }}
              className="mb-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
            >
              <option value="">Chọn ngân hàng</option>
              {REFUND_BANKS.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
            </select>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Số tài khoản nhận hoàn *</label>
            <input value={refundAccountNumber} onChange={(e) => setRefundAccountNumber(e.target.value.replace(/\D/g, ''))} maxLength={19}
              placeholder="Chỉ nhập chữ số" className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400" />
            <label className="mb-1 block text-sm font-semibold text-gray-700">Tên chủ tài khoản *</label>
            <input value={refundAccountHolder} onChange={(e) => setRefundAccountHolder(e.target.value.toUpperCase())} maxLength={150}
              placeholder="NGUYEN VAN A" className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase outline-none focus:border-orange-400" />
            <p className="mb-5 text-xs leading-5 text-red-600">Không cung cấp mật khẩu, OTP, PIN hoặc thông tin đăng nhập ngân hàng.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRefundFormOpen(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700">Quay lại</button>
              <button
                type="button"
                disabled={cancelling || !refundBankCode || !/^\d{6,19}$/.test(refundAccountNumber) || !refundAccountHolder.trim()}
                onClick={() => {
                  const payload = {
                    reason: cancelReason.trim(), refundBankCode, refundBankName,
                    refundAccountNumber, refundAccountHolder: refundAccountHolder.trim(),
                  };
                  if (data.paymentStatus === 'REFUND_PENDING') submitRefundRecipient(payload);
                  else submitCancellation(payload);
                }}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {cancelling ? 'Đang xử lý...' : (data.paymentStatus === 'REFUND_PENDING' ? 'Lưu thông tin nhận hoàn' : 'Xác nhận hủy vé')}
              </button>
            </div>
          </div>
        </div>
      )}

      {leaveOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-4" onClick={(e) => e.target === e.currentTarget && setLeaveOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="m-0 text-lg font-bold text-gray-900">Thanh toán sau?</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Chỗ của bạn được giữ đến <strong>{paymentDeadline?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>. Liên kết tiếp tục thanh toán đã được gửi đến <strong>{data.emailMasked || data.email || 'email đăng ký'}</strong>.
            </p>
            <p className="mt-2 text-xs text-gray-500">Bạn cũng có thể dùng mã <strong>{data.registrationCode}</strong> tại trang Tra cứu đăng ký khách.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setLeaveOpen(false)} className="flex-1 rounded-xl border border-orange-200 bg-white py-2.5 text-sm font-semibold text-orange-600">Ở lại thanh toán</button>
              <button onClick={() => { window.location.href = '/'; }} className="flex-1 rounded-xl border-0 bg-orange-500 py-2.5 text-sm font-semibold text-white">Về trang chủ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
