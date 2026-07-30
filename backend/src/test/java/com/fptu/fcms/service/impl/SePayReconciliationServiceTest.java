package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.response.SePayTransactionListResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class SePayReconciliationServiceTest {

    @Mock
    private SePayWebhookService sePayWebhookService;

    @InjectMocks
    private SePayReconciliationService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void staysDisabledUntilAnApiTokenIsConfigured() {
        ReflectionTestUtils.setField(service, "apiToken", "");

        assertFalse(service.isEnabled());
        // Không có token thì không được gọi ra ngoài, cũng không đụng gì tới đăng ký.
        service.reconcileRecentTransactions();
        verifyNoInteractions(sePayWebhookService);
    }

    @Test
    void becomesEnabledOnceTokenIsPresent() {
        ReflectionTestUtils.setField(service, "apiToken", "sepay-token");

        assertTrue(service.isEnabled());
    }

    @Test
    void mapsSePayFieldNamesFromTheDocumentedPayload() throws Exception {
        String payload = """
                {
                  "status": 200,
                  "transactions": [
                    {
                      "id": "1234",
                      "bank_brand_name": "MBBank",
                      "account_number": "0796578863",
                      "transaction_date": "2026-07-29 10:30:00",
                      "amount_in": "50000.00",
                      "amount_out": "0.00",
                      "transaction_content": "GUESTE977E2BB13 chuyen tien",
                      "reference_number": "FT26210"
                    }
                  ]
                }
                """;

        SePayTransactionListResponse response = objectMapper.readValue(payload, SePayTransactionListResponse.class);
        SePayTransactionListResponse.Transaction transaction = response.getTransactions().get(0);

        org.junit.jupiter.api.Assertions.assertEquals("1234", transaction.getId());
        org.junit.jupiter.api.Assertions.assertEquals("50000.00", transaction.getAmountIn());
        org.junit.jupiter.api.Assertions.assertEquals("GUESTE977E2BB13 chuyen tien", transaction.getTransactionContent());
        org.junit.jupiter.api.Assertions.assertEquals("FT26210", transaction.getReferenceNumber());
    }

    @Test
    void ignoresUnknownFieldsSoNewSePayColumnsDoNotBreakReconciliation() throws Exception {
        String payload = "{\"status\":200,\"brand_new_field\":\"x\",\"transactions\":[]}";

        SePayTransactionListResponse response = objectMapper.readValue(payload, SePayTransactionListResponse.class);

        org.junit.jupiter.api.Assertions.assertNotNull(response.getTransactions());
    }
}
