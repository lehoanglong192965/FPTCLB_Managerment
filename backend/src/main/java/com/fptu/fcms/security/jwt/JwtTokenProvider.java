package com.fptu.fcms.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationDate;

    @Value("${jwt.refreshExpiration:604800000}")
    private long refreshTokenExpirationDate;

    /** Claim phân biệt loại token. Thiếu nó thì refresh token dùng thay được access token. */
    public static final String CLAIM_TOKEN_TYPE = "typ";
    public static final String TOKEN_TYPE_ACCESS = "access";
    public static final String TOKEN_TYPE_REFRESH = "refresh";

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Tạo JWT Access Token đính kèm Custom Claims (userID, roleID, roleName, clubRole, clubId)
    public String generateToken(String email, Integer userId, Integer roleId,
                                String roleName, String clubRole, Integer clubId) {
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDate);

        JwtBuilder builder = Jwts.builder()
                .setSubject(email)
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
                .claim("userID", userId)
                .claim("roleID", roleId)
                .claim("roleName", roleName);

        // clubRole và clubId chỉ set khi khác null
        if (clubRole != null) {
            builder.claim("clubRole", clubRole);
        }
        if (clubId != null) {
            builder.claim("clubId", clubId);
        }

        return builder
                .setIssuedAt(currentDate)
                .setExpiration(expireDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Tạo Refresh Token (Thời gian sống lâu hơn, ít thông tin hơn)
    public String generateRefreshToken(String email) {
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + refreshTokenExpirationDate);

        return Jwts.builder()
                .setSubject(email)
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH)
                .setIssuedAt(currentDate)
                .setExpiration(expireDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Giải mã token một lần và trả về toàn bộ claim. Các getter bên dưới đều gọi hàm này —
     * trước đây mỗi getter tự dựng parser riêng nên một request phải verify chữ ký 6 lần.
     */
    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .setAllowedClockSkewSeconds(60) // Cho phép lệch 60 giây
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Token có đúng là access token không. Refresh token ký cùng khoá, cùng thuật toán nên
     * validateToken() vẫn trả true cho nó — chỉ claim này mới phân biệt được.
     */
    public boolean isAccessToken(Claims claims) {
        return TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    public boolean isRefreshToken(Claims claims) {
        return TOKEN_TYPE_REFRESH.equals(claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    // Trích xuất Email (Subject) từ Token
    public String getEmailFromJwt(String token) {
        return parseClaims(token).getSubject();
    }

    // Xác thực tính toàn vẹn và hạn sử dụng của Token
    public boolean validateToken(String authToken) {
        try {
            parseClaims(authToken);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("JWT đã hết hạn: {}", ex.getMessage());
        } catch (SignatureException ex) {
            log.warn("Chữ ký JWT không hợp lệ: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.warn("JWT không đúng định dạng: {}", ex.getMessage());
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Xác thực JWT thất bại: {}", ex.getMessage());
        }
        return false;
    }
    // Trích xuất userID từ Token
    public Integer getUserIdFromJwt(String token) {
        return parseClaims(token).get("userID", Integer.class);
    }

    // Trích xuất roleID từ Token
    public Integer getRoleIdFromJwt(String token) {
        return parseClaims(token).get("roleID", Integer.class);
    }

    // [MỚI] Trích xuất roleName từ Token
    public String getRoleNameFromJwt(String token) {
        return parseClaims(token).get("roleName", String.class);
    }

    // [MỚI] Trích xuất clubRole từ Token (nullable)
    public String getClubRoleFromJwt(String token) {
        return parseClaims(token).get("clubRole", String.class);
    }

    // [MỚI] Trích xuất clubId từ Token (nullable)
    public Integer getClubIdFromJwt(String token) {
        return parseClaims(token).get("clubId", Integer.class);
    }

}