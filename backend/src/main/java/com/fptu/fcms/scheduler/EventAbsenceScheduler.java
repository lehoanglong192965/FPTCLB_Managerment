package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.AttendanceSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EventAbsenceScheduler {

    private final EventRepository eventRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceSessionService attendanceSessionService;

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void markAbsences() {
        List<Event> completedEvents = eventRepository.findByEventStatusAndIsDeletedFalse(EventStatus.COMPLETED);

        for (Event event : completedEvents) {
            AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID())
                    .orElse(null);
            if (session == null) {
                continue;
            }

            if (!AttendanceSessionStatus.CLOSED.equals(session.getStatus())) {
                attendanceSessionService.finalizeAttendanceForEventAutomatically(event.getEventID());
            }
        }
    }
}
