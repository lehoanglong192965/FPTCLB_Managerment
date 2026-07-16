import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import OTPInput from '../../components/ui/OTPInput';
import AlertModal from '../../components/ui/AlertModal';
import guestApi from '../../services/api/guest/guestApi';
import { maskEmail } from '../../utils/piiMask';
import { guestErrorMessage } from '../../utils/guestErrorMessages';

export default function GuestVerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // guestReference + email passed via navigate state from GuestRegisterPage
  const { guestReference, email } = location.state || {};
  const maskedEmail = email ? maskEmail(email) : '(email không xác định)';

  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);

  const isOtpFilled = otp.every(Boolean);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isOtpFilled || loading) return;
    setLoading(true);
    setError(null);
    try {
      await guestApi.verifyOtp(guestReference, { otp: otp.join('') });
      navigate(`/guest/status/${guestReference}`, { replace: true });
    } catch (err) {
      setError(guestErrorMessage(err, 'Mã OTP không đúng hoặc đã hết hạn.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || !guestReference) return;
    setResending(true);
    setResendMsg(null);
    setError(null);
    try {
      await guestApi.resendOtp(guestReference);
      setResendMsg('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
    } catch (err) {
      setResendMsg(guestErrorMessage(err, 'Không thể gửi lại. Thử lại sau ít phút.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
          <ShieldCheck size={28} className="text-blue-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Xác thực OTP</h1>
        <p className="text-sm text-gray-500 mb-6">
          Nhập mã 6 chữ số đã gửi đến <strong>{maskedEmail}</strong>
        </p>

        {resendMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2.5 mb-4 text-sm">
            {resendMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <OTPInput otp={otp} onChange={(v) => { setOtp(v); setError(null); }} disabled={loading} />

          <button
            type="submit"
            disabled={!isOtpFilled || loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Đang xác thực...' : 'Xác nhận'}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resending}
          className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
          {resending ? 'Đang gửi lại...' : 'Gửi lại mã'}
        </button>

        <p className="text-xs text-gray-400 mt-4">Mã OTP có hiệu lực trong 10 phút</p>
      </div>

      {/* Popup báo lỗi xác thực */}
      {error && (
        <AlertModal
          type="error"
          title="Xác thực thất bại"
          message={error}
          confirmLabel="Đóng"
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
}
