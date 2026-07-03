package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EventAbsenceScheduler {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

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

            List<EventRegistration> registrations = registrationRepository.findByEventIDAndIsDeletedFalse(event.getEventID());
            for (EventRegistration reg : registrations) {
                if (!isCountedRegistration(reg)) {
                    continue;
                }
                attendanceRecordRepository
                        .findBySessionIDAndRegistrationID(session.getSessionID(), reg.getRegistrationID())
                        .orElseGet(() -> createAbsenceRecord(session, reg));
            }
        }
    }

    private AttendanceRecord createAbsenceRecord(AttendanceSession session, EventRegistration reg) {
        LocalDateTime now = LocalDateTime.now();
        AttendanceRecord absenceRecord = new AttendanceRecord();
        absenceRecord.setSessionID(session.getSessionID());
        absenceRecord.setUserID(reg.getUserID());
        absenceRecord.setRegistrationID(reg.getRegistrationID());
        absenceRecord.setParticipantTypeSnapshotAt(reg.getParticipantTypeSnapshotAt());
        absenceRecord.setAttendanceStatus(AttendanceStatus.ABSENT);
        absenceRecord.setCheckInMethod(CheckInMethod.AUTO);
        absenceRecord.setCheckedInAt(now);
        absenceRecord.setMarkedAt(now);
        return attendanceRecordRepository.save(absenceRecord);
    }

    private boolean isCountedRegistration(EventRegistration registration) {
        RegistrationStatus status = registration == null ? null : registration.getRegistrationStatus();
        if (status == null && registration != null && registration.getStatus() != null) {
            status = RegistrationStatus.fromValue(registration.getStatus());
        }
        if (registration == null || registration.getUserID() == null || status == null) {
            return false;
        }
        return RegistrationStatus.CONFIRMED.equals(status)
                || RegistrationStatus.REGISTERED.equals(status);
    }
}
