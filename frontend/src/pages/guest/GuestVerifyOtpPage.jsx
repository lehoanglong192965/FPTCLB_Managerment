import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import OTPInput from '../../components/ui/OTPInput';

export default function GuestVerifyOtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  // Email lấy từ state navigation — mock ở đây
  const maskedEmail = 'exa***@gmail.com';

  const handleVerify = (e) => {
    e.preventDefault();
    if (otp.length < 6) return;
    // TODO Sprint 4: gọi guestService.verifyOtp(otp) → navigate('/guest/status/:ref')
    navigate('/guest/status/mock-ref-001');
  };

  const handleResend = () => {
    setResending(true);
    // TODO Sprint 4: gọi guestService.resendOtp()
    setTimeout(() => setResending(false), 2000);
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

        <form onSubmit={handleVerify} className="space-y-5">
          <OTPInput length={6} value={otp} onChange={setOtp} />

          <button
            type="submit"
            disabled={otp.length < 6}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Xác nhận
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
    </div>
  );
}
