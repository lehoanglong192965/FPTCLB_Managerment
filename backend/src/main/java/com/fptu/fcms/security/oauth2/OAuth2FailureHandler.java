package com.fptu.fcms.security.oauth2;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;


@Component

public class OAuth2FailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String errorMessage = (exception != null && exception.getMessage() != null) 
                                ? exception.getMessage() 
                                : "Đăng nhập bằng Google thất bại";
        
        String targetUrl = "http://localhost:5173/login?error=" + java.net.URLEncoder.encode(errorMessage, "UTF-8");
        response.sendRedirect(targetUrl);
    }
}
