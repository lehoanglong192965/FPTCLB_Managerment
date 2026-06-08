package com.fptu.fcms.security.oauth2;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {

        // 1. Rút xuất câu thông báo lỗi (Ví dụ: "Hệ thống chỉ cho phép tài khoản @fpt...")
        String errorMessage = exception.getMessage();
        if (errorMessage == null || errorMessage.isEmpty()) {
            errorMessage = "Đăng nhập Google thất bại do lỗi không xác định.";
        }

        // 2. Mã hóa thông báo để đưa lên URL (tránh lỗi font tiếng Việt)
        String encodedErrorMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);

        // 3. Chuyển hướng về trang Login của Frontend kèm theo biến lỗi
        // Lưu ý: Đang set cổng 3000 giống file SuccessHandler của bạn
        String frontendUrl = "http://localhost:5173/login?error=" + encodedErrorMessage;

        getRedirectStrategy().sendRedirect(request, response, frontendUrl);
    }
}