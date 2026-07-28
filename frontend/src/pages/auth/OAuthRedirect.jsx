import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../utils/tokenGuard";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_REDIRECT, resolveRoleFromClaims } from "../../constants/roles";

export default function OAuthRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const processedTokenRef = useRef(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const backendError = searchParams.get("error");

    if (!token) {
      sessionStorage.removeItem("oauth_return_to");
      const msg = backendError?.toLowerCase().includes("not found") || backendError?.toLowerCase().includes("register")
        ? "Tài khoản Google chưa được đăng ký. Vui lòng đăng ký trước."
        : "Đăng nhập Google thất bại. Vui lòng thử lại.";
      navigate(`/login?ssoError=${encodeURIComponent(msg)}`, { replace: true });
      return;
    }

    // React StrictMode có thể chạy effect hai lần trong môi trường dev.
    // Không xử lý lại cùng một token vì login() sẽ cập nhật AuthContext
    // và kéo theo các request profile/thông báo không cần thiết.
    if (processedTokenRef.current === token) return;
    processedTokenRef.current = token;

    const handleOAuthRedirect = async () => {
      try {
        // OAuth2SuccessHandler cũng đính claim clubRole/clubId vào token giống
        // luồng đăng nhập thường ⇒ đọc thẳng từ token, không gọi thêm API.
        const payload = decodeJwtPayload(token);
        const { role, clubId } = resolveRoleFromClaims(payload);

        TokenService.save({ access_token: token, refresh_token: null, role, clubId });

        login({ email: payload?.sub, role });

        const returnTo = sessionStorage.getItem("oauth_return_to");
        sessionStorage.removeItem("oauth_return_to");

        let dest;
        if (role === "MEMBER") {
          const isReturnPage = returnTo && (returnTo.startsWith("/events/") || returnTo.startsWith("/clubs/"));
          dest = isReturnPage ? returnTo : "/";
        } else {
          dest = ROLE_REDIRECT[role] ?? "/";
        }

        navigate(dest, { replace: true });
      } catch (e) {
        console.error("Lỗi khi xử lý token Google", e);
        sessionStorage.removeItem("oauth_return_to");
        navigate(`/login?ssoError=${encodeURIComponent("Xác thực Google thất bại. Vui lòng thử lại.")}`, { replace: true });
      }
    };

    handleOAuthRedirect();
  }, [searchParams, navigate, login]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
      <div className="spinner" style={{ border: "4px solid rgba(0,0,0,0.1)", width: "36px", height: "36px", borderRadius: "50%", borderLeftColor: "#4285F4", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
      <h2>Đang xác thực với Google...</h2>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
