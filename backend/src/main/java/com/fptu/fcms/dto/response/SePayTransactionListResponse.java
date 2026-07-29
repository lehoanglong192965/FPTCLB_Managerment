package com.fptu.fcms.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Phản hồi của SePay userapi {@code GET /userapi/transactions/list}. Chỉ map những trường cần cho
 * đối soát; SePay có thể thêm trường mới nên bỏ qua trường lạ thay vì để deserialize nổ.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SePayTransactionListResponse {

    private Integer status;
    private String error;
    private List<Transaction> transactions;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Transaction {
        private String id;

        @JsonProperty("bank_brand_name")
        private String bankBrandName;

        @JsonProperty("account_number")
        private String accountNumber;

        @JsonProperty("sub_account")
        private String subAccount;

        @JsonProperty("transaction_date")
        private String transactionDate;

        @JsonProperty("amount_in")
        private String amountIn;

        @JsonProperty("amount_out")
        private String amountOut;

        private String accumulated;

        @JsonProperty("transaction_content")
        private String transactionContent;

        @JsonProperty("reference_number")
        private String referenceNumber;

        private String code;
    }
}
