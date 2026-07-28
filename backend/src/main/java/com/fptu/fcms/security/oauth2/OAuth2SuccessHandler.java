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

// Lớp xử lý logic sau khi đăng nhập Google OAuth2 thành công.
// Đầu vào: Kết quả trả về từ Google (thông qua Authentication object chứa UserPrincipal).
// Đầu ra: Tính toán và cập nhật các phân quyền mới nhất (System Role, Club Role) từ cơ sở dữ liệu, sau đó phát hành chuỗi JWT chứa đầy đủ thông tin phân quyền và chuyển hướng người dùng về Frontend kèm theo JWT.
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final SystemRoleRepository systemRoleRepository;
    private final String frontendUrl;

    public OAuth2SuccessHandler(JwtTokenProvider tokenProvider,
                                UserService userService,
                                SystemRoleRepository systemRoleRepository,
                                @Value("${fcms.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.tokenProvider = tokenProvider;
        this.userService = userService;
        this.systemRoleRepository = systemRoleRepository;
        this.frontendUrl = normalizeFrontendUrl(frontendUrl);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // 1. Lấy ra cái thẻ UserPrincipal xịn xò mà chúng ta vừa nâng cấp
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        // 2. Lấy thông tin từ thẻ ra
        String email = userPrincipal.getEmail();
        Integer userId = userPrincipal.getUserId();
        Integer roleId = userPrincipal.getRoleId();

        // 3. [Batch 2] Resolve roleName từ SystemRole
        String roleName = systemRoleRepository.findById(roleId)
                .map(SystemRole::getRoleName)
                .orElse(null);

        // 4. [Batch 2] Resolve clubRole/clubId — tái dùng UserService.getClubRole()
        ClubRoleResponse clubRoleResponse = userService.getClubRole(userId);
        String clubRoleClaim = null;
        Integer clubIdClaim = null;
        if ("Leader".equals(clubRoleResponse.getRoleName()) || "ViceLeader".equals(clubRoleResponse.getRoleName())) {
            clubRoleClaim = clubRoleResponse.getRoleName();
            clubIdClaim = clubRoleResponse.getClubID();
        }

        // 5. Nhờ JwtTokenProvider phát hành một Token mới dựa trên thông tin này
        String token = tokenProvider.generateToken(email, userId, roleId, roleName, clubRoleClaim, clubIdClaim);

        // 6. Chuyển hướng về Frontend đã cấu hình kèm theo token.
        String targetUrl = frontendUrl + "/oauth2/redirect?token=" + token;

        // Xóa các thuộc tính rác trong phiên đăng nhập để tiết kiệm bộ nhớ
        clearAuthenticationAttributes(request);

        // Bắn URL về cho trình duyệt
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private static String normalizeFrontendUrl(String configuredUrl) {
        String resolvedUrl = configuredUrl == null || configuredUrl.isBlank()
                ? "http://localhost:5173"
                : configuredUrl.trim();
        return resolvedUrl.replaceAll("/+$", "");
    }
}
