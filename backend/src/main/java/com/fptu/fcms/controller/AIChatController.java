package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.AIChatRequest;
import com.fptu.fcms.dto.response.AIChatResponse;
import com.fptu.fcms.dto.response.ApiErrorResponse;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AIChatService;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIChatController {

    private final AIChatService aiChatService;
    private final Map<Integer, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // Limit: 10 requests per minute
        return Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1))))
                .build();
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(
            @Valid @RequestBody AIChatRequest request,
            Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId = principal.getUserId();

        // Rate limit: Bucket4j key theo userID, 10 request / 1 token-window (1 phút)
        Bucket bucket = cache.computeIfAbsent(userId, k -> createNewBucket());
        if (!bucket.tryConsume(1)) {
            ApiErrorResponse errorResponse = new ApiErrorResponse(
                    false,
                    LocalDateTime.now(),
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                    "RATE_LIMIT_EXCEEDED",
                    "Quá nhiều yêu cầu. Vui lòng thử lại sau."
            );
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        }

        AIChatResponse response = aiChatService.chat(request, principal);
        return ResponseEntity.ok(response);
    }
}
