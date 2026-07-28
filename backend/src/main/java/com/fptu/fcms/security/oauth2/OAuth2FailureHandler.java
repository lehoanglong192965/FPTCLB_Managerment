package com.fptu.fcms.security.oauth2;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;


@Component

public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    private final String frontendUrl;

    public OAuth2FailureHandler(@Value("${fcms.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.frontendUrl = normalizeFrontendUrl(frontendUrl);
    }
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String errorMessage = (exception != null && exception.getMessage() != null) 
                                ? exception.getMessage() 
                                : "Đăng nhập bằng Google thất bại";
        
        String targetUrl = frontendUrl + "/login?error="
                + java.net.URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
        response.sendRedirect(targetUrl);
    }

    private static String normalizeFrontendUrl(String configuredUrl) {
        String resolvedUrl = configuredUrl == null || configuredUrl.isBlank()
                ? "http://localhost:5173"
                : configuredUrl.trim();
        return resolvedUrl.replaceAll("/+$", "");
    }
}
