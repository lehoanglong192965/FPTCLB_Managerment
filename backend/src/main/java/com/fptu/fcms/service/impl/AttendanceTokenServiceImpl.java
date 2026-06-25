package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.AttendanceTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Service
public class AttendanceTokenServiceImpl implements AttendanceTokenService {

    @Value("${jwt.secret:day-la-mot-chuoi-bi-mat-rat-dai-de-ky-jwt-token-fptu-2026}")
    private String jwtSecret;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public String generateQrToken(Integer eventId, Integer userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 30_000L);
        String nonce = UUID.randomUUID().toString();

        return Jwts.builder()
                .setSubject("attendance-qr")
                .claim("eventId", eventId)
                .claim("userId", userId)
                .claim("nonce", nonce)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    @Override
    public AttendanceTokenClaims parseAndValidateQrToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return new AttendanceTokenClaims(
                claims.get("eventId", Integer.class),
                claims.get("userId", Integer.class),
                claims.get("nonce", String.class)
        );
    }
}
