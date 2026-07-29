package com.fptu.fcms.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    static final String GENERIC_ERROR = "Đăng nhập bằng Google thất bại. Vui lòng thử lại.";

    private final String frontendUrl;

    public OAuth2FailureHandler(@Value("${fcms.frontend-url}") String frontendUrl) {
        this.frontendUrl = normalizeFrontendUrl(frontendUrl);
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        // Never expose provider/internal exception text to the browser.
        String targetUrl = frontendUrl + "/login?ssoError="
                + URLEncoder.encode(GENERIC_ERROR, StandardCharsets.UTF_8);
        response.sendRedirect(targetUrl);
    }

    private static String normalizeFrontendUrl(String configuredUrl) {
        if (configuredUrl == null || configuredUrl.isBlank()) {
            throw new IllegalArgumentException("fcms.frontend-url must not be blank");
        }
        return configuredUrl.trim().replaceAll("/+$", "");
    }
}