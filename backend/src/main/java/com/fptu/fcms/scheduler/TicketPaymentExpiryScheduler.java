package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.service.event.RegistrationAllocationService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import com.fptu.fcms.service.GuestPaymentEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketPaymentExpiryScheduler {

    private final EventRegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final GuestEventRegistrationRepository guestRegistrationRepository;
    private final RegistrationAllocationService allocationService;
    private final GuestPaymentEmailService guestPaymentEmailService;

    @Scheduled(fixedDelayString = "${fcms.ticket.expiry-scan-ms:60000}")
    @Transactional
    public void releaseExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        sendGuestPaymentReminders(now);
        LocalDateTime verificationGraceCutoff = now.minusMinutes(15);
        List<EventRegistration> expired = new ArrayList<>(registrationRepository
                .findByPaymentStatusAndPaymentExpiresAtBeforeAndIsDeletedFalse(PaymentStatus.PENDING, now));
        expired.addAll(registrationRepository
                .findByPaymentStatusAndPaymentExpiresAtBeforeAndIsDeletedFalse(
                        PaymentStatus.AWAITING_VERIFICATION, verificationGraceCutoff));
        List<GuestEventRegistration> expiredGuests = new ArrayList<>(guestRegistrationRepository
                .findByPaymentStatusAndPaymentExpiresAtBeforeAndIsDeletedFalse(PaymentStatus.PENDING, now));
        expiredGuests.addAll(guestRegistrationRepository
                .findByPaymentStatusAndPaymentExpiresAtBeforeAndIsDeletedFalse(
                        PaymentStatus.AWAITING_VERIFICATION, verificationGraceCutoff));
        if (expired.isEmpty() && expiredGuests.isEmpty()) return;

        Set<Integer> affectedEvents = new HashSet<>();
        for (EventRegistration registration : expired) {
            RegistrationStatus status = registration.getRegistrationStatus();
            if (!RegistrationLifecycle.CONFIRMED_STATUSES.contains(status)) continue;
            registration.setPaymentStatus(PaymentStatus.EXPIRED);
            registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
            registration.setStatus(RegistrationStatus.CANCELLED.name());
            registration.setCancelledAt(now);
            registration.setTicketRevokedAt(now);
            registration.setUpdatedAt(now);
            affectedEvents.add(registration.getEventID());
        }
        registrationRepository.saveAll(expired);

        List<GuestEventRegistration> expiredGuestNotifications = new java.util.ArrayList<>();
        for (GuestEventRegistration registration : expiredGuests) {
            RegistrationStatus status = registration.getRegistrationStatus();
            if (!RegistrationLifecycle.CONFIRMED_STATUSES.contains(status)) continue;
            registration.setPaymentStatus(PaymentStatus.EXPIRED);
            registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
            registration.setStatus(RegistrationStatus.CANCELLED.name());
            registration.setCancelledAt(now);
            registration.setTicketRevokedAt(now);
            registration.setCancellationSource("PAYMENT_TIMEOUT");
            registration.setCancellationReason("Payment reservation expired.");
            if (registration.getPaymentExpiredEmailSentAt() == null) {
                registration.setPaymentExpiredEmailSentAt(now);
                expiredGuestNotifications.add(registration);
            }
            registration.setUpdatedAt(now);
            affectedEvents.add(registration.getEventID());
        }
        guestRegistrationRepository.saveAll(expiredGuests);

        for (GuestEventRegistration registration : expiredGuestNotifications) {
            eventRepository.findByEventIDAndIsDeletedFalse(registration.getEventID())
                    .ifPresent(event -> sendAfterCommit(
                            () -> guestPaymentEmailService.sendPaymentExpired(registration, event)));
        }

        for (Integer eventId : affectedEvents) {
            eventRepository.findByEventIDAndIsDeletedFalse(eventId).ifPresent(event ->
                    allocationService.promoteWaitlisted(eventId, event.getMaxParticipants()));
        }
        log.info("Released {} member and {} guest expired paid-ticket reservations across {} events",
                expired.size(), expiredGuests.size(), affectedEvents.size());
    }

    private void sendGuestPaymentReminders(LocalDateTime now) {
        List<GuestEventRegistration> reminders = guestRegistrationRepository
                .findByPaymentStatusAndPaymentExpiresAtBetweenAndPaymentReminderSentAtIsNullAndIsDeletedFalse(
                        PaymentStatus.PENDING,
                        now,
                        now.plusMinutes(10)
                );
        if (reminders.isEmpty()) {
            return;
        }

        for (GuestEventRegistration registration : reminders) {
            registration.setPaymentReminderSentAt(now);
            registration.setUpdatedAt(now);
        }
        guestRegistrationRepository.saveAll(reminders);

        for (GuestEventRegistration registration : reminders) {
            eventRepository.findByEventIDAndIsDeletedFalse(registration.getEventID())
                    .ifPresent(event -> sendAfterCommit(
                            () -> guestPaymentEmailService.sendPaymentReminder(registration, event)));
        }
    }

    private void sendAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}
