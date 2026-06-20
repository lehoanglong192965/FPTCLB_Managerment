import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/api/auth/authService";

const RESEND_SECONDS = 60;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [formData, setFormData] = useState({
    email: state?.email || "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword(formData);
      alert("Đổi mật khẩu thành công!");
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Đổi mật khẩu thất bại, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      await authService.resendForgotPasswordOTP(formData.email);
      setCooldown(RESEND_SECONDS);
      alert("Mã OTP mới đã được gửi!");
    } catch (err) {
      setError("Không thể gửi lại mã.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[400px] p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Đặt lại mật khẩu</h1>
        {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={formData.email}
            readOnly
            className="w-full p-3 mb-4 border rounded-lg bg-gray-50"
          />
          <input
            type="text"
            placeholder="Nhập mã OTP"
            value={formData.otp}
            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
            className="w-full p-3 mb-4 border rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="w-full p-3 mb-4 border rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full p-3 mb-6 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37021] text-white p-3 rounded-lg font-bold hover:bg-[#d65e18] disabled:opacity-50 mb-4"
          >
            {loading ? "Đang cập nhật..." : "Xác nhận"}
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || loading}
          className="w-full text-[#F37021] font-semibold hover:underline disabled:text-gray-400"
        >
          {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : "Gửi lại mã OTP"}
        </button>
      </div>
    </div>
  );
}
