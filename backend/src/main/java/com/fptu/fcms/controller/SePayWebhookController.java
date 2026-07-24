package com.fptu.fcms.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.SePayWebhookRequest;
import com.fptu.fcms.dto.response.SePayWebhookResponse;
import com.fptu.fcms.service.impl.SePayWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/payment-webhooks")
@RequiredArgsConstructor
public class SePayWebhookController {
    private final ObjectMapper objectMapper;
    private final SePayWebhookService sePayWebhookService;

    @Value("${fcms.payment.sepay.webhook-api-key:}")
    private String webhookApiKey;

    @PostMapping("/sepay")
    public ResponseEntity<SePayWebhookResponse> receive(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody String rawPayload) {
        if (!StringUtils.hasText(webhookApiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SEPAY_WEBHOOK_NOT_CONFIGURED");
        }
        String expected = "Apikey " + webhookApiKey.trim();
        if (!StringUtils.hasText(authorization) || !MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), authorization.trim().getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_SEPAY_WEBHOOK_API_KEY");
        }
        try {
            SePayWebhookRequest request = objectMapper.readValue(rawPayload, SePayWebhookRequest.class);
            sePayWebhookService.process(request, rawPayload);
            return ResponseEntity.ok(new SePayWebhookResponse(true));
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_SEPAY_WEBHOOK_JSON");
        }
    }
}
