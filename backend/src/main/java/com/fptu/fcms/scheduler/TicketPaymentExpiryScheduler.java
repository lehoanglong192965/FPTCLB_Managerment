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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    @Scheduled(fixedDelayString = "${fcms.ticket.expiry-scan-ms:60000}")
    @Transactional
    public void releaseExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<EventRegistration> expired = registrationRepository
                .findByPaymentStatusAndPaymentExpiresAtBeforeAndIsDeletedFalse(PaymentStatus.PENDING, now);
        List<GuestEventRegistration> expiredGuests = guestRegistrationRepository
                .findByPaymentStatusAndPaymentExpiresAtBeforeAndIsDeletedFalse(PaymentStatus.PENDING, now);
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
            registration.setUpdatedAt(now);
            affectedEvents.add(registration.getEventID());
        }
        guestRegistrationRepository.saveAll(expiredGuests);

        for (Integer eventId : affectedEvents) {
            eventRepository.findByEventIDAndIsDeletedFalse(eventId).ifPresent(event ->
                    allocationService.promoteWaitlisted(eventId, event.getMaxParticipants()));
        }
        log.info("Released {} member and {} guest expired paid-ticket reservations across {} events",
                expired.size(), expiredGuests.size(), affectedEvents.size());
    }
}
