package com.fptu.fcms.security.oauth2;

import com.fptu.fcms.dto.response.ClubRoleResponse;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import com.fptu.fcms.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OAuth2SuccessHandlerTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserService userService;

    @Mock
    private SystemRoleRepository systemRoleRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private Authentication authentication;

    private OAuth2SuccessHandler successHandler;

    @BeforeEach
    void setUp() {
        successHandler = new OAuth2SuccessHandler(tokenProvider, userService, systemRoleRepository);
    }

    @Test
    void testOnAuthenticationSuccess_PreSeededIcpdp_ShouldGenerateTokenWithIcpdpRole() throws Exception {
        // Arrange
        UserPrincipal principal = new UserPrincipal(999, "preseed@gmail.com", 2, Collections.emptyList());
        when(authentication.getPrincipal()).thenReturn(principal);

        SystemRole icpdpRole = new SystemRole();
        icpdpRole.setRoleName("ICPDP");
        when(systemRoleRepository.findById(2)).thenReturn(Optional.of(icpdpRole));

        ClubRoleResponse emptyClubRole = new ClubRoleResponse();
        when(userService.getClubRole(999)).thenReturn(emptyClubRole);

        when(tokenProvider.generateToken(anyString(), anyInt(), anyInt(), anyString(), any(), any())).thenReturn("mock-jwt-token");
        when(response.encodeRedirectURL(anyString())).thenAnswer(i -> i.getArgument(0));

        // Act
        // Can't directly call onAuthenticationSuccess without mocking getRedirectStrategy, but SimpleUrlAuthenticationSuccessHandler
        // will try to call getRedirectStrategy().sendRedirect(...). Let's mock response and catch exception if thrown or use reflection.
        // Or simply test the logic manually if we can't easily mock the parent class.
        // Actually, we can just call it and mock sendRedirect since we control the response object.
        // But getRedirectStrategy() returns a DefaultRedirectStrategy by default which calls response.sendRedirect().
        
        successHandler.onAuthenticationSuccess(request, response, authentication);

        // Assert
        // Verify that token generation was called with the CORRECT roleName
        verify(tokenProvider).generateToken(
                eq("preseed@gmail.com"),
                eq(999),
                eq(2),
                eq("ICPDP"), // THIS IS THE CRITICAL ASSERTION
                eq(null),
                eq(null)
        );

        verify(response).sendRedirect("http://localhost:5173/oauth2/redirect?token=mock-jwt-token");
    }
}
