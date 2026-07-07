import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_REDIRECT } from '../../constants/roles';

/**
 * Bảo vệ route theo role.
 * - Chưa đăng nhập → redirect /login (lưu lại đường dẫn hiện tại)
 * - Sai role → redirect về trang chủ của role đó
 * - Đúng role → render children
 *
 * allowedRoles: string[] | undefined
 *   undefined hoặc [] → chỉ yêu cầu đăng nhập, không kiểm tra role
 */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_REDIRECT[user.role] ?? '/'} replace />;
  }

  return children;
};

export default PrivateRoute;
