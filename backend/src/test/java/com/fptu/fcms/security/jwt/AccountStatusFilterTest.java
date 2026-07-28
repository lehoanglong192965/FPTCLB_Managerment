package com.fptu.fcms.security.jwt;

import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccountStatusFilterTest {

    private static final String EMAIL = "student@fpt.edu.vn";

    @Mock
    private UserRepository userRepository;

    private AccountStatusFilter filter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new AccountStatusFilter(userRepository);
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/notifications");
        response = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(Instant tokenIssuedAt) {
        UserPrincipal principal = new UserPrincipal(
                1, EMAIL, 3, "Student", null, null,
                List.of(new SimpleGrantedAuthority("ROLE_Student")));
        principal.setIssuedAt(tokenIssuedAt);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private UserAccount user(String status, boolean deleted) {
        UserAccount user = new UserAccount();
        user.setUserID(1);
        user.setEmail(EMAIL);
        user.setAccountStatus(status);
        user.setIsDeleted(deleted);
        return user;
    }

    @Test
    @DisplayName("P1-BE-1: tài khoản bị xoá mềm không đi tiếp được")
    void softDeletedAccountIsBlocked() throws Exception {
        authenticateAs(Instant.now());
        // Đây là mấu chốt: findByEmailAndIsDeletedFalse sẽ trả rỗng cho user này và
        // filter cũ im lặng cho qua. Query mới phải nhìn thấy bản ghi để chặn.
        when(userRepository.findAnyByEmailIgnoreCase(EMAIL))
                .thenReturn(Optional.of(user("Active", true)));

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("Tài khoản Suspended vẫn bị chặn như trước")
    void suspendedAccountIsBlocked() throws Exception {
        authenticateAs(Instant.now());
        when(userRepository.findAnyByEmailIgnoreCase(EMAIL))
                .thenReturn(Optional.of(user("Suspended", false)));

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("Tài khoản PENDING chưa xác thực OTP cũng bị chặn")
    void pendingAccountIsBlocked() throws Exception {
        authenticateAs(Instant.now());
        when(userRepository.findAnyByEmailIgnoreCase(EMAIL))
                .thenReturn(Optional.of(user("PENDING", false)));

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("Tài khoản Active đi tiếp bình thường")
    void activeAccountPasses() throws Exception {
        authenticateAs(Instant.now());
        when(userRepository.findAnyByEmailIgnoreCase(EMAIL))
                .thenReturn(Optional.of(user("Active", false)));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    @DisplayName("Request ẩn danh tới endpoint công khai không bị đụng tới, không query DB")
    void anonymousRequestIsUntouched() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new AnonymousAuthenticationToken("key", "anonymousUser",
                        List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("P1-BE-2: token cấp trước lúc quyền thay đổi bị từ chối")
    void tokenIssuedBeforeRoleChangeIsRejected() throws Exception {
        authenticateAs(Instant.now().minusSeconds(3600));
        UserAccount user = user("Active", false);
        user.setTokenInvalidatedAt(LocalDateTime.now().minusMinutes(5));
        when(userRepository.findAnyByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));

        filter.doFilterInternal(request, response, chain);

        // 401 để axios interceptor tự gọi /auth/refresh lấy claim mới
        assertThat(response.getStatus()).isEqualTo(401);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("P1-BE-2: token cấp SAU lúc quyền thay đổi vẫn dùng được")
    void tokenIssuedAfterRoleChangePasses() throws Exception {
        authenticateAs(Instant.now());
        UserAccount user = user("Active", false);
        user.setTokenInvalidatedAt(LocalDateTime.now().minusMinutes(30));
        when(userRepository.findAnyByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    @DisplayName("Endpoint /api/auth/** được tha để user còn gọi được /auth/refresh")
    void authEndpointsAreSkipped() {
        MockHttpServletRequest refreshRequest = new MockHttpServletRequest();
        refreshRequest.setRequestURI("/api/auth/refresh");

        assertThat(filter.shouldNotFilter(refreshRequest)).isTrue();
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    @DisplayName("Email không có bản ghi nào thì filter không chặn — để @PreAuthorize tự quyết")
    void missingAccountIsLeftToAuthorization() throws Exception {
        authenticateAs(Instant.now());
        when(userRepository.findAnyByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
