package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.ClubMembership;
import com.fptu.fcms.entity.ClubRole;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReportReminderLog;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.ClubRoleRepository;
import com.fptu.fcms.repository.EventReportReminderLogRepository;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventReportReminderScheduler {

    private static final String REMINDER_TYPE = "BR_E05_REPORT_REMINDER";
    private static final List<String> REPORT_PENDING_STATUSES = List.of("Approved", "Completed");
    private static final List<String> BOARD_ROLE_NAMES = List.of("Leader", "ViceLeader");

    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final EventReportReminderLogRepository reminderLogRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final ClubMembershipRepository clubMembershipRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void remindMissingEventReports() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(7);
        List<Event> events = eventRepository.findReportOverdueEvents(threshold, REPORT_PENDING_STATUSES);

        for (Event event : events) {
            try {
                if (eventReportRepository.existsByEventIDAndIsDeletedFalse(event.getEventID())) {
                    continue;
                }
                if (reminderLogRepository.existsByEventIDAndReminderTypeAndIsDeletedFalse(event.getEventID(), REMINDER_TYPE)) {
                    continue;
                }

                List<String> recipientEmails = findBoardRecipientEmails(event);
                if (recipientEmails.isEmpty()) {
                    log.warn("No board recipient found for event id={}", event.getEventID());
                    continue;
                }

                recipientEmails.forEach(email -> emailService.sendEventReportReminderEmail(email, event.getEventName()));
                saveReminderLog(event, recipientEmails);
            } catch (Exception ex) {
                log.error("Failed to process event report reminder for event id={}", event.getEventID(), ex);
            }
        }
    }

    private List<String> findBoardRecipientEmails(Event event) {
        List<Integer> roleIDs = new ArrayList<>();
        for (String roleName : BOARD_ROLE_NAMES) {
            Optional<ClubRole> role = clubRoleRepository.findByRoleNameAndIsDeletedFalse(roleName);
            role.map(ClubRole::getClubRoleID).ifPresent(roleIDs::add);
        }

        if (roleIDs.isEmpty()) {
            return List.of();
        }

        Set<String> emails = new LinkedHashSet<>();
        List<ClubMembership> memberships = clubMembershipRepository
                .findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
                        event.getClubID(),
                        event.getSemesterID(),
                        roleIDs
                );

        for (ClubMembership membership : memberships) {
            userRepository.findByUserIDAndIsDeletedFalse(membership.getUserID())
                    .filter(user -> "Active".equals(user.getAccountStatus()))
                    .map(UserAccount::getEmail)
                    .filter(email -> email != null && !email.isBlank())
                    .ifPresent(emails::add);
        }

        return List.copyOf(emails);
    }

    private void saveReminderLog(Event event, List<String> recipientEmails) {
        EventReportReminderLog log = new EventReportReminderLog();
        log.setEventID(event.getEventID());
        log.setReminderType(REMINDER_TYPE);
        log.setSentAt(LocalDateTime.now());
        log.setRecipientEmails(String.join(",", recipientEmails));
        log.setIsDeleted(false);
        reminderLogRepository.save(log);
    }
}
