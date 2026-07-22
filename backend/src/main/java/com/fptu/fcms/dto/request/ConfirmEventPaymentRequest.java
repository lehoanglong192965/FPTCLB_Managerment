package com.fptu.fcms.dto.request;

import com.fptu.fcms.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfirmEventPaymentRequest {
    @NotNull
    private PaymentMethod paymentMethod;
    private String transactionReference;
}
