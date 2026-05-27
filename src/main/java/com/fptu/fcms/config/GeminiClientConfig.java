package com.fptu.fcms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class GeminiClientConfig {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.confidence-threshold:0.70}")
    private double confidenceThreshold;

    public String getApiKey() {
        return apiKey;
    }

    public double getConfidenceThreshold() {
        return confidenceThreshold;
    }

    @Bean
    public RestTemplate geminiRestTemplate() {
        // RestTemplate bean configuration to send requests to Google Gemini REST endpoints
        return new RestTemplate();
    }
}
