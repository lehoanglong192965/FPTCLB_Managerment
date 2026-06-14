package com.fptu.fcms.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:day-la-mot-chuoi-bi-mat-rat-dai-de-ky-jwt-token-fptu-2026}")
    private String jwtSecret;

    @Value("${jwt.expiration:900000}")
    private long jwtExpirationDate;

    @Value("${jwt.refreshExpiration:604800000}")
    private long refreshTokenExpirationDate;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Tạo JWT Access Token đính kèm Custom Claims (userID, roleID)
    public String generateToken(String email, Integer userId, Integer roleId) {
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDate);

        return Jwts.builder()
                .setSubject(email)
                .claim("userID", userId)
                .claim("roleID", roleId)
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
                .setIssuedAt(currentDate)
                .setExpiration(expireDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Trích xuất Email (Subject) từ Token
    public String getEmailFromJwt(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Xác thực tính toàn vẹn và hạn sử dụng của Token
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            System.err.println("Xác thực JWT thất bại: " + ex.getMessage());
        }
        return false;
    }
    // Trích xuất userID từ Token
    public Integer getUserIdFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("userID", Integer.class);
    }

    // Trích xuất roleID từ Token
    public Integer getRoleIdFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("roleID", Integer.class);
    }


}