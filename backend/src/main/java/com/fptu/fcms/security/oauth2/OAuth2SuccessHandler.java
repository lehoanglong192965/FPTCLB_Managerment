package com.fptu.fcms.security.oauth2;

import com.fptu.fcms.dto.response.ClubRoleResponse;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import com.fptu.fcms.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final SystemRoleRepository systemRoleRepository;
    private final String frontendUrl;

    public OAuth2SuccessHandler(JwtTokenProvider tokenProvider,
                                UserService userService,
                                SystemRoleRepository systemRoleRepository,
                                @Value("${fcms.frontend-url}") String frontendUrl) {
        this.tokenProvider = tokenProvider;
        this.userService = userService;
        this.systemRoleRepository = systemRoleRepository;
        this.frontendUrl = normalizeFrontendUrl(frontendUrl);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Integer userId = principal.getUserId();
        Integer roleId = principal.getRoleId();

        String roleName = systemRoleRepository.findById(roleId)
                .map(SystemRole::getRoleName)
                .orElse(null);

        ClubRoleResponse clubRole = userService.getClubRole(userId);
        String clubRoleClaim = null;
        Integer clubIdClaim = null;
        if (clubRole != null
                && ("Leader".equals(clubRole.getRoleName())
                || "ViceLeader".equals(clubRole.getRoleName()))) {
            clubRoleClaim = clubRole.getRoleName();
            clubIdClaim = clubRole.getClubID();
        }

        String token = tokenProvider.generateToken(
                principal.getEmail(), userId, roleId, roleName, clubRoleClaim, clubIdClaim);

        // A URL fragment is not sent to the backend or referrer. The frontend removes it
        // from browser history immediately after reading it.
        String targetUrl = frontendUrl + "/oauth2/redirect#token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private static String normalizeFrontendUrl(String configuredUrl) {
        if (configuredUrl == null || configuredUrl.isBlank()) {
            throw new IllegalArgumentException("fcms.frontend-url must not be blank");
        }
        return configuredUrl.trim().replaceAll("/+$", "");
    }
}