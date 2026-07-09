package com.fptu.fcms.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean LangChain4j cho RAG (Batch 4).
 * Không dùng langchain4j spring-boot-starter — khai báo thủ công từ gemini.*.
 */
@Configuration
public class LangChain4jConfig {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.chat-model}")
    private String chatModelName;

    @Value("${gemini.embedding-model}")
    private String embeddingModelName;

    @Bean
    public ChatModel geminiChatModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
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
                .apiKey(apiKey)
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
                .apiKey(apiKey)
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
