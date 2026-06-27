import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import authService from "../../services/api/auth/authService";
import { useAuth } from "../../contexts/AuthContext";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
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

function Logo() {
  return (
    <div className="text-[20px] font-extrabold text-[#F37021] tracking-[-0.3px]">
      <span>FPTU Clubs</span>
    </div>
  );
}

const ROLE_REDIRECT = {
  ADMIN:       "/admin",
  ICPDP:       "/icpdp",
  MEMBER:      "/member",
  ALUMNI:      "/alumni",
  CLUB_LEADER: "/club-leader",
  VICE_LEADER: "/club-leader",
};


// Public pages that a member can be sent back to after login
const PUBLIC_PATHS = ["/", "/events", "/clubs"];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(null);
  const [errors, setErrors]         = useState({ email: "", password: "" });

  const handleSSO = (provider) => {
    setErrors({ email: "", password: "" });
    setLoading(provider);
    window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //Kiểm tra bỏ trống
    const errs = { email: "", password: "" };
    if (!email.trim())  errs.email    = "Vui lòng nhập email.";
    if (!password)      errs.password = "Vui lòng nhập mật khẩu.";
    if (errs.email || errs.password) {
      setErrors(errs);
      return;
    }
    
    setErrors({ email: "", password: "" });
    setLoading("email");
    try {
      const { role, email: userEmail } = await authService.login(email, password);
      login({ email: userEmail, role });
      const from = location.state?.from;
      const dest = (from && PUBLIC_PATHS.some((p) => from === p || from.startsWith(p + "/")))
        ? from
        : (ROLE_REDIRECT[role] ?? "/member");
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error ?? "";
      if (msg.includes("chấp nhận email")) {
        setErrors((p) => ({ ...p, email: "Chỉ chấp nhận email nội bộ FPT (@fpt.edu.vn hoặc @fe.edu.vn)." }));
      } else if (msg.includes("tìm thấy tài khoản")) {
        setErrors((p) => ({ ...p, email: "Email không tồn tại trong hệ thống." }));
      } else if (msg.includes("bị khóa") || msg.includes("Suspended")) {
        setErrors((p) => ({ ...p, email: "Tài khoản đã bị khóa. Vui lòng liên hệ Admin." }));
      } else if (msg.includes("Sai mật khẩu")) {
        setPassword("");
        setErrors((p) => ({ ...p, password: "Mật khẩu không đúng." }));
      } else {
        setErrors((p) => ({ ...p, password: "Đăng nhập thất bại, vui lòng thử lại." }));
      }
    } finally {
      setLoading(null);
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

        <div className="text-center mb-7">
          <h1 className="text-[2rem] font-semibold text-[#1A1A1A] mb-[4px] tracking-[-0.02em]">Đăng nhập</h1>
          <p className="text-[13px] text-[#6B6B6B] m-0">để tiếp tục vào hệ thống của bạn</p>
        </div>

        <form className="w-full flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
          <div className="relative">
            <input
              className={[
                "w-full px-[14px] py-[11px] border-0 border-b-[1.5px] bg-transparent text-[14px] text-[#1A1A1A] outline-none transition-colors duration-150 box-border placeholder-[#ABABAB]",
                errors.email
                  ? "border-b-[#D0453A]"
                  : "border-b-[#E4E4E4] focus:border-b-[#4A90D9]",
                !!loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              type="email"
              placeholder="Email"
              value={email} //Hiển thị giá trị email đã nhập trong ô input.
              onChange={(e) => {
                setEmail(e.target.value); // Cập nhật state email khi người dùng nhập thêm.
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));  // Nếu trước đó có lỗi email, xóa lỗi khi người dùng bắt đầu sửa.
              }}
              disabled={!!loading} // Vô hiệu hóa input khi đang ở trạng thái loading 
              autoComplete="email" // Gợi ý trình duyệt tự động điền email đã lưu
            />
            {errors.email && (
              <p className="text-[12px] text-[#D0453A] mt-[5px] pl-[2px] leading-[1.4]">{errors.email}</p>
            )}
          </div>

          <div className="relative">
            <input
              className={[
                "w-full pl-[14px] pr-[42px] py-[11px] border-0 border-b-[1.5px] bg-transparent text-[14px] text-[#1A1A1A] outline-none transition-colors duration-150 box-border placeholder-[#ABABAB]",
                errors.password
                  ? "border-b-[#D0453A]"
                  : "border-b-[#E4E4E4] focus:border-b-[#4A90D9]",
                !!loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              type={showPass ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: "" }));
              }}
              disabled={!!loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-none border-0 cursor-pointer text-[#ABABAB] flex items-center p-[2px] transition-colors duration-150 hover:text-[#6B6B6B]"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              <EyeIcon open={showPass} /> 
            </button>
            {errors.password && (
              <p className="text-[12px] text-[#D0453A] mt-[5px] pl-[2px] leading-[1.4]">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-end mt-[2px]">
            <Link
              to="/forgot-password"
              style={{ color: "#F37022", fontSize: "12px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.03em", transition: "color 0.15s, text-decoration 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#d65e18"; e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#F37022"; e.currentTarget.style.textDecoration = "none"; }}
            >
              QUÊN MẬT KHẨU?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 border-0 rounded-lg bg-[#F37022] text-white text-[14px] font-semibold tracking-[0.06em] cursor-pointer transition-all duration-150 mt-1 hover:enabled:bg-[#3578C4] active:enabled:scale-[0.99] disabled:opacity-65 disabled:cursor-not-allowed"
            disabled={!!loading}
          >
            {loading === "email" ? "Đang kiểm tra..." : "ĐĂNG NHẬP"}
          </button>
        </form>

        <div className="w-full flex items-center gap-3 my-5 text-[13px] text-[#ABABAB]"
          style={{
            "--tw-content": "''",
          }}
        >
          <span className="flex-1 h-px bg-[#E4E4E4]" />
          <span>hoặc</span>
          <span className="flex-1 h-px bg-[#E4E4E4]" />
        </div>

        <button
          className="w-full flex items-center justify-center gap-[10px] px-4 py-[11px] border border-[#E4E4E4] rounded-lg bg-white text-[14px] text-[#1A1A1A] cursor-pointer transition-all duration-150 mb-[10px] hover:enabled:bg-[#FAFAFA] hover:enabled:border-[#C8C8C8] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!!loading}
          onClick={() => handleSSO("google")}
        >
          <GoogleIcon />
          {loading === "google" ? "Đang xác thực..." : "Tiếp tục với Google"}
        </button>

        <p className="mt-5 text-[13px] text-[#6B6B6B] text-center">
          Chưa có tài khoản?{" "}
          <a
            href="#"
            className="font-semibold no-underline hover:underline"
            style={{ color: "#F37021" }}
            onClick={(e) => { e.preventDefault(); navigate("/register"); }}
          >
            Tạo tài khoản
          </a>
        </p>

      </div>
    </div>
  );
}
