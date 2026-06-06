import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OTPInput from "../components/OTPInput";
import "../../../assets/css/loginPage.css";
import "../../../assets/css/verifyOTP.css";

const RESEND_SECONDS = 60;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email ?? "";

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const isFilled = otp.every(Boolean);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleVerify = () => {
    if (!isFilled || loading) return;
    setLoading(true);
    // TODO: replace with authService.verifyOtp(otp.join(""))
    setTimeout(() => {
      setLoading(false);
      navigate("/");
    }, 1500);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setOtp(Array(6).fill(""));
    setCooldown(RESEND_SECONDS);
    // TODO: replace with authService.resendOtp(email)
  };

  return (
    <div className="otp-page">
      <div className="otp-card">

        {/* Logo — dùng lại class từ loginPage.css */}
        <div className="logo-text" style={{ marginBottom: "1.75rem" }}>
          <span>FPTU Clubs</span>
        </div>

        {/* Icon mail */}
        <div className="otp-icon-wrap">
          <svg
            width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="#3B82F6"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>

        {/* Heading */}
        <div className="otp-head">
          <h1 className="otp-title">Xác thực OTP</h1>
          <p className="otp-sub">Check mail để lấy mã xác thực.</p>
          {email && <p className="otp-email">{email}</p>}
        </div>

        {/* 6 ô nhập OTP */}
        <OTPInput otp={otp} onChange={setOtp} disabled={loading} />

        {/* Nút xác nhận */}
        <button
          className="otp-submit"
          onClick={handleVerify}
          disabled={!isFilled || loading}
        >
          {loading ? (
            <>
              <svg className="otp-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.75" />
              </svg>
              Đang xác thực...
            </>
          ) : "Verify OTP"}
        </button>

        {/* Gửi lại */}
        <p className="otp-resend">
          Không nhận được mã?{" "}
          {cooldown === 0 ? (
            <button className="otp-resend__btn" onClick={handleResend}>
              Gửi lại OTP
            </button>
          ) : (
            <span className="otp-resend__countdown">
              Gửi lại sau{" "}
              <span className="otp-resend__time">{cooldown}s</span>
            </span>
          )}
        </p>

      </div>
    </div>
  );
}
