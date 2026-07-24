package com.fptu.fcms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "BankPaymentTransaction", indexes = {
        @Index(name = "UX_BankPaymentTransaction_ProviderTransaction", columnList = "provider,providerTransactionId", unique = true),
        @Index(name = "IX_BankPaymentTransaction_PaymentReference", columnList = "paymentReference")
})
@Getter
@Setter
@NoArgsConstructor
public class BankPaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bankPaymentTransactionID")
    private Long bankPaymentTransactionID;

    @Column(name = "provider", nullable = false, length = 30)
    private String provider;

    @Column(name = "providerTransactionId", nullable = false, length = 100)
    private String providerTransactionId;

    @Column(name = "gateway", length = 50)
    private String gateway;

    @Column(name = "accountNumber", length = 50)
    private String accountNumber;

    @Column(name = "paymentReference", length = 64)
    private String paymentReference;

    @Column(name = "guestRegistrationID")
    private Integer guestRegistrationID;

    @Column(name = "transferAmount", nullable = false, precision = 18, scale = 2)
    private BigDecimal transferAmount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "transferType", length = 10)
    private String transferType;

    @Column(name = "transferContent", length = 500)
    private String transferContent;

    @Column(name = "referenceCode", length = 100)
    private String referenceCode;

    @Column(name = "transactionDate")
    private LocalDateTime transactionDate;

    @Column(name = "processingStatus", nullable = false, length = 30)
    private String processingStatus;

    @Column(name = "processingMessage", length = 500)
    private String processingMessage;

    @Column(name = "payloadHash", nullable = false, length = 64)
    private String payloadHash;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "processedAt")
    private LocalDateTime processedAt;
}
