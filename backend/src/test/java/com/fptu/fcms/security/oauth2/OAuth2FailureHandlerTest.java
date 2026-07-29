package com.fptu.fcms.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.AuthenticationException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OAuth2FailureHandlerTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Test
    void onAuthenticationFailure_usesConfiguredFrontendAndEncodesError() throws Exception {
        OAuth2FailureHandler handler = new OAuth2FailureHandler("https://frontend.example/");
        AuthenticationException exception = mock(AuthenticationException.class);
        handler.onAuthenticationFailure(request, response, exception);

        String encodedError = URLEncoder.encode(
                OAuth2FailureHandler.GENERIC_ERROR, StandardCharsets.UTF_8);
        verify(response).sendRedirect(
                "https://frontend.example/login?ssoError=" + encodedError
        );
    }
}
