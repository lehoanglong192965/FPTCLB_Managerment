package com.fptu.fcms.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC1-05: Sinh token bằng generateToken(), decode payload, assert đủ claim.
 */
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private static final String SECRET = "day-la-mot-chuoi-bi-mat-rat-dai-de-ky-jwt-token-fptu-2026";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationDate", 86400000L);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpirationDate", 604800000L);
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

    @Test
    @DisplayName("TC1-05: Token chứa đủ userID, roleID, roleName, clubRole, clubId khi tất cả khác null")
    void tc1_05_tokenContainsAllClaims() {
        // Arrange
        String email = "leader@fpt.edu.vn";
        Integer userId = 42;
        Integer roleId = 3;
        String roleName = "Student";
        String clubRole = "Leader";
        Integer clubId = 7;

        // Act
        String token = jwtTokenProvider.generateToken(email, userId, roleId, roleName, clubRole, clubId);

        // Assert — decode raw claims
        Claims claims = parseToken(token);
        assertThat(claims.getSubject()).isEqualTo(email);
        assertThat(claims.get("userID", Integer.class)).isEqualTo(userId);
        assertThat(claims.get("roleID", Integer.class)).isEqualTo(roleId);
        assertThat(claims.get("roleName", String.class)).isEqualTo(roleName);
        assertThat(claims.get("clubRole", String.class)).isEqualTo(clubRole);
        assertThat(claims.get("clubId", Integer.class)).isEqualTo(clubId);

        // Assert — via getter methods
        assertThat(jwtTokenProvider.getUserIdFromJwt(token)).isEqualTo(userId);
        assertThat(jwtTokenProvider.getRoleIdFromJwt(token)).isEqualTo(roleId);
        assertThat(jwtTokenProvider.getRoleNameFromJwt(token)).isEqualTo(roleName);
        assertThat(jwtTokenProvider.getClubRoleFromJwt(token)).isEqualTo(clubRole);
        assertThat(jwtTokenProvider.getClubIdFromJwt(token)).isEqualTo(clubId);
    }

    @Test
    @DisplayName("TC1-05 (null variant): clubRole và clubId có thể null trong token")
    void tc1_05_tokenWithNullClubFields() {
        // Arrange — Member thường, không giữ chức vụ CLB
        String email = "member@fpt.edu.vn";
        Integer userId = 99;
        Integer roleId = 3;
        String roleName = "Student";

        // Act
        String token = jwtTokenProvider.generateToken(email, userId, roleId, roleName, null, null);

        // Assert
        Claims claims = parseToken(token);
        assertThat(claims.get("userID", Integer.class)).isEqualTo(userId);
        assertThat(claims.get("roleID", Integer.class)).isEqualTo(roleId);
        assertThat(claims.get("roleName", String.class)).isEqualTo(roleName);
        assertThat(claims.get("clubRole")).isNull();
        assertThat(claims.get("clubId")).isNull();

        // Assert — via getter methods
        assertThat(jwtTokenProvider.getClubRoleFromJwt(token)).isNull();
        assertThat(jwtTokenProvider.getClubIdFromJwt(token)).isNull();
    }
}
