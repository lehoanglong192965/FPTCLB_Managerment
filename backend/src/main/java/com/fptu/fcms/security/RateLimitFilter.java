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
        // Limit: 5 requests per day for guest APIs
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofDays(1))))
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

        if (path.startsWith("/api/guest")) {
            Bucket bucket = cache.computeIfAbsent(clientIp + "-guest", k -> createNewBucket());
            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"RATE_LIMIT_EXCEEDED\"}");
                return;
            }
        } else if (path.startsWith("/api/feedback")) {
            Bucket bucket = cache.computeIfAbsent(clientIp + "-feedback", k -> createNewBucketForFeedback());
            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"RATE_LIMIT_EXCEEDED\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        // Secure IP extraction: Relies on Spring Boot's server.forward-headers-strategy=framework
        // rather than manual parsing which is vulnerable to X-Forwarded-For spoofing.
        return request.getRemoteAddr();
    }
}
