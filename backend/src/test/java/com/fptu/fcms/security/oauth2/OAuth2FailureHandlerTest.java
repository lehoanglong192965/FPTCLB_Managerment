package com.fptu.fcms.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.AuthenticationException;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
        when(exception.getMessage()).thenReturn("OAuth failed: access denied");

        handler.onAuthenticationFailure(request, response, exception);

        verify(response).sendRedirect(
                "https://frontend.example/login?error=OAuth+failed%3A+access+denied"
        );
    }
}
