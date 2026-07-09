package com.fptu.fcms.security.jwt;

import com.fptu.fcms.security.UserPrincipal;
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
import java.util.ArrayList;
import java.util.List;
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

                // 3. Lấy thông tin từ chuỗi jwt — ĐỌC CLAIM TRỰC TIẾP, 0 QUERY DB
                String email = tokenProvider.getEmailFromJwt(jwt);
                Integer userId = tokenProvider.getUserIdFromJwt(jwt);
                Integer roleId = tokenProvider.getRoleIdFromJwt(jwt);
                String roleName = tokenProvider.getRoleNameFromJwt(jwt);
                String clubRole = tokenProvider.getClubRoleFromJwt(jwt);
                Integer clubId = tokenProvider.getClubIdFromJwt(jwt);

                // 4. Tạo authorities từ claim — KHÔNG query DB
                List<GrantedAuthority> authorities = new ArrayList<>();
                if (roleName != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
                }
                if (clubRole != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + clubRole));
                }

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
}
