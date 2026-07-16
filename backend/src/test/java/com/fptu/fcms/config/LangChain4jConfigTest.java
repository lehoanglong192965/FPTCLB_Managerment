package com.fptu.fcms.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class LangChain4jConfigTest {

    @Test
    void createsModelBeansWhenGeminiApiKeyIsBlank() {
        LangChain4jConfig config = new LangChain4jConfig();
        ReflectionTestUtils.setField(config, "apiKey", "");
        ReflectionTestUtils.setField(config, "chatModelName", "gemini-3.1-flash-lite");
        ReflectionTestUtils.setField(config, "embeddingModelName", "gemini-embedding-001");

        assertNotNull(config.geminiChatModel());
        assertNotNull(config.documentEmbeddingModel());
        assertNotNull(config.queryEmbeddingModel());
    }
}