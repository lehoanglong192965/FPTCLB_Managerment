package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EventSlaScheduler {

    private final EventRepository eventRepository;
    private final EmailService emailService;

    // [BR-G02] Chạy hằng ngày báo cáo SLA: Tự động gửi cảnh báo khẩn cấp lên Admin 
    // nếu có đề xuất sự kiện bị kẹt ở trạng thái Pending quá 7 ngày.
    @Scheduled(cron = "0 0 0 * * ?") // Chạy lúc 00:00 mỗi ngày
    public void checkPendingEventSla() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Event> stuckEvents = eventRepository.findByEventStatusAndCreatedAtBeforeAndIsDeletedFalse(
                EventStatus.PENDING, sevenDaysAgo
        );

        if (!stuckEvents.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Cảnh báo khẩn cấp SLA (BR-G02): Có ").append(stuckEvents.size())
              .append(" sự kiện đang bị kẹt ở trạng thái Pending quá 7 ngày:\n\n");

            for (Event e : stuckEvents) {
                sb.append("- [").append(e.getEventCode()).append("] ")
                  .append(e.getEventName()).append(" (Ngày tạo: ")
                  .append(e.getCreatedAt()).append(")\n");
            }

            emailService.sendSimpleEmail("admin@fpt.edu.vn", "🚨 CẢNH BÁO SLA: Đề xuất sự kiện bị tồn đọng", sb.toString());
        }
    }
}
