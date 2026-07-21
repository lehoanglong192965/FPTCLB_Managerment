package com.fptu.fcms.dto.response;

import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import java.math.BigDecimal;

public record EventRegistrationResultResponse(
        Integer registrationId,
        RegistrationStatus registrationStatus,
        PaymentStatus paymentStatus,
        BigDecimal amountDue,
        String currency,
        String paymentReference,
        boolean ticketEligible,
        String message
) {
}
