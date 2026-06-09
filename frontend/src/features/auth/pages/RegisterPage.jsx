import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import authService from "../services/authService";
import "../../../assets/css/loginPage.css";
import "../../../assets/css/registerPage.css";

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

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    studentId: "",
    major: "",
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(null);
  const [success, setSuccess]         = useState(false);

  const handleSSO = () => {
    setLoading("google");
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim())
      errs.username = "Vui lòng nhập tên đăng nhập.";
    if (!form.password)
      errs.password = "Vui lòng nhập mật khẩu.";
    else if (form.password.length < 8)
      errs.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    if (!form.confirmPassword)
      errs.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Mật khẩu xác nhận không khớp.";
    if (!form.email.trim())
      errs.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email không đúng định dạng.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading("form");
    try {
      await authService.register({
        fullName: form.username,
        email:    form.email,
        password: form.password,
        studentId: form.studentId,
        major:    form.major,
      });
      setSuccess(true);
      localStorage.setItem("pending_verify_email", form.email);
      setTimeout(() => navigate("/verify-otp", { state: { email: form.email } }), 2000);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setErrors({ email: "Email này đã được sử dụng." });
      } else {
        setErrors({ form: err?.response?.data?.error ?? "Đăng ký thất bại. Vui lòng thử lại." });
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="register-page">
      <div className="register-center">
        <div className="register-card">

          {/* Logo */}
          <div className="logo-text">
            <span>FPTU Clubs</span>
          </div>

          {/* Heading */}
          <div className="register-head">
            <h1 className="register-title">Tạo tài khoản</h1>
            <p className="register-sub">Tham gia cộng đồng sinh viên FPTU</p>
          </div>

          {/* Form */}
          <form className="register-form" onSubmit={handleSubmit} noValidate>

            {/* Username */}
            <div className="rg-field">
              <label className="rg-label">Tên đăng nhập <span>*</span></label>
              <input
                className="rg-input"
                type="text"
                name="username"
                placeholder="Nhập tên đăng nhập"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
                autoComplete="username"
              />
              {errors.username && <p className="rg-error">{errors.username}</p>}
            </div>

            {/* Email */}
            <div className="rg-field">
              <label className="rg-label">Email <span>*</span></label>
              <input
                className="rg-input"
                type="email"
                name="email"
                placeholder="example@fpt.edu.vn"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && <p className="rg-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="rg-field">
              <label className="rg-label">Mật khẩu <span>*</span></label>
              <div className="rg-input-wrap">
                <input
                  className="rg-input"
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button type="button" className="rg-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="rg-error">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div className="rg-field">
              <label className="rg-label">Xác nhận mật khẩu <span>*</span></label>
              <div className="rg-input-wrap">
                <input
                  className="rg-input"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button type="button" className="rg-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="rg-error">{errors.confirmPassword}</p>}
            </div>
            {/* Student ID + Major */}
            <div className="register-row">
              <div className="rg-field">
                <label className="rg-label">Mã sinh viên</label>
                <input
                  className="rg-input"
                  type="text"
                  name="studentId"
                  placeholder="SE123456"
                  value={form.studentId}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="rg-field">
                <label className="rg-label">Chuyên ngành</label>
                <select
                  className="rg-select"
                  name="major"
                  value={form.major}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">-- Chọn chuyên ngành --</option>
                  <optgroup label="Công nghệ thông tin">
                    <option value="SE">Kỹ thuật phần mềm (SE)</option>
                    <option value="AI">Trí tuệ nhân tạo (AI)</option>
                    <option value="IS">An toàn thông tin (IS)</option>
                    <option value="IoT">Internet of Things (IoT)</option>
                    <option value="CS">Khoa học máy tính (CS)</option>
                  </optgroup>
                  <optgroup label="Kinh tế">
                    <option value="BA">Quản trị kinh doanh (BA)</option>
                    <option value="IB">Kinh doanh quốc tế (IB)</option>
                    <option value="FIN">Tài chính (FIN)</option>
                    <option value="ACC">Kế toán (ACC)</option>
                    <option value="MKT">Marketing số (MKT)</option>
                    <option value="LOG">Logistics & Chuỗi cung ứng (LOG)</option>
                  </optgroup>
                  <optgroup label="Thiết kế">
                    <option value="GD">Thiết kế mỹ thuật số (GD)</option>
                    <option value="ID">Thiết kế nội thất (ID)</option>
                  </optgroup>
                  <optgroup label="Ngôn ngữ">
                    <option value="EN">Ngôn ngữ Anh (EN)</option>
                    <option value="JA">Ngôn ngữ Nhật (JA)</option>
                    <option value="KO">Ngôn ngữ Hàn (KO)</option>
                    <option value="CN">Ngôn ngữ Trung (CN)</option>
                  </optgroup>
                  <optgroup label="Khác">
                    <option value="HM">Quản trị khách sạn (HM)</option>
                    <option value="MC">Truyền thông đa phương tiện (MC)</option>
                    <option value="LAW">Luật (LAW)</option>
                    <option value="AR">Kiến trúc (AR)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {success && (
              <p style={{ color: "#10b981", fontSize: 14, textAlign: "center", marginBottom: 8 }}>
                Đăng ký thành công! Đang chuyển sang trang xác thực OTP...
              </p>
            )}
            {errors.form && (
              <p className="rg-error" style={{ textAlign: "center" }}>{errors.form}</p>
            )}

            <button type="submit" className="register-submit" disabled={!!loading || success}>
              {loading === "form" ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <div className="rg-divider"><span>hoặc</span></div>

          <button className="rg-sso-btn" disabled={!!loading} onClick={handleSSO}>
            <GoogleIcon />
            {loading === "google" ? "Đang xác thực..." : "Đăng ký với Google"}
          </button>

          <p className="register-footer">
            Đã có tài khoản?{" "}
            <button type="button" className="register-footer__link"
              onClick={() => navigate("/login")}>
              Đăng nhập
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
