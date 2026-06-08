package com.fptu.fcms.security.oauth2;

import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;

    public OAuth2SuccessHandler(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // 1. Lấy ra cái thẻ UserPrincipal xịn xò mà chúng ta vừa nâng cấp
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        // 2. Lấy thông tin từ thẻ ra
        String email = userPrincipal.getEmail();
        Integer userId = userPrincipal.getUserId();
        Integer roleId = userPrincipal.getRoleId();

        // 3. Nhờ JwtTokenProvider phát hành một Token mới dựa trên thông tin này
        String token = tokenProvider.generateToken(email, userId, roleId);

        // 4. Chuyển hướng về trang Frontend kèm theo Token trên URL
        // GIẢ SỬ FRONTEND CỦA BẠN ĐANG CHẠY Ở CỔNG 5173 (Vite)
        // Nếu Frontend của bạn chạy ở cổng khác, hãy sửa lại đường dẫn này nhé!
        String targetUrl = "http://localhost:5173/oauth2/redirect?token=" + token;

        // Xóa các thuộc tính rác trong phiên đăng nhập để tiết kiệm bộ nhớ
        clearAuthenticationAttributes(request);

        // Bắn URL về cho trình duyệt
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}