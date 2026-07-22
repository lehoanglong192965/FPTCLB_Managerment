package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.*;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.repository.NotificationRepository;
import com.fptu.fcms.repository.NotificationRecipientRepository;
import com.fptu.fcms.service.event.RegistrationAllocationResult;
import com.fptu.fcms.service.event.RegistrationAllocationService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import com.fptu.fcms.enums.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationAllocationServiceImpl implements RegistrationAllocationService {

    private final EventRegistrationRepository registrationRepository;
    private final GuestEventRegistrationRepository guestRegistrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;

    @Override
    @Transactional(readOnly = true)
    public RegistrationAllocationResult allocateInitial(Integer eventId, Integer maxParticipants, boolean requiresApproval) {
        validateInputs(eventId, maxParticipants);

        if (requiresApproval) {
            return new RegistrationAllocationResult(RegistrationLifecycle.STATUS_PENDING_APPROVAL, false);
        }

        return hasAvailableSeat(eventId, maxParticipants)
                ? new RegistrationAllocationResult(RegistrationLifecycle.STATUS_CONFIRMED, true)
                : new RegistrationAllocationResult(RegistrationLifecycle.STATUS_WAITLISTED, false);
    }

    @Override
    @Transactional(readOnly = true)
    public RegistrationAllocationResult allocateOnApproval(Integer eventId, Integer maxParticipants) {
        validateInputs(eventId, maxParticipants);

        return hasAvailableSeat(eventId, maxParticipants)
                ? new RegistrationAllocationResult(RegistrationLifecycle.STATUS_CONFIRMED, true)
                : new RegistrationAllocationResult(RegistrationLifecycle.STATUS_WAITLISTED, false);
    }

    @Override
    @Transactional
    public int promoteWaitlisted(Integer eventId, Integer maxParticipants) {
        validateInputs(eventId, maxParticipants);

        long confirmedCount = countConfirmedRegistrations(eventId);
        if (confirmedCount >= maxParticipants) {
            return 0;
        }

        List<EventRegistration> waitlisted = registrationRepository
                .findByEventIDAndRegistrationStatusAndIsDeletedFalseOrderByRegisteredAtAsc(eventId, RegistrationLifecycle.STATUS_WAITLISTED);

        int promoted = 0;
        for (EventRegistration registration : waitlisted) {
            if (confirmedCount >= maxParticipants) {
                break;
            }
            registration.setStatus(RegistrationLifecycle.STATUS_CONFIRMED.name());
            registration.setRegistrationStatus(RegistrationLifecycle.STATUS_CONFIRMED);
            if (PaymentStatus.AWAITING_ELIGIBILITY.equals(registration.getPaymentStatus())) {
                registration.setPaymentStatus(PaymentStatus.PENDING);
                registration.setPaymentExpiresAt(LocalDateTime.now().plusMinutes(30));
            }
            boolean paymentAllowsTicket = registration.getPaymentStatus() == null
                    || PaymentStatus.NOT_REQUIRED.equals(registration.getPaymentStatus())
                    || PaymentStatus.PAID.equals(registration.getPaymentStatus());
            if (paymentAllowsTicket) {
                if (registration.getTicketCode() == null || registration.getTicketCode().isBlank()) {
                    registration.setTicketCode(UUID.randomUUID().toString());
                }
                if (registration.getTicketIssuedAt() == null) {
                    registration.setTicketIssuedAt(LocalDateTime.now());
                }
            }
            registration.setWaitlistPosition(null);
            registration.setUpdatedAt(LocalDateTime.now());
            registrationRepository.save(registration);
            notifyPromotion(registration);
            confirmedCount++;
            promoted++;
        }
        return promoted;
    }

    private void notifyPromotion(EventRegistration registration) {
        UserAccount user = userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);
        Event event = eventRepository.findById(registration.getEventID()).orElse(null);
        if (user == null || event == null) return;
        Notification notification = new Notification();
        notification.setCreatedBy(user);
        notification.setTitle("Bạn đã có suất tham gia sự kiện");
        notification.setNotificationType("WAITLIST_PROMOTED");
        notification.setContent("Bạn đã được chuyển từ danh sách chờ sang xác nhận tham gia sự kiện \"" + event.getEventName() + "\".");
        notification.setActionUrl("/events/" + event.getEventID());
        notification.setActionLabel("Xem chi tiết");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsDeleted(false);
        Notification saved = notificationRepository.save(notification);
        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setNotification(saved);
        recipient.setUser(user);
        recipient.setIsRead(false);
        recipient.setCreatedAt(LocalDateTime.now());
        notificationRecipientRepository.save(recipient);
    }

    private boolean hasAvailableSeat(Integer eventId, Integer maxParticipants) {
        if (maxParticipants == 0) {
            return false;
        }
        long confirmedCount = countConfirmedRegistrations(eventId);
        return confirmedCount < maxParticipants;
    }

    private long countConfirmedRegistrations(Integer eventId) {
        return registrationRepository.countByEventIDAndRegistrationStatusInAndCapacityExemptFalseAndIsDeletedFalse(
                eventId,
                RegistrationLifecycle.CONFIRMED_STATUSES
        ) + guestRegistrationRepository.countByEventIDAndRegistrationStatusInAndIsDeletedFalse(
                eventId,
                RegistrationLifecycle.CONFIRMED_STATUSES
        );
    }

    private void validateInputs(Integer eventId, Integer maxParticipants) {
        if (eventId == null) {
            throw new IllegalArgumentException("eventId is required.");
        }
        if (maxParticipants == null) {
            throw new IllegalArgumentException("maxParticipants is required.");
        }
        if (maxParticipants < 0) {
            throw new IllegalArgumentException("maxParticipants cannot be negative.");
        }
    }
}
