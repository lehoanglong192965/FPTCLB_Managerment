package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.*;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.*;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EventReminderScheduler {
    private static final List<EventStatus> ACTIVE_EVENT_STATUSES = List.of(
            EventStatus.APPROVED, EventStatus.REGISTRATION_OPEN, EventStatus.REGISTRATION_CLOSED);
    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final GuestEventRegistrationRepository guestRegistrationRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final EventNotificationDispatchRepository dispatchRepository;
    private final EmailService emailService;

    @Scheduled(cron = "${fcms.scheduler.event-reminder.cron:0 */10 * * * ?}")
    @Transactional
    public void sendDueReminders() {
        LocalDateTime now = LocalDateTime.now();
        for (Event event : eventRepository.findByEventStatusInAndIsDeletedFalse(ACTIVE_EVENT_STATUSES)) {
            sendWindow(event, now, 24, "EVENT_REMINDER_24H");
            sendWindow(event, now, 1, "EVENT_REMINDER_1H");
        }
    }

    private void sendWindow(Event event, LocalDateTime now, int hours, String type) {
        if (event.getStartDate() == null) return;
        LocalDateTime due = event.getStartDate().minusHours(hours);
        if (now.isBefore(due) || !now.isBefore(due.plusMinutes(15))) return;
        String content = "Sự kiện \"" + event.getEventName() + "\" sẽ bắt đầu lúc "
                + event.getStartDate().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                + (event.getLocation() == null ? "." : ". Địa điểm: " + event.getLocation() + ".");

        registrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID()).stream()
                .filter(r -> RegistrationLifecycle.CONFIRMED_STATUSES.contains(r.getRegistrationStatus()))
                .forEach(r -> userRepository.findByUserIDAndIsDeletedFalse(r.getUserID())
                        .ifPresent(user -> notifyMember(event, user, type, content)));
        guestRegistrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID()).stream()
                .filter(r -> RegistrationLifecycle.CONFIRMED_STATUSES.contains(r.getRegistrationStatus()))
                .forEach(r -> notifyGuest(event, r, type, content));
    }

    private void notifyMember(Event event, UserAccount user, String type, String content) {
        String key = "USER:" + user.getUserID();
        if (dispatchRepository.existsByEventIDAndRecipientKeyAndNotificationType(event.getEventID(), key, type)) return;
        Notification notification = new Notification();
        notification.setCreatedBy(user);
        notification.setTitle("Nhắc lịch sự kiện");
        notification.setNotificationType(type);
        notification.setContent(content);
        notification.setActionUrl("/events/" + event.getEventID());
        notification.setActionLabel("Xem chi tiết");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsDeleted(false);
        Notification saved = notificationRepository.save(notification);
        NotificationRecipient recipient = new NotificationRecipient();
        recipient.setNotification(saved); recipient.setUser(user); recipient.setIsRead(false); recipient.setCreatedAt(LocalDateTime.now());
        notificationRecipientRepository.save(recipient);
        emailService.sendSimpleEmail(user.getEmail(), "Nhắc lịch: " + event.getEventName(), content);
        recordDispatch(event.getEventID(), key, type);
    }

    private void notifyGuest(Event event, GuestEventRegistration guest, String type, String content) {
        String key = "GUEST:" + guest.getGuestRegistrationID();
        if (dispatchRepository.existsByEventIDAndRecipientKeyAndNotificationType(event.getEventID(), key, type)) return;
        emailService.sendSimpleEmail(guest.getGuestEmail(), "Nhắc lịch: " + event.getEventName(), content);
        recordDispatch(event.getEventID(), key, type);
    }

    private void recordDispatch(Integer eventId, String key, String type) {
        EventNotificationDispatch row = new EventNotificationDispatch();
        row.setEventID(eventId); row.setRecipientKey(key); row.setNotificationType(type); row.setSentAt(LocalDateTime.now());
        dispatchRepository.save(row);
    }
}
