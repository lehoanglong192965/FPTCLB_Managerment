import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck } from 'lucide-react';
import OTPInput from '../../components/ui/OTPInput';
import guestApi from '../../services/api/guest/guestApi';
import { guestErrorMessage } from '../../utils/guestErrorMessages';

export default function GuestLookupPage() {
  const navigate = useNavigate();
  const [registrationCode, setRegistrationCode] = useState('');
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const requestOtp = async (event) => {
    event.preventDefault();
    if (!registrationCode.trim() || !email.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const response = await guestApi.requestRecovery({ registrationCode: registrationCode.trim(), email: email.trim() });
      const result = response?.data ?? response;
      setChallenge(result.challenge);
      setMaskedEmail(result.emailMasked || email);
    } catch (err) {
      setError(guestErrorMessage(err, 'Không tìm thấy đăng ký hoặc chưa thể gửi OTP.'));
    } finally { setBusy(false); }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (!otp.every(Boolean) || busy) return;
    setBusy(true); setError('');
    try {
      const response = await guestApi.verifyRecovery(challenge, otp.join(''));
      const result = response?.data ?? response;
      navigate(`/guest/status/${result.guestReference}`, { replace: true });
    } catch (err) {
      setError(guestErrorMessage(err, 'OTP không đúng hoặc đã hết hạn.'));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            {challenge ? <ShieldCheck size={24} /> : <Search size={24} />}
          </div>
          <h1 className="m-0 text-xl font-bold text-gray-900">Tra cứu đăng ký khách</h1>
          <p className="mt-2 text-sm text-gray-500">{challenge ? `Nhập OTP đã gửi đến ${maskedEmail}` : 'Nhập mã đăng ký và email đã sử dụng.'}</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {!challenge ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <input value={registrationCode} onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())} placeholder="Mã đăng ký, ví dụ GUEST-A3F82C19" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email đăng ký" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400" />
            <button disabled={busy || !registrationCode.trim() || !email.trim()} className="w-full rounded-xl border-0 bg-orange-500 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Đang gửi...' : 'Gửi mã OTP'}</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-5">
            <OTPInput otp={otp} onChange={setOtp} disabled={busy} />
            <button disabled={busy || !otp.every(Boolean)} className="w-full rounded-xl border-0 bg-orange-500 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Đang xác thực...' : 'Tiếp tục đăng ký'}</button>
            <button type="button" onClick={() => { setChallenge(null); setOtp(Array(6).fill('')); setError(''); }} className="w-full border-0 bg-transparent text-sm text-gray-500">Nhập lại thông tin</button>
          </form>
        )}
      </div>
    </div>
  );
}
