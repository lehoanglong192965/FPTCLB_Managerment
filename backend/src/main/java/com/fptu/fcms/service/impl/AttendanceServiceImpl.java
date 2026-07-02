package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.AttendanceService;
import com.fptu.fcms.service.AttendanceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private static final String STATUS_ONGOING = "Ongoing";

    private final AttendanceTokenService attendanceTokenService;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;

    @Override
    @Transactional
    public AttendanceCheckInResponse checkIn(String qrToken) {
        AttendanceTokenService.AttendanceTokenClaims claims = attendanceTokenService.parseAndValidateQrToken(qrToken);

        if (claims.eventId() == null || claims.userId() == null) {
            throw new IllegalArgumentException("Invalid QR token payload.");
        }

        Event event = eventRepository.findByEventIDAndIsDeletedFalse(claims.eventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));
        if (!STATUS_ONGOING.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Event must be Ongoing for check-in.");
        }

        EventRegistration registration = eventRegistrationRepository
                .findByEventIDAndUserIDAndIsDeletedFalse(claims.eventId(), claims.userId())
                .orElseThrow(() -> new IllegalArgumentException("User is not registered for this event."));

        AttendanceSession session = attendanceSessionRepository.findByEventID(claims.eventId())
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not found."));

        if (attendanceRecordRepository.findBySessionIDAndRegistrationID(session.getSessionID(), registration.getRegistrationID()).isPresent()) {
            throw new IllegalArgumentException("User already checked in.");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(session.getSessionID());
        record.setUserID(claims.userId());
        record.setRegistrationID(registration.getRegistrationID());
        record.setParticipantTypeSnapshotAt(registration.getParticipantTypeSnapshotAt());
        record.setAttendanceStatus("Present");
        record.setCheckInMethod(CheckInMethod.QR.name());
        record.setCheckedInBy(claims.userId());
        record.setCheckedInAt(LocalDateTime.now());
        record.setManualReason(null);
        record.setMarkedAt(LocalDateTime.now());
        record.setIsDeleted(false);

        try {
            attendanceRecordRepository.save(record);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("User already checked in.");
        }

        return new AttendanceCheckInResponse(
                event.getEventID(),
                registration.getUserID(),
                "Present",
                "Check-in successful."
        );
    }
}
