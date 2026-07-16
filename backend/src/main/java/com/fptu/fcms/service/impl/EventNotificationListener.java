package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Club;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.Notification;
import com.fptu.fcms.entity.NotificationRecipient;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.event.EventLifecycleChangedEvent;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.NotificationRecipientRepository;
import com.fptu.fcms.repository.NotificationRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventNotificationListener {

    private static final String SYSTEM_ROLE_ADMIN = "Admin";
    private static final String SYSTEM_ROLE_ICPDP = "ICPDP";

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserRepository userRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final ClubRepository clubRepository;

    @EventListener
    @Transactional
    public void onEventLifecycleChanged(EventLifecycleChangedEvent event) {
        if (!List.of(EventStatus.APPROVED, EventStatus.REJECTED, EventStatus.CANCELLED).contains(event.newStatus())) {
            return;
        }

        Club club = event.clubId() == null ? null : clubRepository.findByClubIDAndIsDeletedFalse(event.clubId()).orElse(null);

        List<UserAccount> recipients = new ArrayList<>();
        if (event.creatorId() != null) {
            userRepository.findByUserIDAndIsDeletedFalse(event.creatorId()).ifPresent(recipients::add);
        }
        recipients.addAll(resolveSystemRecipients(SYSTEM_ROLE_ADMIN));
        recipients.addAll(resolveSystemRecipients(SYSTEM_ROLE_ICPDP));
        recipients = new ArrayList<>(new LinkedHashSet<>(recipients));

        if (recipients.isEmpty()) {
            return;
        }

        UserAccount creator = recipients.get(0);
        Notification notification = new Notification();
        notification.setClub(club);
        notification.setCreatedBy(creator);
        notification.setTitle(buildTitle(event.newStatus(), club));
        notification.setNotificationType("EVENT_" + event.newStatus().name());
        notification.setContent(buildContent(event.newStatus(), event.reason()));
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsDeleted(false);

        Notification saved = notificationRepository.save(notification);
        List<NotificationRecipient> rows = recipients.stream().map(user -> {
            NotificationRecipient row = new NotificationRecipient();
            row.setNotification(saved);
            row.setUser(user);
            row.setIsRead(false);
            row.setCreatedAt(LocalDateTime.now());
            return row;
        }).toList();
        notificationRecipientRepository.saveAll(rows);
    }

    private List<UserAccount> resolveSystemRecipients(String roleName) {
        return systemRoleRepository.findByRoleName(roleName)
                .map(role -> userRepository.findByRoleIDAndIsDeletedFalse(role.getRoleID()))
                .orElseGet(List::of);
    }

    private String buildTitle(EventStatus status, Club club) {
        String clubName = club == null ? "Sự kiện" : club.getClubName();
        return switch (status) {
            case APPROVED -> "Sự kiện được duyệt: " + clubName;
            case REJECTED -> "Sự kiện bị từ chối: " + clubName;
            case CANCELLED -> "Sự kiện đã hủy: " + clubName;
            default -> "Cập nhật sự kiện: " + clubName;
        };
    }

    private String buildContent(EventStatus status, String reason) {
        String suffix = (reason == null || reason.isBlank()) ? "" : "\nLý do: " + reason;
        return switch (status) {
            case APPROVED -> "Sự kiện đã được phê duyệt." + suffix;
            case REJECTED -> "Sự kiện đã bị từ chối." + suffix;
            case CANCELLED -> "Sự kiện đã bị hủy." + suffix;
            default -> "Trạng thái sự kiện đã thay đổi." + suffix;
        };
    }
}
