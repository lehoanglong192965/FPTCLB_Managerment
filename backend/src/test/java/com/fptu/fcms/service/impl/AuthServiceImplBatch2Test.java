package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.response.AuthResponse;
import com.fptu.fcms.dto.response.ClubRoleResponse;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.AllowedEmailRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.OTPService;
import com.fptu.fcms.service.UserService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * TC1-06, TC1-07, TC1-08: Auth login/refresh token claim tests.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplBatch2Test {

    private AuthServiceImpl authService;

    // Dùng JwtTokenProvider thật (không mock) để decode token thật
    private JwtTokenProvider jwtTokenProvider;

    @Mock private UserRepository userRepository;
    @Mock private AllowedEmailRepository allowedEmailRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private OTPService otpService;
    @Mock private EmailService emailService;
    @Mock private UserService userService;
    @Mock private SystemRoleRepository systemRoleRepository;

    private static final String SECRET = "day-la-mot-chuoi-bi-mat-rat-dai-de-ky-jwt-token-fptu-2026";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationDate", 86400000L);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpirationDate", 604800000L);

        authService = new AuthServiceImpl(
                jwtTokenProvider,
                userRepository,
                allowedEmailRepository,
                passwordEncoder,
                otpService,
                emailService,
                userService,
                systemRoleRepository
        );
    }

    private Claims parseToken(String token) {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .setAllowedClockSkewSeconds(60)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private UserAccount buildUser(String email, Integer userId, Integer roleId) {
        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setUserID(userId);
        user.setRoleID(roleId);
        user.setPassword("$2a$10$hashedPassword");
        user.setAccountStatus("Active");
        user.setIsDeleted(false);
        return user;
    }

    @Test
    @DisplayName("TC1-06: Login ViceLeader — getClubRole() gọi 1 lần, token có clubRole='ViceLeader' và clubId đúng")
    void tc1_06_loginViceLeaderClaimCorrect() {
        // Arrange
        String email = "viceleader@fpt.edu.vn";
        Integer userId = 10;
        Integer roleId = 3;
        Integer clubId = 5;
        UserAccount user = buildUser(email, userId, roleId);

        when(userRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass123", user.getPassword())).thenReturn(true);

        // SystemRole resolve
        SystemRole studentRole = new SystemRole();
        studentRole.setRoleName("Student");
        when(systemRoleRepository.findById(roleId)).thenReturn(Optional.of(studentRole));

        // ClubRole resolve — ViceLeader
        ClubRoleResponse clubRoleResponse = new ClubRoleResponse(2, clubId, "ViceLeader");
        when(userService.getClubRole(userId)).thenReturn(clubRoleResponse);

        // Act
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword("pass123");
        AuthResponse response = authService.login(loginRequest);

        // Assert
        assertThat(response.getToken()).isNotBlank();

        // Verify getClubRole được gọi đúng 1 lần
        verify(userService, times(1)).getClubRole(userId);

        // Decode token và check claims
        Claims claims = parseToken(response.getToken());
        assertThat(claims.get("roleName", String.class)).isEqualTo("Student");
        assertThat(claims.get("clubRole", String.class)).isEqualTo("ViceLeader");
        assertThat(claims.get("clubId", Integer.class)).isEqualTo(clubId);
        assertThat(claims.get("userID", Integer.class)).isEqualTo(userId);
        assertThat(claims.get("roleID", Integer.class)).isEqualTo(roleId);
    }

    @Test
    @DisplayName("TC1-07: Login Member thường — clubRole=null, clubId=null (không phải chuỗi 'Member')")
    void tc1_07_loginMemberClubRoleIsNull() {
        // Arrange
        String email = "member@fpt.edu.vn";
        Integer userId = 99;
        Integer roleId = 3;
        UserAccount user = buildUser(email, userId, roleId);

        when(userRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass456", user.getPassword())).thenReturn(true);

        SystemRole studentRole = new SystemRole();
        studentRole.setRoleName("Student");
        when(systemRoleRepository.findById(roleId)).thenReturn(Optional.of(studentRole));

        // ClubRole resolve — Member (roleName="Member", clubID=null)
        ClubRoleResponse clubRoleResponse = new ClubRoleResponse(3, null, "Member");
        when(userService.getClubRole(userId)).thenReturn(clubRoleResponse);

        // Act
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword("pass456");
        AuthResponse response = authService.login(loginRequest);

        // Assert — clubRole và clubId PHẢI là null, KHÔNG PHẢI "Member"
        Claims claims = parseToken(response.getToken());
        assertThat(claims.get("clubRole")).isNull();
        assertThat(claims.get("clubId")).isNull();
        assertThat(claims.get("roleName", String.class)).isEqualTo("Student");
    }

    @Test
    @DisplayName("TC1-07 (ClubManager variant): ClubManager cũng bị map clubRole=null")
    void tc1_07_loginClubManagerClubRoleIsNull() {
        // Arrange
        String email = "manager@fpt.edu.vn";
        Integer userId = 55;
        Integer roleId = 3;
        UserAccount user = buildUser(email, userId, roleId);

        when(userRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass789", user.getPassword())).thenReturn(true);

        SystemRole studentRole = new SystemRole();
        studentRole.setRoleName("Student");
        when(systemRoleRepository.findById(roleId)).thenReturn(Optional.of(studentRole));

        // ClubRole resolve — ClubManager
        ClubRoleResponse clubRoleResponse = new ClubRoleResponse(5, 3, "ClubManager");
        when(userService.getClubRole(userId)).thenReturn(clubRoleResponse);

        // Act
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword("pass789");
        AuthResponse response = authService.login(loginRequest);

        // Assert — ClubManager cũng map null, KHÔNG được set clubRole="ClubManager"
        Claims claims = parseToken(response.getToken());
        assertThat(claims.get("clubRole")).isNull();
        assertThat(claims.get("clubId")).isNull();
    }

    @Test
    @DisplayName("TC1-08: refreshToken() sinh token với đầy đủ claim mới (không chỉ login())")
    void tc1_08_refreshTokenContainsNewClaims() {
        // Arrange
        String email = "leader@fpt.edu.vn";
        Integer userId = 42;
        Integer roleId = 3;
        Integer clubId = 7;
        UserAccount user = buildUser(email, userId, roleId);

        // Tạo refresh token hợp lệ
        String refreshToken = jwtTokenProvider.generateRefreshToken(email);

        when(userRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(user));

        SystemRole studentRole = new SystemRole();
        studentRole.setRoleName("Student");
        when(systemRoleRepository.findById(roleId)).thenReturn(Optional.of(studentRole));

        // ClubRole resolve — Leader
        ClubRoleResponse clubRoleResponse = new ClubRoleResponse(1, clubId, "Leader");
        when(userService.getClubRole(userId)).thenReturn(clubRoleResponse);

        // Act
        AuthResponse response = authService.refreshToken(refreshToken);

        // Assert — Token mới phải có đầy đủ claim
        Claims claims = parseToken(response.getToken());
        assertThat(claims.get("userID", Integer.class)).isEqualTo(userId);
        assertThat(claims.get("roleID", Integer.class)).isEqualTo(roleId);
        assertThat(claims.get("roleName", String.class)).isEqualTo("Student");
        assertThat(claims.get("clubRole", String.class)).isEqualTo("Leader");
        assertThat(claims.get("clubId", Integer.class)).isEqualTo(clubId);

        // Verify getClubRole được gọi trong refreshToken path
        verify(userService, times(1)).getClubRole(userId);
    }
}
