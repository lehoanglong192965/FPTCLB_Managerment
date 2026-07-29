package com.fptu.fcms.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    /**
     * Endpoint nhận secret của người dùng (mật khẩu / OTP) — đích ngắm brute-force.
     * So khớp CHÍNH XÁC cả đường dẫn: contains("/otp") KHÔNG match "/verify-otp"
     * (ký tự trước "otp" là dấu gạch nối), nên các endpoint này từng lọt lưới hoàn toàn.
     */
    private static final Set<String> CREDENTIAL_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/verify-otp",
            "/api/auth/reset-password"
    );

    /**
     * Endpoint phát sinh OTP mới. Chặn ở đây để tránh spam email, đồng thời khoá vòng lặp
     * "đoán sai 4 lần → xin mã mới → attempts về 0" vốn có thể vô hiệu hoá giới hạn MAX_ATTEMPTS.
     */
    private static final Set<String> OTP_ISSUING_PATHS = Set.of(
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/resend-otp",
            "/api/auth/resend-forgot-otp"
    );

    /** Bucket không được chạm tới quá lâu thì xoá, nếu không map phình theo số IP đã từng gọi. */
    private static final Duration IDLE_EVICTION = Duration.ofHours(2);

    private final Map<String, Entry> cache = new ConcurrentHashMap<>();

    private static final class Entry {
        private final Bucket bucket;
        private volatile long lastAccessNanos;

        private Entry(Bucket bucket) {
            this.bucket = bucket;
            this.lastAccessNanos = System.nanoTime();
        }
    }

    private Bucket createCredentialBucket() {
        // 20 request / 10 phút. Nới tay vì cả campus FPTU dùng chung IP NAT, nhưng vẫn
        // biến việc quét 000000-999999 trong 10 phút hiệu lực của OTP thành bất khả thi.
        return Bucket.builder()
                .addLimit(Bandwidth.classic(20, Refill.intervally(20, Duration.ofMinutes(10))))
                .build();
    }

    private Bucket createOtpIssuingBucket() {
        // 10 request / 15 phút: đủ cho người dùng thật bấm "gửi lại mã" vài lần.
        return Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(15))))
                .build();
    }

    private Bucket createNewBucket() {
        // Limit: 15 requests per hour for guest WRITE APIs (đăng ký, verify/resend OTP khách).
        // GET xem trạng thái không bị đếm.
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

        String path = normalizePath(request.getRequestURI());
        String clientIp = getClientIP(request);
        boolean isWrite = !"GET".equalsIgnoreCase(request.getMethod());

        if (CREDENTIAL_PATHS.contains(path)) {
            // SEC-01: Chặn brute-force mật khẩu và mã OTP
            if (!tryConsume(clientIp + "-credential", this::createCredentialBucket)) {
                writeRateLimitResponse(response, "Quá nhiều lần thử. Vui lòng thử lại sau ít phút.");
                return;
            }
        } else if (OTP_ISSUING_PATHS.contains(path)) {
            // SEC-01: Chặn spam gửi OTP / reset bộ đếm attempts
            if (!tryConsume(clientIp + "-otp-issue", this::createOtpIssuingBucket)) {
                writeRateLimitResponse(response, "Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau.");
                return;
            }
        } else if (path.contains("/guest-registrations") && isWrite) {
            // SEC-01: Rate limit Guest registration + OTP endpoints (chỉ thao tác ghi)
            if (!tryConsume(clientIp + "-guest", this::createNewBucket)) {
                writeRateLimitResponse(response, "Quá nhiều yêu cầu. Vui lòng thử lại sau.");
                return;
            }
        } else if (path.contains("/feedback")) {
            // SEC-01: Rate limit feedback endpoints separately
            if (!tryConsume(clientIp + "-feedback", this::createNewBucketForFeedback)) {
                writeRateLimitResponse(response, "Quá nhiều yêu cầu feedback. Vui lòng thử lại sau.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean tryConsume(String key, Supplier<Bucket> bucketFactory) {
        Entry entry = cache.computeIfAbsent(key, k -> new Entry(bucketFactory.get()));
        entry.lastAccessNanos = System.nanoTime();
        return entry.bucket.tryConsume(1);
    }

    /** Dọn bucket của các IP đã im lặng lâu — nếu không map chỉ lớn dần, không bao giờ co lại. */
    @Scheduled(fixedDelay = 30, timeUnit = TimeUnit.MINUTES)
    void evictIdleBuckets() {
        long now = System.nanoTime();
        long idleNanos = IDLE_EVICTION.toNanos();
        cache.entrySet().removeIf(entry -> now - entry.getValue().lastAccessNanos > idleNanos);
    }

    /** Bỏ dấu "/" cuối để "/api/auth/login/" không lách qua phép so khớp chính xác. */
    private String normalizePath(String path) {
        if (path != null && path.length() > 1 && path.endsWith("/")) {
            return path.substring(0, path.length() - 1);
        }
        return path;
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
