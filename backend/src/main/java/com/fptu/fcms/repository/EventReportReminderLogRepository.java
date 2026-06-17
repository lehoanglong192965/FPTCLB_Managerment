package com.fptu.fcms.repository;

import com.fptu.fcms.entity.EventReportReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventReportReminderLogRepository extends JpaRepository<EventReportReminderLog, Integer> {
    boolean existsByEventIDAndReminderTypeAndIsDeletedFalse(Integer eventID, String reminderType);
}
