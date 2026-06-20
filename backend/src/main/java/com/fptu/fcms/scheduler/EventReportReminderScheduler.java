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
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventReportReminderScheduler {

    private static final String STATUS_APPROVED = "Approved";
    private static final String STATUS_COMPLETED = "Completed";
    private static final String ROLE_LEADER = "Leader";
    private static final String ROLE_VICE_LEADER = "ViceLeader";
    private static final String REMINDER_TYPE = "EVENT_REPORT_OVERDUE";

    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final EventReportReminderLogRepository reminderLogRepository;
    private final ClubMembershipRepository membershipRepository;
    private final ClubRoleRepository clubRoleRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * BR-E05: Mỗi ngày 08:00 nhắc Ban điều hành CLB upload report
     * cho event Approved/Completed đã kết thúc quá 7 ngày và chưa có EventReport.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void remindOverdueEventReports() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(7);
        List<Event> overdueEvents = eventRepository.findByEndDateBeforeAndEventStatusInAndIsDeletedFalse(
                threshold,
                List.of(STATUS_APPROVED, STATUS_COMPLETED)
        );

        for (Event event : overdueEvents) {
            if (eventReportRepository.existsByEventIDAndIsDeletedFalse(event.getEventID())) {
                continue;
            }
            if (reminderLogRepository.existsByEventIDAndReminderTypeAndIsDeletedFalse(event.getEventID(), REMINDER_TYPE)) {
                continue;
            }

            List<String> recipientEmails = findBoardEmails(event);
            if (recipientEmails.isEmpty()) {
                log.warn("No board recipient found for overdue event report reminder. eventID={}", event.getEventID());
                continue;
            }

            String subject = "Nhắc upload báo cáo sự kiện";
            String body = "Sự kiện " + event.getEventName() + " đã kết thúc quá 7 ngày.\n"
                    + "Vui lòng upload báo cáo tổng kết sự kiện lên hệ thống.";

            recipientEmails.forEach(email -> emailService.sendSimpleEmail(email, subject, body));
            saveReminderLog(event, recipientEmails);
        }
    }

    /**
     * Người nhận là Leader và ViceLeader active của chính CLB trong học kỳ của event.
     */
    private List<String> findBoardEmails(Event event) {
        List<Integer> boardRoleIds = Stream.of(ROLE_LEADER, ROLE_VICE_LEADER)
                .map(roleName -> clubRoleRepository.findByRoleNameAndIsDeletedFalse(roleName).orElse(null))
                .filter(Objects::nonNull)
                .map(ClubRole::getClubRoleID)
                .toList();

        if (boardRoleIds.isEmpty()) {
            return List.of();
        }

        List<Integer> userIds = membershipRepository
                .findByClubIDAndSemesterIDAndClubRoleIDInAndIsDeletedFalse(
                        event.getClubID(),
                        event.getSemesterID(),
                        boardRoleIds
                )
                .stream()
                .map(ClubMembership::getUserID)
                .distinct()
                .toList();

        if (userIds.isEmpty()) {
            return List.of();
        }

        return userRepository.findAllByUserIDIn(userIds)
                .stream()
                .map(UserAccount::getEmail)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Lưu log để scheduler không gửi lại cùng một reminder mỗi ngày.
     */
    private void saveReminderLog(Event event, List<String> recipientEmails) {
        EventReportReminderLog reminderLog = new EventReportReminderLog();
        reminderLog.setEventID(event.getEventID());
        reminderLog.setReminderType(REMINDER_TYPE);
        reminderLog.setSentAt(LocalDateTime.now());
        reminderLog.setRecipientEmails(String.join(",", recipientEmails));
        reminderLog.setIsDeleted(false);
        reminderLogRepository.save(reminderLog);
    }
}