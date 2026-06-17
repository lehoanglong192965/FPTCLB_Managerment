import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OTPInput from "../../components/ui/OTPInput";
import authService from "../../services/api/auth/authService";

const RESEND_SECONDS = 60;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [email, setEmail] = useState(() => {
    return state?.email || localStorage.getItem("pending_verify_email") || "";
  });
  const [isEditingEmail, setIsEditingEmail] = useState(!email);

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isFilled = otp.every(Boolean) && email.trim() !== "";

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!isFilled || loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await authService.verifyOTP(email, otp.join(""));
      localStorage.removeItem("pending_verify_email");
      setSuccess("Xác thực thành công! Đang chuyển hướng đăng nhập...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      const msg = err?.response?.data?.error ?? "Xác thực OTP thất bại. Vui lòng thử lại!";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await authService.resendOTP(email);
      setOtp(Array(6).fill(""));
      setCooldown(RESEND_SECONDS);
      setSuccess("Mã OTP mới đã được gửi vào email của bạn!");
    } catch (err) {
      const msg = err?.response?.data?.error ?? "Không thể gửi lại OTP. Vui lòng thử lại!";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F2F2F2] flex items-center justify-center font-['Be_Vietnam_Pro',sans-serif] px-4"
      style={{ padding: "calc(68px + 2rem) 16px 2rem" }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[420px] flex flex-col items-center"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "2.5rem 2rem",
          animation: "fadeSlideIn 0.35s ease-out both",
        }}
      >

        <div className="text-[20px] font-extrabold text-[#F37021] tracking-[-0.3px]" style={{ marginBottom: "1.75rem" }}>
          <span>FPTU Clubs</span>
        </div>

        <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-4">
          <svg
            width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="#3B82F6"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-[1.6rem] font-bold text-[#1A1A1A] mb-[6px] tracking-[-0.02em]">Xác thực OTP</h1>
          <p className="text-[13px] text-[#6B6B6B] m-0 leading-[1.5]" style={{ marginBottom: "8px" }}>Check mail để lấy mã xác thực.</p>
          {isEditingEmail ? (
            <div style={{ width: "100%", maxWidth: "280px", margin: "10px auto 0" }}>
              <input
                type="email"
                placeholder="Nhập email cần xác thực"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  localStorage.setItem("pending_verify_email", e.target.value);
                }}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          ) : (
            <p className="text-[13px] font-semibold text-[#3B82F6] mt-[5px] max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap mx-auto">
              {email}
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3B82F6",
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline",
                  marginLeft: "8px",
                  fontWeight: 500
                }}
              >
                Thay đổi
              </button>
            </p>
          )}
        </div>

        <OTPInput otp={otp} onChange={setOtp} disabled={loading} />

        {error && (
          <p className="text-[#D0453A] text-[14px] text-center" style={{ marginTop: "12px" }}>{error}</p>
        )}
        {success && (
          <p style={{ color: "#10B981", marginTop: "12px", textAlign: "center", fontSize: "0.875rem", fontWeight: 500 }}>{success}</p>
        )}

        <button
          className="w-full py-3 border-0 rounded-[10px] bg-[#3B82F6] text-white text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-2 mb-4 transition-all duration-150 hover:enabled:bg-[#2563EB] active:enabled:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleVerify}
          disabled={!isFilled || loading}
        >
          {loading ? (
            <>
              <svg
                className="flex-shrink-0"
                style={{ animation: "otp-spin 0.75s linear infinite" }}
                width="16" height="16" viewBox="0 0 24 24" fill="none"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.75" />
              </svg>
              Đang xác thực...
            </>
          ) : "Verify OTP"}
        </button>

        <p className="text-[13px] text-[#6B6B6B] text-center m-0">
          Không nhận được mã?{" "}
          {cooldown === 0 ? (
            <button
              className="bg-transparent border-0 cursor-pointer text-[#3B82F6] font-semibold text-[13px] p-0 font-[inherit] transition-colors duration-150 hover:underline"
              onClick={handleResend}
            >
              Gửi lại OTP
            </button>
          ) : (
            <span className="text-[#ABABAB]">
              Gửi lại sau{" "}
              <span className="text-[#3B82F6] font-semibold tabular-nums">{cooldown}s</span>
            </span>
          )}
        </p>

      </div>
    </div>
  );
}
