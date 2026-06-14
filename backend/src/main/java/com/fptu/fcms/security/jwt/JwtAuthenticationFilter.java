package com.fptu.fcms.security.jwt;

import com.fptu.fcms.security.UserPrincipal; // <-- Import class vừa tạo
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
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.SemesterRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private SystemRoleRepository systemRoleRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private ClubRoleRepository clubRoleRepository;

    @Autowired
    private ClubMembershipRepository clubMembershipRepository;

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

                // 3. Lấy thông tin từ chuỗi jwt
                String email = tokenProvider.getEmailFromJwt(jwt);
                Integer userId = tokenProvider.getUserIdFromJwt(jwt); // Bổ sung lấy userID
                Integer roleId = tokenProvider.getRoleIdFromJwt(jwt); // Bổ sung lấy roleID

                // 4. Lấy Role từ DB để cấp quyền
                List<GrantedAuthority> authorities = new ArrayList<>();
                if (roleId != null) {
                    systemRoleRepository.findById(roleId).ifPresent(role -> {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleName()));
                    });
                }
                addActiveClubLeaderAuthority(userId, authorities);

                // 5. Đóng gói vào UserPrincipal
                UserPrincipal userPrincipal = new UserPrincipal(
                        userId,
                        email,
                        roleId,
                        authorities
                );

                // 5. Cấp thẻ xác thực với thông tin là đối tượng UserPrincipal
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userPrincipal,
                        null,
                        userPrincipal.getAuthorities()
                );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 6. Lưu thông tin vào SecurityContext
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

    private void addActiveClubLeaderAuthority(
            Integer userId,
            List<GrantedAuthority> authorities
    ) {
        if (userId == null) {
            return;
        }

        semesterRepository.findByIsActiveTrueAndIsDeletedFalse()
                .flatMap(activeSemester -> clubRoleRepository.findByRoleNameAndIsDeletedFalse("Leader")
                        .map(leaderRole -> clubMembershipRepository
                                .existsByUserIDAndSemesterIDAndClubRoleIDAndIsDeletedFalse(
                                        userId,
                                        activeSemester.getSemesterID(),
                                        leaderRole.getClubRoleID()
                                )))
                .filter(Boolean.TRUE::equals)
                .ifPresent(isLeader -> authorities.add(new SimpleGrantedAuthority("ROLE_Leader")));
    }
}
