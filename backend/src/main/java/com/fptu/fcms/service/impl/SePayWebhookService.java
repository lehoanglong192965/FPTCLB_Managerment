package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.SePayWebhookRequest;
import com.fptu.fcms.entity.BankPaymentTransaction;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.PaymentMethod;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.repository.BankPaymentTransactionRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SePayWebhookService {
    private static final String PROVIDER = "SEPAY";
    private static final Pattern PAYMENT_REFERENCE_PATTERN = Pattern.compile(
            "(?i)(GUEST-\\d+-[A-Z0-9]{6,32}|GUEST[A-Z0-9]{6,10})");
    private static final DateTimeFormatter SEPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final BankPaymentTransactionRepository bankPaymentTransactionRepository;
    private final GuestEventRegistrationRepository guestRegistrationRepository;
    private final EventRepository eventRepository;
    private final EmailService emailService;

    @Value("${fcms.payment.sepay.account-number}")
    private String configuredAccountNumber;

    @Transactional
    public void process(SePayWebhookRequest request, String rawPayload) {
        validateRequiredFields(request);
        String providerTransactionId = String.valueOf(request.getId());
        if (bankPaymentTransactionRepository
                .findByProviderAndProviderTransactionId(PROVIDER, providerTransactionId).isPresent()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime transactionDate = parseTransactionDate(request.getTransactionDate());
        String paymentReference = extractPaymentReference(request.getCode(), request.getContent());
        BankPaymentTransaction transaction = new BankPaymentTransaction();
        transaction.setProvider(PROVIDER);
        transaction.setProviderTransactionId(providerTransactionId);
        transaction.setGateway(trimToLength(request.getGateway(), 50));
        transaction.setAccountNumber(trimToLength(request.getAccountNumber(), 50));
        transaction.setPaymentReference(paymentReference);
        transaction.setTransferAmount(request.getTransferAmount());
        transaction.setCurrency("VND");
        transaction.setTransferType(trimToLength(request.getTransferType(), 10));
        transaction.setTransferContent(trimToLength(request.getContent(), 500));
        transaction.setReferenceCode(trimToLength(request.getReferenceCode(), 100));
        transaction.setTransactionDate(transactionDate);
        transaction.setPayloadHash(sha256(rawPayload));
        transaction.setCreatedAt(now);

        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            saveForReview(transaction, "IGNORED", "Only incoming transfers are processed.");
            return;
        }
        if (StringUtils.hasText(configuredAccountNumber)
                && !configuredAccountNumber.trim().equals(request.getAccountNumber().trim())) {
            saveForReview(transaction, "NEEDS_REVIEW", "Receiving account does not match configuration.");
            return;
        }
        if (!StringUtils.hasText(paymentReference)) {
            saveForReview(transaction, "UNMATCHED", "Payment reference was not found.");
            return;
        }

        GuestEventRegistration registration = guestRegistrationRepository
                .findByPaymentReferenceAndIsDeletedFalse(paymentReference).orElse(null);
        if (registration == null) {
            saveForReview(transaction, "UNMATCHED", "No guest registration matches the payment reference.");
            return;
        }
        transaction.setGuestRegistrationID(registration.getGuestRegistrationID());
        if (registration.getAmountDue() == null
                || registration.getAmountDue().compareTo(request.getTransferAmount()) != 0) {
            saveForReview(transaction, "NEEDS_REVIEW", "Transfer amount does not match amount due.");
            return;
        }
        if (PaymentStatus.PAID.equals(registration.getPaymentStatus())) {
            saveForReview(transaction, "ALREADY_PAID", "Registration was already paid.");
            return;
        }
        if (!PaymentStatus.PENDING.equals(registration.getPaymentStatus())
                && !PaymentStatus.AWAITING_VERIFICATION.equals(registration.getPaymentStatus())) {
            saveForReview(transaction, "NEEDS_REVIEW", "Registration is not eligible for payment.");
            return;
        }
        if (registration.getPaymentExpiresAt() != null
                && transactionDate.isAfter(registration.getPaymentExpiresAt())) {
            saveForReview(transaction, "NEEDS_REVIEW", "Transfer was made after payment deadline.");
            return;
        }

        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(registration.getEventID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        registration.setPaymentStatus(PaymentStatus.PAID);
        registration.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        registration.setAmountPaid(registration.getAmountDue());
        registration.setPaidAt(now);
        if (registration.getPaymentSubmittedAt() == null) registration.setPaymentSubmittedAt(transactionDate);
        registration.setPaymentReviewedAt(now);
        registration.setPaymentReviewedBy(null);
        registration.setPaymentRejectionReason(null);
        if (!StringUtils.hasText(registration.getTicketCode())) registration.setTicketCode(UUID.randomUUID().toString());
        registration.setTicketIssuedAt(now);
        registration.setTicketRevokedAt(null);
        registration.setUpdatedAt(now);
        GuestEventRegistration savedRegistration = guestRegistrationRepository.save(registration);

        transaction.setProcessingStatus("PROCESSED");
        transaction.setProcessingMessage("Payment matched and ticket was issued.");
        transaction.setProcessedAt(now);
        bankPaymentTransactionRepository.save(transaction);

        sendAfterCommit(() -> emailService.sendEventTicketConfirmationEmail(
                savedRegistration.getGuestEmail(), savedRegistration.getGuestFullName(), event.getEventName(),
                event.getStartDate(), event.getEndDate(), event.getLocation(), savedRegistration.getTicketCode(),
                savedRegistration.getAmountPaid(), savedRegistration.getPaymentCurrency()));
    }

    private void validateRequiredFields(SePayWebhookRequest request) {
        if (request == null || request.getId() == null || request.getTransferAmount() == null
                || request.getTransferAmount().compareTo(BigDecimal.ZERO) <= 0
                || !StringUtils.hasText(request.getTransferType())
                || !StringUtils.hasText(request.getAccountNumber())
                || !StringUtils.hasText(request.getTransactionDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_SEPAY_WEBHOOK_PAYLOAD");
        }
    }

    private LocalDateTime parseTransactionDate(String value) {
        try {
            return LocalDateTime.parse(value.trim(), SEPAY_DATE_FORMAT);
        } catch (DateTimeParseException exception) {
            try {
                return LocalDateTime.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (DateTimeParseException ignored) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_SEPAY_TRANSACTION_DATE");
            }
        }
    }

    private String extractPaymentReference(String code, String content) {
        String combined = (code == null ? "" : code) + " " + (content == null ? "" : content);
        Matcher matcher = PAYMENT_REFERENCE_PATTERN.matcher(combined);
        return matcher.find() ? matcher.group().toUpperCase(Locale.ROOT) : null;
    }

    private void saveForReview(BankPaymentTransaction transaction, String status, String message) {
        transaction.setProcessingStatus(status);
        transaction.setProcessingMessage(message);
        transaction.setProcessedAt(LocalDateTime.now());
        bankPaymentTransactionRepository.save(transaction);
    }

    private void sendAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash SePay webhook payload.", exception);
        }
    }
}
