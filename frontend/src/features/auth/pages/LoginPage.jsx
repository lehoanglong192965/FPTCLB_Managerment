import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../assets/css/loginPage.css";
import { TokenStorage } from "../utils/tokenGuard";

const FAKE_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiTmd1eWVuIFZhbiBBIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sInByb3ZpZGVyIjoiZ29vZ2xlIiwiaWF0IjoxNzE1MDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9" +
  ".RSASIG_placeholder";

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
    <div className="logo-text">
      <span>FPTU Clubs</span>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [keepSigned, setKeepSigned] = useState(false);
  const [loading, setLoading]     = useState(null);
  const [error, setError]         = useState("");

  const handleSSO = (provider) => {
    setError("");
    setLoading(provider);
    setTimeout(() => {
      TokenStorage.set(FAKE_JWT);
      navigate("/");
    }, 1400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setLoading("email");
    setTimeout(() => {
      TokenStorage.set(FAKE_JWT);
      navigate("/");
    }, 1100);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <Logo />

        <div className="login-card__head">
          <h1 className="login-card__title">Đăng nhập</h1>
          <p className="login-card__sub">để tiếp tục vào hệ thống của bạn</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <input
              className="login-field__input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!loading}
              autoComplete="email"
            />
          </div>

          <div className="login-field login-field--password">
            <input
              className="login-field__input"
              type={showPass ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!!loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-field__eye"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              <EyeIcon open={showPass} />
            </button>
          </div>

          <div className="login-options">
            <label className="login-checkbox">
              <input
                type="checkbox"
                checked={keepSigned}
                onChange={(e) => setKeepSigned(e.target.checked)}
              />
              <span>Duy trì đăng nhập</span>
            </label>
            <a href="#" className="login-forgot" onClick={(e) => e.preventDefault()}>
              QUÊN MẬT KHẨU?
            </a>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={!!loading}>
            {loading === "email" ? "Đang kiểm tra..." : "ĐĂNG NHẬP"}
          </button>
        </form>

        <div className="login-divider"><span>hoặc</span></div>

        <button
          className="login-sso-btn"
          disabled={!!loading}
          onClick={() => handleSSO("google")}
        >
          <GoogleIcon />
          {loading === "google" ? "Đang xác thực..." : "Tiếp tục với Google"}
        </button>

        <p className="login-footer">
          Chưa có tài khoản?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>Tạo tài khoản</a>
        </p>

      </div>
    </div>
  );
}
