package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.GuestOtpVerifyRequest;
import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.request.ConfirmEventPaymentRequest;
import com.fptu.fcms.dto.response.GuestOtpVerifyResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;
import com.fptu.fcms.dto.response.GuestRegistrationStatusResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.GuestVerificationOtp;
import com.fptu.fcms.enums.DiscoverySource;
import com.fptu.fcms.enums.GuestOtpStatus;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.GuestVerificationOtpRepository;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.GuestRegistrationService;
import com.fptu.fcms.service.RegistrationAllocationPort;
import com.fptu.fcms.service.RegistrationNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class GuestRegistrationServiceImpl implements GuestRegistrationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int DEFAULT_OTP_MAX_ATTEMPTS = 5;
    private static final Set<RegistrationStatus> INACTIVE_GUEST_STATUSES = Set.of(RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED);

    private final EventRepository eventRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final GuestVerificationOtpRepository guestVerificationOtpRepository;
    private final RegistrationAllocationPort registrationAllocationPort;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RegistrationNotificationService registrationNotificationService;

    @Value("${fcms.guest.otp-expiration-minutes:10}")
    private long otpExpirationMinutes;

    @Value("${fcms.guest.otp-resend-cooldown-seconds:60}")
    private long otpResendCooldownSeconds;

    @Override
    @Transactional
    public GuestRegistrationResponse createGuestRegistration(Integer eventId, GuestRegistrationRequest request) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        LocalDateTime requestTime = LocalDateTime.now();
        if (!com.fptu.fcms.enums.EventStatus.REGISTRATION_OPEN.equals(event.getEventStatus())
                || (event.getRegistrationOpenAt() != null && requestTime.isBefore(event.getRegistrationOpenAt()))
                || (event.getRegistrationCloseAt() != null && requestTime.isAfter(event.getRegistrationCloseAt()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "REGISTRATION_WINDOW_CLOSED");
        }
        validateGuestRequest(eventId, request);

        LocalDateTime now = LocalDateTime.now();
        String rawReference = generateOpaqueToken();
        GuestEventRegistration registration = new GuestEventRegistration();
        registration.setEventID(eventId);
        registration.setGuestFullName(normalizeNameForStorage(request.getFullName()));
        registration.setGuestEmail(normalizeEmail(request.getEmail()));
        registration.setGuestEmailNormalized(normalizeEmail(request.getEmail()));
        registration.setGuestPhone(normalizePhone(request.getPhone()));
        registration.setGuestPhoneNormalized(normalizePhone(request.getPhone()));
        registration.setSchoolOrOrganization(trimToNull(request.getSchoolOrOrganization()));
        registration.setConsentAccepted(true);
        registration.setDiscoverySource(normalizeDiscoverySource(request.getDiscoverySource()));
        registration.setRegistrationChannel(RegistrationChannel.ONLINE);
        registration.setParticipantType(ParticipantType.GUEST);
        registration.setParticipantTypeSnapshotAt(now);
        registration.setGuestReferenceHash(hash(rawReference));
        registration.setRegisteredAt(now);
        registration.setStatus(RegistrationStatus.PENDING_VERIFICATION.name());
        registration.setRegistrationStatus(RegistrationStatus.PENDING_VERIFICATION);
        registration.setRegistrationCode(generateRegistrationCode());
        registration.setPaymentStatus(PaymentStatus.NOT_REQUIRED);
        registration.setAmountPaid(BigDecimal.ZERO);
        registration.setPaymentCurrency(event.getTicketCurrency() == null ? "VND" : event.getTicketCurrency());
        registration.setCreatedAt(now);
        registration.setUpdatedAt(now);
        registration.setIsDeleted(false);

        GuestEventRegistration saved = guestEventRegistrationRepository.save(registration);
        OtpIssue otpIssue = createOtp(saved.getGuestRegistrationID(), saved.getGuestEmail());
        sendGuestOtpEmail(saved.getGuestEmail(), otpIssue.rawOtp(), otpIssue.otp().getExpiresAt());

        return new GuestRegistrationResponse(
                eventId,
                saved.getGuestRegistrationID(),
                saved.getRegistrationStatus().name(),
                rawReference,
                otpIssue.otp().getExpiresAt(),
                otpIssue.otp().getResendAvailableAt()
        );
    }

    @Override
    @Transactional
    public GuestOtpVerifyResponse verifyOtp(String guestReference, GuestOtpVerifyRequest request) {
        GuestEventRegistration registration = findByReference(guestReference);
        GuestVerificationOtp otp = guestVerificationOtpRepository
                .findTopByGuestRegistrationIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        registration.getGuestRegistrationID(),
                        GuestOtpStatus.ACTIVE
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP_INVALID"));

        LocalDateTime now = LocalDateTime.now();
        if (otp.getExpiresAt().isBefore(now)) {
            otp.setStatus(GuestOtpStatus.EXPIRED);
            otp.setUpdatedAt(now);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED");
        }
        if (otp.getAttemptCount() >= otp.getMaxAttempts()) {
            otp.setStatus(GuestOtpStatus.LOCKED);
            otp.setUpdatedAt(now);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "OTP_LOCKED");
        }
        if (!passwordEncoder.matches(request.getOtp(), otp.getOtpHash())) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            if (otp.getAttemptCount() >= otp.getMaxAttempts()) {
                otp.setStatus(GuestOtpStatus.LOCKED);
            }
            otp.setUpdatedAt(now);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP_INVALID");
        }

        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(registration.getEventID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        otp.setStatus(GuestOtpStatus.USED);
        otp.setUsedAt(now);
        otp.setVerifiedAt(now);
        otp.setUpdatedAt(now);
        registration.setVerifiedAt(now);
        String allocatedStatus = registrationAllocationPort.allocateGuest(event);
        RegistrationStatus status = RegistrationStatus.fromValue(allocatedStatus);
        registration.setStatus(status == null ? null : status.name());
        registration.setRegistrationStatus(status);
        if (RegistrationStatus.CONFIRMED.equals(status)) {
            if (Boolean.TRUE.equals(event.getIsPaidEvent())) {
                registration.setPaymentStatus(PaymentStatus.PENDING);
                registration.setAmountDue(event.getTicketPrice());
                registration.setAmountPaid(BigDecimal.ZERO);
                registration.setPaymentReference("GUEST-" + registration.getGuestRegistrationID() + "-"
                        + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT));
                registration.setPaymentExpiresAt(now.plusMinutes(30));
            } else {
                issueTicket(registration, now);
            }
        } else if (RegistrationStatus.WAITLISTED.equals(status) && Boolean.TRUE.equals(event.getIsPaidEvent())) {
            registration.setPaymentStatus(PaymentStatus.AWAITING_ELIGIBILITY);
            registration.setAmountDue(event.getTicketPrice());
            registration.setAmountPaid(BigDecimal.ZERO);
        }
        registration.setUpdatedAt(now);
        guestEventRegistrationRepository.save(registration);
        registrationNotificationService.notifyGuestRegistrationStatus(registration);

        return new GuestOtpVerifyResponse(
                registration.getGuestRegistrationID(),
                effectiveStatus(registration),
                "Guest registration verified."
        );
    }

    @Override
    @Transactional
    public GuestRegistrationResponse resendOtp(String guestReference) {
        GuestEventRegistration registration = findByReference(guestReference);
        GuestVerificationOtp current = guestVerificationOtpRepository
                .findTopByGuestRegistrationIDAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        registration.getGuestRegistrationID(),
                        GuestOtpStatus.ACTIVE
                )
                .orElse(null);
        LocalDateTime now = LocalDateTime.now();
        if (current != null && current.getResendAvailableAt() != null && current.getResendAvailableAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RESEND_COOLDOWN");
        }
        if (current != null) {
            current.setStatus(GuestOtpStatus.EXPIRED);
            current.setUpdatedAt(now);
        }
        OtpIssue otpIssue = createOtp(registration.getGuestRegistrationID(), registration.getGuestEmail());
        sendGuestOtpEmail(registration.getGuestEmail(), otpIssue.rawOtp(), otpIssue.otp().getExpiresAt());
        return new GuestRegistrationResponse(
                registration.getEventID(),
                registration.getGuestRegistrationID(),
                effectiveStatus(registration),
                null,
                otpIssue.otp().getExpiresAt(),
                otpIssue.otp().getResendAvailableAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GuestRegistrationStatusResponse getStatus(String guestReference) {
        return toStatus(findByReference(guestReference));
    }

    @Override
    @Transactional
    public GuestRegistrationStatusResponse cancel(String guestReference) {
        GuestEventRegistration registration = findByReference(guestReference);
        registration.setStatus(RegistrationStatus.CANCELLED.name());
        registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(LocalDateTime.now());
        registration.setTicketRevokedAt(LocalDateTime.now());
        registration.setUpdatedAt(LocalDateTime.now());
        guestEventRegistrationRepository.save(registration);
        registrationNotificationService.notifyGuestRegistrationStatus(registration);
        return toStatus(registration);
    }

    @Override
    @Transactional
    public GuestRegistrationStatusResponse confirmPayment(String guestReference, ConfirmEventPaymentRequest request) {
        GuestEventRegistration registration = findByReference(guestReference);
        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(registration.getEventID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!PaymentStatus.PENDING.equals(registration.getPaymentStatus())) {
            if (PaymentStatus.PAID.equals(registration.getPaymentStatus())) return toStatus(registration);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GUEST_PAYMENT_NOT_PENDING");
        }
        LocalDateTime now = LocalDateTime.now();
        if (registration.getPaymentExpiresAt() != null && registration.getPaymentExpiresAt().isBefore(now)) {
            registration.setPaymentStatus(PaymentStatus.EXPIRED);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GUEST_PAYMENT_EXPIRED");
        }
        registration.setPaymentStatus(PaymentStatus.PAID);
        registration.setAmountPaid(registration.getAmountDue());
        registration.setPaymentMethod(request.getPaymentMethod());
        if (request.getTransactionReference() != null && !request.getTransactionReference().isBlank()) {
            registration.setPaymentReference(request.getTransactionReference().trim());
        }
        registration.setPaidAt(now);
        issueTicket(registration, now);
        GuestEventRegistration saved = guestEventRegistrationRepository.save(registration);
        emailService.sendEventTicketConfirmationEmail(
                saved.getGuestEmail(), saved.getGuestFullName(), event.getEventName(), event.getStartDate(), event.getEndDate(),
                event.getLocation(), saved.getTicketCode(), saved.getAmountPaid(), saved.getPaymentCurrency());
        return toStatus(saved);
    }

    private void issueTicket(GuestEventRegistration registration, LocalDateTime now) {
        if (registration.getTicketCode() == null || registration.getTicketCode().isBlank()) {
            registration.setTicketCode(UUID.randomUUID().toString());
        }
        if (registration.getTicketIssuedAt() == null) registration.setTicketIssuedAt(now);
        registration.setTicketRevokedAt(null);
    }

    private void validateGuestRequest(Integer eventId, GuestRegistrationRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (email.endsWith("@fpt.edu.vn") || email.endsWith("@fe.edu.vn")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FPT_EMAIL_LOGIN_REQUIRED");
        }
        String phone = normalizePhone(request.getPhone());
        if (guestEventRegistrationRepository.existsActiveGuestEmail(eventId, email, INACTIVE_GUEST_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GUEST_DUPLICATE_EMAIL");
        }
        if (guestEventRegistrationRepository.existsActiveGuestPhone(eventId, phone, INACTIVE_GUEST_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GUEST_DUPLICATE_PHONE");
        }
    }

    private OtpIssue createOtp(Integer guestRegistrationId, String guestEmail) {
        String otpRaw = String.format(Locale.ROOT, "%06d", SECURE_RANDOM.nextInt(1_000_000));
        LocalDateTime now = LocalDateTime.now();
        GuestVerificationOtp otp = new GuestVerificationOtp();
        otp.setGuestRegistrationID(guestRegistrationId);
        otp.setGuestEmail(guestEmail);
        otp.setOtpHash(passwordEncoder.encode(otpRaw));
        otp.setExpiresAt(now.plusMinutes(otpExpirationMinutes));
        otp.setResendAvailableAt(now.plusSeconds(otpResendCooldownSeconds));
        otp.setAttemptCount(0);
        otp.setMaxAttempts(DEFAULT_OTP_MAX_ATTEMPTS);
        otp.setStatus(GuestOtpStatus.ACTIVE);
        otp.setCreatedAt(now);
        GuestVerificationOtp saved = guestVerificationOtpRepository.save(otp);
        return new OtpIssue(saved, otpRaw);
    }

    private void sendGuestOtpEmail(String email, String otpRaw, LocalDateTime expiresAt) {
        emailService.sendSimpleEmail(
                email,
                "FCMS Guest Registration OTP",
                "Your guest registration OTP is " + otpRaw + ". It expires at " + expiresAt + ". Do not share this code."
        );
    }

    private GuestEventRegistration findByReference(String guestReference) {
        return guestEventRegistrationRepository.findByGuestReferenceHashAndIsDeletedFalse(hash(guestReference))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GUEST_REFERENCE_INVALID"));
    }

    private GuestRegistrationStatusResponse toStatus(GuestEventRegistration registration) {
        return new GuestRegistrationStatusResponse(
                registration.getEventID(),
                registration.getGuestRegistrationID(),
                effectiveStatus(registration),
                maskName(registration.getGuestFullName()),
                maskEmail(registration.getGuestEmail()),
                maskPhone(registration.getGuestPhone()),
                registration.getRegistrationCode(),
                registration.getWaitlistPosition(),
                registration.getTicketRevokedAt() == null ? registration.getTicketCode() : null,
                registration.getTicketIssuedAt(),
                registration.getPaymentStatus(),
                registration.getAmountDue(),
                registration.getAmountPaid(),
                registration.getPaymentCurrency(),
                registration.getPaymentReference(),
                registration.getPaymentMethod(),
                registration.getPaidAt(),
                registration.getPaymentExpiresAt()
        );
    }

    private String effectiveStatus(GuestEventRegistration registration) {
        if (registration == null) {
            return null;
        }
        if (registration.getRegistrationStatus() != null) {
            return registration.getRegistrationStatus().name();
        }
        return registration.getStatus();
    }

    private record OtpIssue(GuestVerificationOtp otp, String rawOtp) {}

    private String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.replaceAll("\\D", "").trim();
    }

    private String normalizeNameForStorage(String name) {
        return name == null ? "" : name.trim().replaceAll("\\s+", " ");
    }

    private String normalizeDiscoverySource(String source) {
        try {
            return DiscoverySource.valueOf(source.trim().toUpperCase(Locale.ROOT)).name();
        } catch (Exception ex) {
            return DiscoverySource.OTHER.name();
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String generateRegistrationCode() {
        String code;
        do {
            code = "GUEST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (guestEventRegistrationRepository.existsByRegistrationCodeAndIsDeletedFalse(code));
        return code;
    }

    private String maskName(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        return name.charAt(0) + "***";
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "";
        }
        int at = email.indexOf('@');
        String prefix = email.substring(0, Math.min(2, at));
        return prefix + "***" + email.substring(at);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() <= 4) {
            return "****";
        }
        return "******" + phone.substring(phone.length() - 4);
    }
}
