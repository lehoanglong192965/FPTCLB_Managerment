import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TokenService } from "../../../services/api/axiosClient";
import { decodeJwtPayload } from "../utils/tokenGuard";
import { useAuth } from "../context/AuthContext";

const ROLE_MAP = {
  1: "ADMIN",
  2: "ICPDP",
  3: "MEMBER",
};

const ROLE_REDIRECT = {
  ADMIN:  "/admin",
  ICPDP:  "/icpdp",
  MEMBER: "/member",
};

export default function OAuthRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      try {
        const payload = decodeJwtPayload(token);
        const role = ROLE_MAP[payload?.roleID] ?? "MEMBER";
        
        // Lưu token vào TokenService giống authService
        TokenService.save({ access_token: token, refresh_token: null, role });
        
        // Lưu vào AuthContext
        login({ email: payload?.sub, role });
        
        // Chuyển hướng
        navigate(ROLE_REDIRECT[role] ?? "/member", { replace: true });
      } catch (e) {
        console.error("Lỗi khi xử lý token Google", e);
        navigate("/login?error=L%E1%BB%97i%20x%C3%A1c%20th%E1%BB%B1c%20Token", { replace: true });
      }
    } else {
      navigate("/login?error=Kh%C3%B4ng%20nh%E1%BA%ADn%20%C4%91%C6%B0%E1%BB%A3c%20token", { replace: true });
    }
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
