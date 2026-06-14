package com.fptu.fcms.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value; // 1. Đổi sang Import của Spring
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    // 2. Đặt @Value trực tiếp lên field
    // 3. Bỏ từ khóa "final"
    @Value("${jwt.secret}")
    private String SECRET_KEY;

    public String generateToken(String email) {

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 900000)) // Token sống 15p
                .signWith(
                        SignatureAlgorithm.HS256,
                        SECRET_KEY
                )
                .compact();
    }
}