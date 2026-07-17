package com.fptu.fcms.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean LangChain4j cho RAG (Batch 4).
 * Không dùng langchain4j spring-boot-starter — khai báo thủ công từ gemini.*.
 */
// Cấu hình các Bean của LangChain4j.
// Đầu vào: API Key hoặc thông tin cấu hình từ file properties.
// Đầu ra: Khởi tạo các Bean (như GoogleAiGeminiChatModel, GoogleAiGeminiEmbeddingModel) phục vụ cho RAG. Cấu hình taskType = RETRIEVAL_DOCUMENT để tối ưu hóa vector nhúng.
@Configuration
@Slf4j
public class LangChain4jConfig {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.chat-model}")
    private String chatModelName;

    @Value("${gemini.embedding-model}")
    private String embeddingModelName;

    /**
     * Cho phép boot khi chưa cấu hình GEMINI_API_KEY (dev local không cần chatbot).
     * Builder của LangChain4j yêu cầu apiKey không rỗng nên thay bằng placeholder;
     * các API call tới Gemini sẽ lỗi 4xx khi thực sự dùng chatbot.
     */
    private String resolveApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY chưa được cấu hình — AI chatbot sẽ không hoạt động cho tới khi set biến môi trường này.");
            return "MISSING_GEMINI_API_KEY";
        }
        return apiKey;
    }

    @Bean
    public ChatModel geminiChatModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(resolveApiKey())
                .modelName(chatModelName)
                .temperature(0.2)
                .maxRetries(3)
                .build();
    }

    /**
     * Embedding khi INDEX tài liệu (ingestion).
     */
    @Bean(name = "documentEmbeddingModel")
    public EmbeddingModel documentEmbeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(resolveApiKey())
                .modelName(embeddingModelName)
                .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
                .maxRetries(3)
                .build();
    }

    /**
     * Embedding khi embed câu hỏi user lúc chat (Batch 5) — task type bất đối xứng.
     */
    @Bean(name = "queryEmbeddingModel")
    public EmbeddingModel queryEmbeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(resolveApiKey())
                .modelName(embeddingModelName)
                .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_QUERY)
                .maxRetries(3)
                .build();
    }

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        return new InMemoryEmbeddingStore<>();
    }
}
