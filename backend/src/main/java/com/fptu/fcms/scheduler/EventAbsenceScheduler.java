package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EventAbsenceScheduler {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    @Scheduled(cron = "0 0 1 * * ?") // Chạy lúc 01:00 mỗi ngày
    @Transactional
    public void markAbsences() {
        List<Event> completedEvents = eventRepository.findByEventStatus("COMPLETED");

        for (Event event : completedEvents) {
            AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID())
                    .orElse(null);
            if (session == null) continue;

            List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID());
            for (EventRegistration reg : registrations) {
                if (attendanceRecordRepository.findBySessionIDAndUserID(session.getSessionID(), reg.getUserID()).isEmpty()) {
                    AttendanceRecord absenceRecord = new AttendanceRecord();
                    absenceRecord.setSessionID(session.getSessionID());
                    absenceRecord.setUserID(reg.getUserID());
                    absenceRecord.setAttendanceStatus("Absent");
                    attendanceRecordRepository.save(absenceRecord);
                }
            }
        }
    }
}
