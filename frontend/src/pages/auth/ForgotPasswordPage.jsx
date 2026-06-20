import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/api/auth/authService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      // Chuyển sang trang đặt lại mật khẩu hoặc trang xác thực OTP
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[400px] p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Quên mật khẩu</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Nhập email FPT của bạn để nhận mã OTP.</p>
        {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (vd: user@fpt.edu.vn)"
            className="w-full p-3 mb-6 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37021] text-white p-3 rounded-lg font-bold hover:bg-[#d65e18] disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Gửi mã OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
