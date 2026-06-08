import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OTPInput from "../components/OTPInput";
import authService from "../services/authService";
import "../../../assets/css/loginPage.css";
import "../../../assets/css/verifyOTP.css";

const RESEND_SECONDS = 60;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Lấy email từ state hoặc fallback từ localStorage
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
          <p className="otp-sub" style={{ marginBottom: "8px" }}>Check mail để lấy mã xác thực.</p>
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
            <p className="otp-email">
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

        {/* 6 ô nhập OTP */}
        <OTPInput otp={otp} onChange={setOtp} disabled={loading} />

        {error && <p className="login-error" style={{ marginTop: "12px", textAlign: "center" }}>{error}</p>}
        {success && <p style={{ color: "#10B981", marginTop: "12px", textAlign: "center", fontSize: "0.875rem", fontWeight: 500 }}>{success}</p>}

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