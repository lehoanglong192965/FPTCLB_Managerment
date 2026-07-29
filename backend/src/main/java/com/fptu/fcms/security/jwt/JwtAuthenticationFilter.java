package com.fptu.fcms.security.jwt;

import com.fptu.fcms.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            // 1. Lấy JWT từ request
            String jwt = getJwtFromRequest(request);

            // 2. Nếu có token và token đó hợp lệ
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {

                // Cổng bảo mật & Ánh xạ Claim:
                // Lớp này chịu trách nhiệm trích xuất thông tin người dùng (roleName, clubRole, clubId) trực tiếp từ chuỗi JWT.
                // Đầu vào: Chuỗi JWT đã được xác thực thành công.
                // Đầu ra: Trích xuất các claim để tạo đối tượng UserPrincipal, quá trình này hoàn toàn không cần truy vấn database (0 SELECT), giúp tối ưu hiệu năng.
                // 3. Giải mã claim MỘT lần — đọc trực tiếp, 0 QUERY DB
                Claims claims = tokenProvider.parseClaims(jwt);

                // 3b. Chỉ access token mới được dùng làm phiên đăng nhập. Refresh token ký cùng
                // khoá nên validateToken() ở trên vẫn cho qua, nhưng nó KHÔNG mang claim quyền —
                // chấp nhận nó sẽ tạo ra principal rỗng (userId/roleId = null, authorities rỗng)
                // vừa lọt các @PreAuthorize("isAuthenticated()") vừa gây NPE ở tầng service.
                if (!tokenProvider.isAccessToken(claims)) {
                    logger.warn("Từ chối token không phải access token trên " + request.getRequestURI());
                    filterChain.doFilter(request, response);
                    return;
                }

                String email = claims.getSubject();
                Integer userId = claims.get("userID", Integer.class);
                Integer roleId = claims.get("roleID", Integer.class);
                String roleName = claims.get("roleName", String.class);
                String clubRole = claims.get("clubRole", String.class);
                Integer clubId = claims.get("clubId", Integer.class);

                // 4. Tạo authorities từ claim — KHÔNG query DB
                Set<GrantedAuthority> authorities = new LinkedHashSet<>();
                addRoleAuthorities(authorities, roleName);
                addRoleAuthorities(authorities, clubRole);
                addSystemRoleIdAuthorities(authorities, roleId);

                // 5. Đóng gói vào UserPrincipal (Constructor mới với đầy đủ claim)
                UserPrincipal userPrincipal = new UserPrincipal(
                        userId,
                        email,
                        roleId,
                        roleName,
                        clubRole,
                        clubId,
                        authorities
                );
                // AccountStatusFilter cần iat để đối chiếu với mốc vô hiệu hoá quyền,
                // truyền qua principal để nó khỏi phải giải mã token lần nữa.
                if (claims.getIssuedAt() != null) {
                    userPrincipal.setIssuedAt(claims.getIssuedAt().toInstant());
                }

                // 6. Cấp thẻ xác thực với thông tin là đối tượng UserPrincipal
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userPrincipal,
                        null,
                        userPrincipal.getAuthorities()
                );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 7. Lưu thông tin vào SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Không thể thiết lập xác thực người dùng trong Security Context", ex);
        }

        // Cho request đi tiếp
        filterChain.doFilter(request, response);
    }

    // Hàm phụ trợ để bóc tách chuỗi Bearer Token từ Header
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void addRoleAuthorities(Set<GrantedAuthority> authorities, String roleName) {
        if (!StringUtils.hasText(roleName)) {
            return;
        }

        String trimmedRoleName = roleName.trim();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + trimmedRoleName));

        String normalizedRoleName = trimmedRoleName
                .replaceAll("[^A-Za-z0-9]", "")
                .toUpperCase(Locale.ROOT);

        if (normalizedRoleName.contains("ICPDP")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ICPDP"));
            return;
        }

        switch (normalizedRoleName) {
            case "ADMIN", "ADMINISTRATOR" -> authorities.add(new SimpleGrantedAuthority("ROLE_Admin"));
            case "STUDENT" -> authorities.add(new SimpleGrantedAuthority("ROLE_Student"));
            case "MEMBER" -> authorities.add(new SimpleGrantedAuthority("ROLE_Member"));
            case "LEADER" -> authorities.add(new SimpleGrantedAuthority("ROLE_Leader"));
            case "VICELEADER" -> authorities.add(new SimpleGrantedAuthority("ROLE_ViceLeader"));
            default -> {
                // Keep the original authority above for custom roles.
            }
        }
    }

    private void addSystemRoleIdAuthorities(Set<GrantedAuthority> authorities, Integer roleId) {
        if (roleId == null) {
            return;
        }
        if (roleId == 1) {
            authorities.add(new SimpleGrantedAuthority("ROLE_Admin"));
        } else if (roleId == 2) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ICPDP"));
        }
    }
}
