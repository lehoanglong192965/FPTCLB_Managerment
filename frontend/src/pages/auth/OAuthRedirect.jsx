import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TokenService } from "../../services/api/axiosClient";
import { decodeJwtPayload } from "../../lib/tokenGuard";
import { useAuth } from "../../contexts/AuthContext";
import authApi from "../../services/api/auth/authApi";

const ROLE_MAP = {
  1: "ADMIN",
  2: "ICPDP",
  3: "MEMBER",
  4: "ALUMNI",
};

const ROLE_REDIRECT = {
  ADMIN:       "/admin",
  ICPDP:       "/icpdp",
  MEMBER:      "/member",
  ALUMNI:      "/alumni",
  CLUB_LEADER: "/club-leader",
  VICE_LEADER: "/club-leader",
};

export default function OAuthRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      const handleOAuthRedirect = async () => {
        try {
          const payload = decodeJwtPayload(token);
          let role = ROLE_MAP[payload?.roleID] ?? "MEMBER";
          
          // Lưu tạm thời token để authApi.getMyClubRole() có thể lấy gửi đi
          TokenService.save({ access_token: token, refresh_token: null, role });
          
          if (role === "MEMBER") {
            try {
              const res = await authApi.getMyClubRole();
              if (res.clubRoleID === 1) {
                role = "CLUB_LEADER";
              } else if (res.clubRoleID === 2) {
                role = "VICE_LEADER";
              }
              // Cập nhật lại role trong TokenService
              TokenService.save({ access_token: token, refresh_token: null, role });
            } catch (e) {
              console.error("Lỗi lấy quyền CLB khi OAuth2", e);
            }
          }
          
          // Lưu vào AuthContext
          login({ email: payload?.sub, role });
          
          // Chuyển hướng
          navigate(ROLE_REDIRECT[role] ?? "/member", { replace: true });
        } catch (e) {
          console.error("Lỗi khi xử lý token Google", e);
          navigate("/login?error=L%E1%BB%97i%20x%C3%A1c%20th%E1%BB%B1c%20Token", { replace: true });
        }
      };
      
      handleOAuthRedirect();
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
