package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.CheckInMethod;
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

    private static final String REGISTRATION_STATUS_REGISTERED = "REGISTERED";
    private static final String ATTENDANCE_STATUS_ABSENT = "Absent";

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void markAbsences() {
        List<Event> completedEvents = eventRepository.findByEventStatusAndIsDeletedFalse("Completed");

        for (Event event : completedEvents) {
            AttendanceSession session = attendanceSessionRepository.findByEventID(event.getEventID())
                    .orElse(null);
            if (session == null) {
                continue;
            }

            List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID());
            for (EventRegistration reg : registrations) {
                if (reg.getUserID() == null || !REGISTRATION_STATUS_REGISTERED.equals(reg.getStatus())) {
                    continue;
                }
                attendanceRecordRepository
                        .findBySessionIDAndRegistrationID(session.getSessionID(), reg.getRegistrationID())
                        .orElseGet(() -> {
                            AttendanceRecord absenceRecord = new AttendanceRecord();
                            absenceRecord.setSessionID(session.getSessionID());
                            absenceRecord.setUserID(reg.getUserID());
                            absenceRecord.setRegistrationID(reg.getRegistrationID());
                            absenceRecord.setParticipantTypeSnapshotAt(reg.getParticipantTypeSnapshotAt());
                            absenceRecord.setAttendanceStatus(ATTENDANCE_STATUS_ABSENT);
                            absenceRecord.setCheckInMethod(CheckInMethod.AUTO.name());
                            absenceRecord.setCheckedInAt(java.time.LocalDateTime.now());
                            absenceRecord.setMarkedAt(java.time.LocalDateTime.now());
                            return attendanceRecordRepository.save(absenceRecord);
                        });
            }
        }
    }
}
