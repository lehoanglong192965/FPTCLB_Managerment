package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {

    @NotBlank(message = "Message không được để trống")
    private String message;

    private List<ChatMessageDto> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDto {
        private String role; // "user" or "assistant"
        private String content;
    }
}
