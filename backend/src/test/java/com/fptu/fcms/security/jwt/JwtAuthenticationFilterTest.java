package com.fptu.fcms.security.jwt;

import com.fptu.fcms.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * TC1-04: Verify JwtAuthenticationFilter không query DB.
 *
 * Cách chứng minh:
 *   1. Reflection: kiểm tra class không còn field nào có type chứa "Repository"
 *   2. Functional: dùng JwtTokenProvider THẬT (không mock) + token thật,
 *      filter tạo đúng UserPrincipal từ claim mà không cần bất kỳ Repository nào.
 *
 * LƯU Ý: Mockito trên Java 26 không mock được concrete class (ByteBuddy chưa hỗ trợ Java 26).
 * Nên test này dùng JwtTokenProvider thật và Spring MockHttpServletRequest/Response.
 */
class JwtAuthenticationFilterTest {

    private JwtAuthenticationFilter filter;
    private JwtTokenProvider tokenProvider;

    private static final String SECRET = "day-la-mot-chuoi-bi-mat-rat-dai-de-ky-jwt-token-fptu-2026";

    @BeforeEach
    void setUp() {
        // Tạo JwtTokenProvider thật
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationDate", 86400000L);
        ReflectionTestUtils.setField(tokenProvider, "refreshTokenExpirationDate", 604800000L);

        // Tạo filter và inject tokenProvider thật
        filter = new JwtAuthenticationFilter();
        ReflectionTestUtils.setField(filter, "tokenProvider", tokenProvider);

        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("TC1-04: JwtAuthenticationFilter không có dependency Repository — 0 SELECT DB")
    void tc1_04_filterHasNoRepositoryDependency() {
        // Verify bằng reflection: không có field nào có type chứa "Repository"
        java.lang.reflect.Field[] fields = JwtAuthenticationFilter.class.getDeclaredFields();
        for (java.lang.reflect.Field field : fields) {
            String typeName = field.getType().getSimpleName();
            assertThat(typeName)
                    .as("Field '%s' có type '%s' — filter không được dependency Repository",
                            field.getName(), typeName)
                    .doesNotContain("Repository");
        }

        // Verify filter chỉ có đúng 1 dependency: tokenProvider
        long dependencyCount = java.util.Arrays.stream(JwtAuthenticationFilter.class.getDeclaredFields())
                .filter(f -> !java.lang.reflect.Modifier.isStatic(f.getModifiers()))
                .count();
        assertThat(dependencyCount)
                .as("Filter chỉ nên có 1 dependency (tokenProvider)")
                .isEqualTo(1);
    }

    @Test
    @DisplayName("TC1-04 (functional): Filter tạo đúng UserPrincipal từ JWT claim — Leader case")
    void tc1_04_filterCreatesUserPrincipalFromClaimsOnly() throws Exception {
        // Arrange — tạo token thật chứa đủ claim
        String token = tokenProvider.generateToken(
                "leader@fpt.edu.vn", 42, 3, "Student", "Leader", 7);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert — SecurityContext phải có authentication
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        assertThat(principal.getUserId()).isEqualTo(42);
        assertThat(principal.getEmail()).isEqualTo("leader@fpt.edu.vn");
        assertThat(principal.getRoleId()).isEqualTo(3);
        assertThat(principal.getRoleName()).isEqualTo("Student");
        assertThat(principal.getClubRole()).isEqualTo("Leader");
        assertThat(principal.getClubId()).isEqualTo(7);

        // Verify authorities
        var authorityNames = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .toList();
        assertThat(authorityNames).contains("ROLE_Student", "ROLE_Leader");

        // Verify filterChain tiếp tục
        verify(filterChain).doFilter(request, response);

        // QUAN TRỌNG: Không có mock Repository nào — filter chỉ dùng tokenProvider thật.
        // Nếu filter còn dependency Repository, ReflectionTestUtils.setField sẽ thiếu
        // và NullPointerException sẽ xảy ra khi filter cố gọi repository.
    }

    @Test
    @DisplayName("TC1-04 (null clubRole): Filter xử lý đúng khi clubRole/clubId null — Member thường")
    void tc1_04_filterHandlesNullClubRole() throws Exception {
        // Arrange — Member thường, clubRole = null
        String token = tokenProvider.generateToken(
                "member@fpt.edu.vn", 99, 3, "Student", null, null);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        assertThat(principal.getClubRole()).isNull();
        assertThat(principal.getClubId()).isNull();

        // Authority chỉ có ROLE_Student, không có ROLE_null hay ROLE_Member
        var authorityNames = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .toList();
        assertThat(authorityNames).containsExactly("ROLE_Student");
        assertThat(authorityNames).doesNotContain("ROLE_Member", "ROLE_null");
    }
}
