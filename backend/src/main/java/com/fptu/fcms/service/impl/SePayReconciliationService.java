package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.SePayWebhookRequest;
import com.fptu.fcms.dto.response.SePayTransactionListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Lưới an toàn cho webhook SePay. Webhook có thể lỡ (backend đang deploy, mạng lỗi, SePay hết lượt
 * retry) — khi đó tiền đã vào tài khoản nhưng hệ thống không biết, và TicketPaymentExpiryScheduler
 * sẽ huỷ vé của người đã trả tiền. Định kỳ kéo lại danh sách giao dịch từ SePay API và đẩy qua
 * đúng đường xử lý của webhook; chống trùng đã có sẵn theo providerTransactionId.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SePayReconciliationService {

    private static final DateTimeFormatter SEPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SePayWebhookService sePayWebhookService;
    private final ObjectMapper objectMapper;

    @Value("${fcms.payment.sepay.api-token:}")
    private String apiToken;

    @Value("${fcms.payment.sepay.api-base-url:https://my.sepay.vn}")
    private String apiBaseUrl;

    @Value("${fcms.payment.sepay.account-number:}")
    private String accountNumber;

    @Value("${fcms.payment.sepay.reconcile-lookback-minutes:180}")
    private long lookbackMinutes;

    public boolean isEnabled() {
        return StringUtils.hasText(apiToken);
    }

    /**
     * @return số giao dịch đã đẩy vào xử lý (kể cả những giao dịch đã xử lý trước đó và bị bỏ qua).
     */
    public int reconcileRecentTransactions() {
        if (!isEnabled()) {
            return 0;
        }
        List<SePayTransactionListResponse.Transaction> transactions = fetchRecentTransactions();
        int dispatched = 0;
        for (SePayTransactionListResponse.Transaction transaction : transactions) {
            if (dispatch(transaction)) {
                dispatched++;
            }
        }
        return dispatched;
    }

    private List<SePayTransactionListResponse.Transaction> fetchRecentTransactions() {
        String since = LocalDateTime.now().minusMinutes(lookbackMinutes).format(SEPAY_DATE_FORMAT);
        try {
            SePayTransactionListResponse response = RestClient.create()
                    .get()
                    .uri(apiBaseUrl.replaceAll("/+$", "") + "/userapi/transactions/list", uri -> {
                        uri.queryParam("transaction_date_min", since);
                        uri.queryParam("limit", 200);
                        if (StringUtils.hasText(accountNumber)) {
                            uri.queryParam("account_number", accountNumber.trim());
                        }
                        return uri.build();
                    })
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiToken.trim())
                    .retrieve()
                    .body(SePayTransactionListResponse.class);
            if (response == null || response.getTransactions() == null) {
                return List.of();
            }
            return response.getTransactions();
        } catch (RuntimeException exception) {
            log.warn("Could not fetch SePay transactions for reconciliation: {}", exception.getMessage());
            return List.of();
        }
    }

    /**
     * @return true nếu giao dịch được đưa qua đường xử lý (không tính giao dịch bị bỏ vì không phải tiền vào).
     */
    private boolean dispatch(SePayTransactionListResponse.Transaction transaction) {
        BigDecimal amountIn = parseAmount(transaction.getAmountIn());
        if (amountIn.signum() <= 0) {
            return false;
        }
        Long providerTransactionId = parseId(transaction.getId());
        if (providerTransactionId == null) {
            log.warn("Skipping SePay transaction with unusable id: {}", transaction.getId());
            return false;
        }

        SePayWebhookRequest request = new SePayWebhookRequest();
        request.setId(providerTransactionId);
        request.setGateway(transaction.getBankBrandName());
        request.setTransactionDate(transaction.getTransactionDate());
        request.setAccountNumber(transaction.getAccountNumber());
        request.setSubAccount(transaction.getSubAccount());
        request.setCode(transaction.getCode());
        request.setContent(transaction.getTransactionContent());
        request.setTransferType("in");
        request.setTransferAmount(amountIn);
        request.setAccumulated(parseAmount(transaction.getAccumulated()));
        request.setReferenceCode(transaction.getReferenceNumber());

        try {
            // process() tự bỏ qua giao dịch đã ghi nhận, nên chạy lại nhiều lần là vô hại.
            sePayWebhookService.process(request, toRawPayload(transaction));
            return true;
        } catch (RuntimeException exception) {
            log.warn("Reconciliation could not process SePay transaction {}: {}",
                    providerTransactionId, exception.getMessage());
            return false;
        }
    }

    private String toRawPayload(SePayTransactionListResponse.Transaction transaction) {
        try {
            return objectMapper.writeValueAsString(transaction);
        } catch (JsonProcessingException exception) {
            return String.valueOf(transaction);
        }
    }

    private BigDecimal parseAmount(String value) {
        if (!StringUtils.hasText(value)) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException exception) {
            return BigDecimal.ZERO;
        }
    }

    private Long parseId(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
