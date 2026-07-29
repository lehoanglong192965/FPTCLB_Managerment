package com.fptu.fcms.security.jwt;

import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AccountStatusFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    /**
     * Bỏ qua các endpoint xác thực. Nếu chặn ở đây, người dùng có token vừa bị vô hiệu hoá
     * sẽ không gọi được /api/auth/refresh để lấy token mới — tự khoá mình ra ngoài.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/")
                || path.startsWith("/oauth2/")
                || path.startsWith("/login/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Lấy thông tin xác thực hiện tại từ SecurityContext (đã được JWT Filter set trước đó)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Chỉ soi các phiên đã đăng nhập. Request ẩn danh tới endpoint permitAll mang
        // AnonymousAuthenticationToken (getName() = "anonymousUser") — không được đụng vào,
        // nếu không toàn bộ API công khai sẽ bị chặn.
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = authentication.getName();

        // Tra cứu KHÔNG lọc isDeleted: dùng findByEmailAndIsDeletedFalse thì tài khoản đã bị
        // xoá mềm trả về rỗng, filter không làm gì và request đi tiếp như tài khoản bình thường.
        Optional<UserAccount> found = userRepository.findAnyByEmailIgnoreCase(email);

        if (found.isEmpty()) {
            // Không có bản ghi nào cho email này. Hệ thống chỉ xoá mềm nên tình huống này đòi
            // hỏi token được ký cho một user chưa từng tồn tại — tức là kẻ tấn công đã nắm khoá
            // ký và chặn ở đây cũng vô nghĩa. Cho đi tiếp để @PreAuthorize tự quyết.
            filterChain.doFilter(request, response);
            return;
        }

        UserAccount user = found.get();

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            reject(response, HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn đã bị xóa khỏi hệ thống. Vui lòng liên hệ Admin.");
            return;
        }

        if ("Suspended".equalsIgnoreCase(user.getAccountStatus())) {
            reject(response, HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn đã bị khóa (Suspended). Vui lòng liên hệ Admin.");
            return;
        }

        if (!"Active".equalsIgnoreCase(user.getAccountStatus())) {
            // Gồm cả PENDING — trước đây chỉ bị chặn lúc login, token lỡ cấp rồi thì vẫn dùng được.
            reject(response, HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn chưa được kích hoạt. Vui lòng xác thực OTP.");
            return;
        }

        if (isIssuedBeforeInvalidation(principal, user)) {
            // Quyền đã đổi sau khi token được cấp. Trả 401 để client tự gọi /auth/refresh
            // lấy token mang claim mới, thay vì tiếp tục dùng quyền cũ tới lúc hết hạn.
            reject(response, HttpStatus.UNAUTHORIZED,
                    "Quyền của bạn đã thay đổi. Vui lòng đăng nhập lại.");
            return;
        }

        // Chuyển tiếp request nếu tài khoản Active
        filterChain.doFilter(request, response);
    }

    /**
     * Token được cấp trước (hoặc đúng vào) thời điểm quyền bị thay đổi thì coi như hết hiệu lực.
     * Dùng {@code !isAfter} thay vì {@code isBefore} vì claim iat chỉ có độ phân giải giây:
     * token sinh ra cùng giây với lúc đổi quyền vẫn có thể mang claim cũ, nên từ chối luôn cho
     * chắc — client chỉ cần refresh thêm một nhịp là qua.
     */
    private boolean isIssuedBeforeInvalidation(UserPrincipal principal, UserAccount user) {
        if (user.getTokenInvalidatedAt() == null) {
            return false;
        }
        Instant issuedAt = principal.getIssuedAt();
        if (issuedAt == null) {
            // Token cũ không có iat — không đối chiếu được thì từ chối, buộc cấp lại token mới.
            return true;
        }
        Instant invalidatedAt = user.getTokenInvalidatedAt()
                .atZone(ZoneId.systemDefault())
                .toInstant();
        return !issuedAt.isAfter(invalidatedAt);
    }

    private void reject(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        // Hủy phiên đăng nhập trong context trước khi trả lỗi
        SecurityContextHolder.clearContext();

        response.setStatus(status.value());
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"error\": \"Access Denied\", \"message\": \"" + message + "\"}");
        response.getWriter().flush();
    }
}
