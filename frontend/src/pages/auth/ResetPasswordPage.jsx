import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/api/auth/authService";

function Logo() {
  return (
    <div className="text-[20px] font-extrabold text-[#F37021] tracking-[-0.3px]">
      <span>FPTU Clubs</span>
    </div>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const email = state?.email ?? "";
  const otp = state?.otp ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!email || !otp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2]" style={{ padding: "calc(68px + 2rem) 1rem 2rem" }}>
        <div className="bg-white rounded-xl w-full max-w-[400px] text-center p-10" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p className="text-[14px] text-[#6B6B6B] mb-4">Phiên làm việc không hợp lệ. Vui lòng thử lại.</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-[#F37021] font-semibold text-[14px] hover:underline"
          >
            Quay lại Quên mật khẩu
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await authService.resetPassword({ email, otp, newPassword, confirmPassword });
      setSuccess("Đổi mật khẩu thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.response?.data?.error ?? "Đổi mật khẩu thất bại, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#F2F2F2] font-['Be_Vietnam_Pro',sans-serif]"
      style={{ padding: "calc(68px + 2rem) 1rem 2rem" }}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[400px] flex flex-col items-center"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "2.5rem 2rem",
          animation: "fadeSlideIn 0.35s ease-out both",
        }}
      >
        <Logo />

        <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mt-5 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <div className="text-center mb-7">
          <h1 className="text-[1.9rem] font-semibold text-[#1A1A1A] mb-[4px] tracking-[-0.02em]">Đặt mật khẩu mới</h1>
          <p className="text-[13px] text-[#6B6B6B] m-0">
            Tạo mật khẩu mới cho tài khoản{" "}
            <span className="font-semibold text-[#3B82F6]">{email}</span>
          </p>
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="relative">
            <input
              className={[
                "w-full pl-[14px] pr-[42px] py-[11px] border-0 border-b-[1.5px] bg-transparent text-[14px] text-[#1A1A1A] outline-none transition-colors duration-150 box-border placeholder-[#ABABAB]",
                error ? "border-b-[#D0453A]" : "border-b-[#E4E4E4] focus:border-b-[#4A90D9]",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              type={showNew ? "text" : "password"}
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError("");
              }}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-none border-0 cursor-pointer text-[#ABABAB] flex items-center p-[2px] transition-colors duration-150 hover:text-[#6B6B6B]"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              <EyeIcon open={showNew} />
            </button>
          </div>

          <div className="relative">
            <input
              className={[
                "w-full pl-[14px] pr-[42px] py-[11px] border-0 border-b-[1.5px] bg-transparent text-[14px] text-[#1A1A1A] outline-none transition-colors duration-150 box-border placeholder-[#ABABAB]",
                error ? "border-b-[#D0453A]" : "border-b-[#E4E4E4] focus:border-b-[#4A90D9]",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              type={showConfirm ? "text" : "password"}
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError("");
              }}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-none border-0 cursor-pointer text-[#ABABAB] flex items-center p-[2px] transition-colors duration-150 hover:text-[#6B6B6B]"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>

          {error && (
            <p className="text-[12px] text-[#D0453A] pl-[2px] leading-[1.4] -mt-2">{error}</p>
          )}
          {success && (
            <p className="text-[12px] pl-[2px] leading-[1.4] -mt-2" style={{ color: "#22C55E" }}>{success}</p>
          )}

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-3 border-0 rounded-lg bg-[#F37022] text-white text-[14px] font-semibold tracking-[0.06em] cursor-pointer transition-all duration-150 mt-1 hover:enabled:bg-[#d65e18] active:enabled:scale-[0.99] disabled:opacity-65 disabled:cursor-not-allowed"
          >
            {loading ? "Đang cập nhật..." : "XÁC NHẬN"}
          </button>
        </form>
      </div>
    </div>
  );
}
