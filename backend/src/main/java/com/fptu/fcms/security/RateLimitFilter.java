package com.fptu.fcms.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // Limit: 15 requests per hour for guest WRITE APIs (đăng ký, verify/resend OTP).
        // GET xem trạng thái không bị đếm — brute-force OTP đã có khoá riêng trong service (OTP_LOCKED).
        return Bucket.builder()
                .addLimit(Bandwidth.classic(15, Refill.intervally(15, Duration.ofHours(1))))
                .build();
    }

    private Bucket createNewBucketForFeedback() {
        // Limit: 10 requests per minute for feedback APIs
        return Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1))))
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIP(request);

        boolean isGuestWrite = (path.contains("/guest-registrations") || path.contains("/otp"))
                && !"GET".equalsIgnoreCase(request.getMethod());

        if (isGuestWrite) {
            // SEC-01: Rate limit Guest registration + OTP endpoints (chỉ thao tác ghi)
            Bucket bucket = cache.computeIfAbsent(clientIp + "-guest", k -> createNewBucket());
            if (!bucket.tryConsume(1)) {
                writeRateLimitResponse(response, "Quá nhiều yêu cầu. Vui lòng thử lại sau.");
                return;
            }
        } else if (path.contains("/feedback")) {
            // SEC-01: Rate limit feedback endpoints separately
            Bucket bucket = cache.computeIfAbsent(clientIp + "-feedback", k -> createNewBucketForFeedback());
            if (!bucket.tryConsume(1)) {
                writeRateLimitResponse(response, "Quá nhiều yêu cầu feedback. Vui lòng thử lại sau.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeRateLimitResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        // Bắt buộc charset UTF-8 — thiếu nó message tiếng Việt bị mojibake ("Quá nhi?u yêu c?u")
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\": \"RATE_LIMIT_EXCEEDED\", \"message\": \"" + message + "\"}");
    }

    private String getClientIP(HttpServletRequest request) {
        // Secure IP extraction: Relies on Spring Boot's server.forward-headers-strategy=framework
        // rather than manual parsing which is vulnerable to X-Forwarded-For spoofing.
        return request.getRemoteAddr();
    }
}
