package com.fptu.fcms.service;

import com.fptu.fcms.entity.RecruitmentCycle;
import com.fptu.fcms.entity.RecruitmentReminder;
import com.fptu.fcms.repository.RecruitmentReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogNotificationService implements NotificationService {

    private final RecruitmentReminderRepository reminderRepository;

    @Override
    @Transactional
    public void notifyAdminCloseOrExtend(RecruitmentCycle cycle) {
        String message = String.format("Recruitment cycle %s (id=%d) started at %s exceeded 15 days: please Close or Extend.",
                cycle.getTitle(),
                cycle.getCycleID(),
                cycle.getStartDate());

        // Persist a reminder audit
        RecruitmentReminder r = new RecruitmentReminder();
        r.setCycleID(cycle.getCycleID());
        r.setSentAt(LocalDateTime.now());
        r.setChannel("LOG");
        r.setStatus("SENT");
        r.setMessage(message);

        reminderRepository.save(r);

        // Also log so operators see it in logs
        log.info("[RecruitmentReminder] {}", message);
    }
}
