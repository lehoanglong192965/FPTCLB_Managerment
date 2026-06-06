package com.fptu.fcms.security.jwt;

import com.fptu.fcms.repository.UserRepository;
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

@Component
@RequiredArgsConstructor
public class AccountStatusFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Lấy thông tin xác thực hiện tại từ SecurityContext (đã được JWT Filter set trước đó)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName(); // Dựa trên cấu hình OAuth2 SSO bằng Email

            // Truy vấn trạng thái tài khoản từ Database
            userRepository.findByEmailAndIsDeletedFalse(email).ifPresent(user -> {
                if ("Suspended".equalsIgnoreCase(user.getAccountStatus())) {
                    // Nếu tài khoản bị đình chỉ, xóa SecurityContext để hủy phiên đăng nhập
                    SecurityContextHolder.clearContext();

                    try {
                        // Trả về lỗi 403 Forbidden kèm message chặn truy cập hoàn toàn
                        response.setStatus(HttpStatus.FORBIDDEN.value());
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\": \"Access Denied\", \"message\": \"Tài khoản của bạn đã bị khóa (Suspended). Vui lòng liên hệ Admin.\"}");
                        response.getWriter().flush();
                    } catch (IOException e) {
                        logger.error("Error writing forbidden response", e);
                    }
                }
            });

            // Nếu response đã bị commit (do trả về lỗi 403), ngắt chuỗi filter
            if (response.isCommitted()) {
                return;
            }
        }

        // Chuyển tiếp request nếu tài khoản Active
        filterChain.doFilter(request, response);
    }
}