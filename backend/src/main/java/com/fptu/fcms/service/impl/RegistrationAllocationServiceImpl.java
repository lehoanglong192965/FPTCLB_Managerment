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
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.enums.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;
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
    private final EmailService emailService;

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

        List<WaitlistEntry> waitlisted = new ArrayList<>();
        registrationRepository
                .findByEventIDAndRegistrationStatusAndIsDeletedFalseOrderByRegisteredAtAsc(
                        eventId, RegistrationLifecycle.STATUS_WAITLISTED)
                .forEach(item -> waitlisted.add(new WaitlistEntry(item.getRegisteredAt(), item, null)));
        guestRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .filter(item -> RegistrationLifecycle.STATUS_WAITLISTED.equals(item.getRegistrationStatus()))
                .forEach(item -> waitlisted.add(new WaitlistEntry(item.getRegisteredAt(), null, item)));
        waitlisted.sort(Comparator.comparing(WaitlistEntry::registeredAt,
                Comparator.nullsLast(Comparator.naturalOrder())));

        int promoted = 0;
        for (WaitlistEntry entry : waitlisted) {
            if (confirmedCount >= maxParticipants) {
                break;
            }
            LocalDateTime now = LocalDateTime.now();
            if (entry.member() != null) {
                EventRegistration registration = entry.member();
                registration.setStatus(RegistrationLifecycle.STATUS_CONFIRMED.name());
                registration.setRegistrationStatus(RegistrationLifecycle.STATUS_CONFIRMED);
                if (PaymentStatus.AWAITING_ELIGIBILITY.equals(registration.getPaymentStatus())) {
                    registration.setPaymentStatus(PaymentStatus.PENDING);
                    registration.setPaymentExpiresAt(now.plusMinutes(30));
                }
                boolean paymentAllowsTicket = registration.getPaymentStatus() == null
                        || PaymentStatus.NOT_REQUIRED.equals(registration.getPaymentStatus())
                        || PaymentStatus.PAID.equals(registration.getPaymentStatus());
                if (paymentAllowsTicket) {
                    if (registration.getTicketCode() == null || registration.getTicketCode().isBlank()) {
                        registration.setTicketCode(UUID.randomUUID().toString());
                    }
                    if (registration.getTicketIssuedAt() == null) registration.setTicketIssuedAt(now);
                }
                registration.setWaitlistPosition(null);
                registration.setUpdatedAt(now);
                registrationRepository.save(registration);
                notifyPromotion(registration);
                notifyMemberPromotionByEmail(registration);
            } else {
                GuestEventRegistration registration = entry.guest();
                registration.setStatus(RegistrationLifecycle.STATUS_CONFIRMED.name());
                registration.setRegistrationStatus(RegistrationLifecycle.STATUS_CONFIRMED);
                if (PaymentStatus.AWAITING_ELIGIBILITY.equals(registration.getPaymentStatus())) {
                    registration.setPaymentStatus(PaymentStatus.PENDING);
                    registration.setPaymentExpiresAt(now.plusMinutes(30));
                    if (registration.getPaymentReference() == null || registration.getPaymentReference().isBlank()) {
                        registration.setPaymentReference("GUEST"
                                + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase());
                    }
                }
                boolean paymentAllowsTicket = registration.getPaymentStatus() == null
                        || PaymentStatus.NOT_REQUIRED.equals(registration.getPaymentStatus())
                        || PaymentStatus.PAID.equals(registration.getPaymentStatus());
                if (paymentAllowsTicket) {
                    if (registration.getTicketCode() == null || registration.getTicketCode().isBlank()) {
                        registration.setTicketCode(UUID.randomUUID().toString());
                    }
                    if (registration.getTicketIssuedAt() == null) registration.setTicketIssuedAt(now);
                }
                registration.setWaitlistPosition(null);
                registration.setUpdatedAt(now);
                if (PaymentStatus.PENDING.equals(registration.getPaymentStatus())) {
                    registration.setPaymentInstructionSentAt(now);
                }
                GuestEventRegistration saved = guestRegistrationRepository.save(registration);
                notifyGuestPromotionByEmail(saved);
            }
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

    private void notifyMemberPromotionByEmail(EventRegistration registration) {
        Event event = eventRepository.findById(registration.getEventID()).orElse(null);
        if (event == null) return;
        String email = registration.getGuestEmail();
        String name = registration.getGuestFullName();
        if (registration.getUserID() != null) {
            UserAccount user = userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);
            if (user != null) {
                email = user.getEmail();
                name = user.getFullName();
            }
        }
        if (!StringUtils.hasText(email)) return;
        String recipient = email;
        String recipientName = name;
        if (PaymentStatus.PENDING.equals(registration.getPaymentStatus())) {
            sendAfterCommit(() -> emailService.sendSimpleEmail(recipient,
                    "Đã có suất tham gia - cần thanh toán vé",
                    "Bạn đã được chuyển từ danh sách chờ sang danh sách xác nhận cho sự kiện \""
                            + event.getEventName() + "\". Số tiền: " + registration.getAmountDue() + " "
                            + registration.getPaymentCurrency() + ". Mã chuyển khoản: "
                            + registration.getPaymentReference() + ". Hạn thanh toán: "
                            + registration.getPaymentExpiresAt() + "."));
        } else if (StringUtils.hasText(registration.getTicketCode())) {
            sendAfterCommit(() -> emailService.sendEventTicketConfirmationEmail(
                    recipient, recipientName, event.getEventName(), event.getStartDate(), event.getEndDate(),
                    event.getLocation(), registration.getTicketCode(), registration.getAmountPaid(),
                    registration.getPaymentCurrency()));
        }
    }

    private void notifyGuestPromotionByEmail(GuestEventRegistration registration) {
        Event event = eventRepository.findById(registration.getEventID()).orElse(null);
        if (event == null || !StringUtils.hasText(registration.getGuestEmail())) return;
        if (PaymentStatus.PENDING.equals(registration.getPaymentStatus())) {
            sendAfterCommit(() -> emailService.sendSimpleEmail(registration.getGuestEmail(),
                    "Đã có suất tham gia - cần thanh toán vé",
                    "Bạn đã được chuyển từ danh sách chờ sang danh sách xác nhận cho sự kiện \""
                            + event.getEventName() + "\". Số tiền: " + registration.getAmountDue() + " "
                            + registration.getPaymentCurrency() + ". Mã chuyển khoản: "
                            + registration.getPaymentReference() + ". Hạn thanh toán: "
                            + registration.getPaymentExpiresAt() + ". Dùng mã đăng ký "
                            + registration.getRegistrationCode() + " tại trang tra cứu vé khách để tiếp tục."));
        } else if (StringUtils.hasText(registration.getTicketCode())) {
            sendAfterCommit(() -> emailService.sendEventTicketConfirmationEmail(
                    registration.getGuestEmail(), registration.getGuestFullName(), event.getEventName(),
                    event.getStartDate(), event.getEndDate(), event.getLocation(), registration.getTicketCode(),
                    registration.getAmountPaid(), registration.getPaymentCurrency()));
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

    private record WaitlistEntry(LocalDateTime registeredAt, EventRegistration member,
                                 GuestEventRegistration guest) {
    }
}
