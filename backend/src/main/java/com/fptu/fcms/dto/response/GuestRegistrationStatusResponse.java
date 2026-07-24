package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import com.fptu.fcms.enums.PaymentMethod;
import com.fptu.fcms.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class GuestRegistrationStatusResponse {
    private Integer eventId;
    private Integer registrationId;
    private String status;
    private String fullNameMasked;
    private String emailMasked;
    private String phoneMasked;
    private String registrationCode;
    private Integer waitlistPosition;
    private String ticketCode;
    private LocalDateTime ticketIssuedAt;
    private PaymentStatus paymentStatus;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private String paymentCurrency;
    private String paymentReference;
    private PaymentMethod paymentMethod;
    private LocalDateTime paidAt;
    private LocalDateTime paymentExpiresAt;
    private LocalDateTime paymentSubmittedAt;
    private String paymentRejectionReason;
}
