package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventNotificationDispatch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventNotificationDispatchRepository extends JpaRepository<EventNotificationDispatch, Long> {
    boolean existsByEventIDAndRecipientKeyAndNotificationType(Integer eventID, String recipientKey, String notificationType);
}
