import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/api/auth/authService";
import AlertModal from "../../components/ui/AlertModal";

function Logo() {
  return (
    <div className="text-[20px] font-extrabold text-[#F37021] tracking-[-0.3px]">
      <span>FPTU Clubs</span>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email không đúng định dạng.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email.trim());
      navigate("/verify-otp", { state: { email: email.trim(), mode: "forgot-password" } });
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.response?.data?.error ?? "Có lỗi xảy ra, vui lòng thử lại!");
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

        <div className="w-16 h-16 rounded-full bg-[#FFF4EC] flex items-center justify-center mt-5 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F37021" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="text-center mb-7">
          <h1 className="text-[1.9rem] font-semibold text-[#1A1A1A] mb-[4px] tracking-[-0.02em]">Quên mật khẩu</h1>
          <p className="text-[13px] text-[#6B6B6B] m-0">Nhập email FPT của bạn để nhận mã OTP.</p>
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div>
            <input
              className={[
                "w-full px-[14px] py-[11px] border-0 border-b-[1.5px] bg-transparent text-[14px] text-[#1A1A1A] outline-none transition-colors duration-150 box-border placeholder-[#ABABAB]",
                error ? "border-b-[#D0453A]" : "border-b-[#E4E4E4] focus:border-b-[#4A90D9]",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              type="email"
              placeholder="Email (vd: user@fpt.edu.vn)"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border-0 rounded-lg bg-[#F37022] text-white text-[14px] font-semibold tracking-[0.06em] cursor-pointer transition-all duration-150 hover:enabled:bg-[#d65e18] active:enabled:scale-[0.99] disabled:opacity-65 disabled:cursor-not-allowed"
          >
            {loading ? "Đang xử lý..." : "GỬI MÃ OTP"}
          </button>
        </form>

        <p className="mt-6 text-[13px] text-[#6B6B6B] text-center">
          Nhớ mật khẩu rồi?{" "}
          <Link to="/login" className="font-semibold no-underline hover:underline" style={{ color: "#F37021" }}>
            Đăng nhập
          </Link>
        </p>
      </div>

      {error && (
        <AlertModal
          type="error"
          title="Không thể gửi mã OTP"
          message={error}
          confirmLabel="Đã hiểu"
          onClose={() => setError("")}
        />
      )}
    </div>
  );
}
