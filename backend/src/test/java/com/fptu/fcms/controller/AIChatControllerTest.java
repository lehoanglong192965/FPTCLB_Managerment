package com.fptu.fcms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.AIChatRequest;
import com.fptu.fcms.dto.response.AIChatResponse;
import com.fptu.fcms.exception.GlobalExceptionHandler;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AIChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AIChatControllerTest {

    private MockMvc mockMvc;
    private AIChatService aiChatService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        aiChatService = mock(AIChatService.class);
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AIChatController(aiChatService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ─────────────────────── TC3-07 Rate limit ───────────────────────
    @Test
    @DisplayName("TC3-07: Rate limit per user (10 requests pass, 11th returns 429) & independent user quotas")
    void tc3_07_rateLimitPerUser() throws Exception {
        AIChatRequest chatRequest = AIChatRequest.builder()
                .message("Hello")
                .history(Collections.emptyList())
                .build();
        String requestJson = objectMapper.writeValueAsString(chatRequest);

        AIChatResponse mockResponse = AIChatResponse.builder()
                .answer("Hi")
                .citations(Collections.emptyList())
                .status("Success")
                .build();
        when(aiChatService.chat(any(AIChatRequest.class), any(UserPrincipal.class))).thenReturn(mockResponse);

        Authentication user1Auth = authForUser(1001, "user1@fpt.edu.vn");
        Authentication user2Auth = authForUser(1002, "user2@fpt.edu.vn");

        // 1. User 1 gửi 10 request liên tiếp -> Đều PASS (status 200)
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/v1/ai/chat")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .principal(user1Auth))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.answer").value("Hi"));
        }

        // 2. User 1 gửi request thứ 11 -> Bị CHẶN (status 429)
        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson)
                        .principal(user1Auth))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMIT_EXCEEDED"))
                .andExpect(jsonPath("$.message").value("Quá nhiều yêu cầu. Vui lòng thử lại sau."));

        // 3. User 2 gửi request đầu tiên -> Vẫn PASS (Quota độc lập, dù cùng IP/server)
        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson)
                        .principal(user2Auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Hi"));

        // Xác minh aiChatService chỉ được gọi 11 lần (10 lần cho User 1 + 1 lần cho User 2)
        verify(aiChatService, times(11)).chat(any(AIChatRequest.class), any(UserPrincipal.class));
    }

    private Authentication authForUser(int userId, String email) {
        UserPrincipal principal = new UserPrincipal(
                userId,
                email,
                3,
                "Student",
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_Student"))
        );
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }
}
