package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.AttendanceCheckInRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.VerificationMethod;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.AttendanceService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import com.fptu.fcms.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public AttendanceCheckInResponse checkIn(Integer sessionId, AttendanceCheckInRequest request, Integer actorId) {
        AttendanceSession session = attendanceSessionRepository.findBySessionIDAndIsDeletedFalse(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not found."));
        if (session.getStatus() != AttendanceSessionStatus.OPEN) {
            throw new IllegalArgumentException("Attendance session is not open.");
        }

        Event event = eventRepository.findByEventIDAndIsDeletedFalse(session.getEventID())
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));
        EventStatus eventStatus = EventStatus.fromValue(String.valueOf(event.getEventStatus()));
        if (eventStatus != EventStatus.ONGOING && eventStatus != EventStatus.CHECKIN_OPEN) {
            throw new IllegalArgumentException("Event must be Ongoing for check-in.");
        }

        if (request.getGuestRegistrationId() != null) {
            return checkInGuest(sessionId, event, request, actorId);
        }
        if (request.getRegistrationId() == null) {
            throw new IllegalArgumentException("registrationId is required.");
        }

        EventRegistration registration = (EventRegistration) eventRegistrationRepository.findByRegistrationIDAndIsDeletedFalse(request.getRegistrationId())
                .orElseThrow(() -> new IllegalArgumentException("Registration not found."));
        if (!Objects.equals(registration.getEventID(), event.getEventID())) {
            throw new IllegalArgumentException("Registration does not belong to this attendance session.");
        }
        RegistrationStatus registrationStatus = registration.getRegistrationStatus();
        if (registrationStatus == null && registration.getStatus() != null) {
            registrationStatus = RegistrationStatus.fromValue(registration.getStatus());
        }
        if (!RegistrationLifecycle.CONFIRMED_STATUSES.contains(registrationStatus)) {
            throw new IllegalArgumentException("Registration is not confirmed for check-in.");
        }
        var existingRecord = attendanceRecordRepository.findBySessionIDAndRegistrationID(sessionId, registration.getRegistrationID());
        if (existingRecord.isPresent()) {
            AttendanceRecord existing = existingRecord.get();
            if (existing.getAttendanceStatus() != AttendanceStatus.PRESENT) {
                AttendanceRecord before = snapshot(existing);
                LocalDateTime now = LocalDateTime.now();
                existing.setAttendanceStatus(AttendanceStatus.PRESENT);
                existing.setCheckInMethod(CheckInMethod.STAFF_LOOKUP);
                existing.setVerificationMethod(parseVerificationMethod(request.getVerificationMethod()).name());
                existing.setCheckedInBy(actorId);
                existing.setCheckedInAt(now);
                existing.setMarkedAt(now);
                existing.setUpdatedAt(now);
                attendanceRecordRepository.save(existing);
                auditLogService.record(actorId, "AttendanceRecord", existing.getRecordID(), "ATTENDANCE_CHECK_IN_EXISTING", before, existing, request.getNote());
            }
            return new AttendanceCheckInResponse(
                    event.getEventID(),
                    registration.getRegistrationID(),
                    registration.getUserID(),
                    AttendanceStatus.PRESENT,
                    "Participant already checked in."
            );
        }

        UserAccount user = registration.getUserID() == null
                ? null
                : userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);
        VerificationMethod verificationMethod = parseVerificationMethod(request.getVerificationMethod());
        verifyParticipant(registration, user, verificationMethod, request);

        LocalDateTime now = LocalDateTime.now();
        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(sessionId);
        record.setUserID(registration.getUserID());
        record.setRegistrationID(registration.getRegistrationID());
        record.setParticipantTypeSnapshotAt(registration.getParticipantTypeSnapshotAt());
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        record.setCheckInMethod(CheckInMethod.STAFF_LOOKUP);
        record.setParticipantTypeSnapshot(registration.getUserID() == null ? "GUEST" : registration.getParticipantType().name());
        record.setVerificationMethod(verificationMethod.name());
        record.setCheckedInBy(actorId);
        record.setCheckedInAt(now);
        record.setManualReason(request.getNote());
        record.setNote(request.getNote());
        record.setMarkedAt(now);
        record.setCreatedAt(now);
        record.setIsVerifiedByAI(false);
        record.setIsDeleted(false);

        try {
            AttendanceRecord savedRecord = attendanceRecordRepository.save(record);
            auditLogService.record(actorId, "AttendanceRecord", savedRecord.getRecordID(), "ATTENDANCE_CHECK_IN", null, savedRecord, request.getNote());
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Participant already checked in.");
        }

        return new AttendanceCheckInResponse(
                event.getEventID(),
                registration.getRegistrationID(),
                registration.getUserID(),
                AttendanceStatus.PRESENT,
                "Check-in successful."
        );
    }

    private AttendanceCheckInResponse checkInGuest(
            Integer sessionId,
            Event event,
            AttendanceCheckInRequest request,
            Integer actorId
    ) {
        GuestEventRegistration registration = guestEventRegistrationRepository
                .findByGuestRegistrationIDAndIsDeletedFalse(request.getGuestRegistrationId())
                .orElseThrow(() -> new IllegalArgumentException("Guest registration not found."));
        if (!Objects.equals(registration.getEventID(), event.getEventID())) {
            throw new IllegalArgumentException("Registration does not belong to this attendance session.");
        }
        RegistrationStatus registrationStatus = registration.getRegistrationStatus();
        if (registrationStatus == null && registration.getStatus() != null) {
            registrationStatus = RegistrationStatus.fromValue(registration.getStatus());
        }
        if (!RegistrationLifecycle.CONFIRMED_STATUSES.contains(registrationStatus)) {
            throw new IllegalArgumentException("Registration is not confirmed for check-in.");
        }

        var existingRecord = attendanceRecordRepository.findBySessionIDAndGuestRegistrationID(sessionId, registration.getGuestRegistrationID());
        if (existingRecord.isPresent()) {
            AttendanceRecord existing = existingRecord.get();
            if (existing.getAttendanceStatus() != AttendanceStatus.PRESENT) {
                AttendanceRecord before = snapshot(existing);
                LocalDateTime now = LocalDateTime.now();
                existing.setAttendanceStatus(AttendanceStatus.PRESENT);
                existing.setCheckInMethod(CheckInMethod.STAFF_LOOKUP);
                existing.setVerificationMethod(parseVerificationMethod(request.getVerificationMethod()).name());
                existing.setCheckedInBy(actorId);
                existing.setCheckedInAt(now);
                existing.setMarkedAt(now);
                existing.setUpdatedAt(now);
                attendanceRecordRepository.save(existing);
                auditLogService.record(actorId, "AttendanceRecord", existing.getRecordID(), "ATTENDANCE_CHECK_IN_EXISTING", before, existing, request.getNote());
            }
            return new AttendanceCheckInResponse(
                    event.getEventID(),
                    registration.getGuestRegistrationID(),
                    null,
                    AttendanceStatus.PRESENT,
                    "Participant already checked in."
            );
        }

        VerificationMethod verificationMethod = parseVerificationMethod(request.getVerificationMethod());
        verifyGuestParticipant(registration, verificationMethod, request);

        LocalDateTime now = LocalDateTime.now();
        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(sessionId);
        record.setGuestRegistrationID(registration.getGuestRegistrationID());
        record.setParticipantTypeSnapshotAt(registration.getParticipantTypeSnapshotAt());
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        record.setCheckInMethod(CheckInMethod.STAFF_LOOKUP);
        record.setParticipantTypeSnapshot("GUEST");
        record.setVerificationMethod(verificationMethod.name());
        record.setCheckedInBy(actorId);
        record.setCheckedInAt(now);
        record.setManualReason(request.getNote());
        record.setNote(request.getNote());
        record.setMarkedAt(now);
        record.setCreatedAt(now);
        record.setIsVerifiedByAI(false);
        record.setIsDeleted(false);

        try {
            AttendanceRecord savedRecord = attendanceRecordRepository.save(record);
            auditLogService.record(actorId, "AttendanceRecord", savedRecord.getRecordID(), "ATTENDANCE_CHECK_IN", null, savedRecord, request.getNote());
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Participant already checked in.");
        }

        return new AttendanceCheckInResponse(
                event.getEventID(),
                registration.getGuestRegistrationID(),
                null,
                AttendanceStatus.PRESENT,
                "Check-in successful."
        );
    }

    private void verifyParticipant(
            EventRegistration registration,
            UserAccount user,
            VerificationMethod method,
            AttendanceCheckInRequest request
    ) {
        if (registration.getUserID() == null) {
            if (method != VerificationMethod.PHONE_LAST4 && method != VerificationMethod.MANUAL_OVERRIDE) {
                throw new IllegalArgumentException("Guest check-in requires phone last 4 verification.");
            }
            if (method == VerificationMethod.MANUAL_OVERRIDE) {
                return;
            }
            String phone = registration.getGuestPhone();
            String expectedLast4 = phone == null || phone.length() < 4 ? phone : phone.substring(phone.length() - 4);
            if (!StringUtils.hasText(request.getVerificationValue()) || !request.getVerificationValue().trim().equals(expectedLast4)) {
                throw new IllegalArgumentException("Guest phone verification failed.");
            }
            if (StringUtils.hasText(request.getGuestFullName())
                    && !normalizeSpaces(request.getGuestFullName()).equalsIgnoreCase(normalizeSpaces(registration.getGuestFullName()))) {
                throw new IllegalArgumentException("Guest name verification failed.");
            }
            return;
        }

        if (user == null) {
            throw new IllegalArgumentException("Registered user not found.");
        }
        if (method == VerificationMethod.STUDENT_CARD && StringUtils.hasText(request.getVerificationValue())
                && !request.getVerificationValue().trim().equalsIgnoreCase(user.getStudentId())) {
            throw new IllegalArgumentException("Student card verification failed.");
        }
        if (method == VerificationMethod.FPT_ACCOUNT && StringUtils.hasText(request.getVerificationValue())) {
            String value = request.getVerificationValue().trim().toLowerCase(Locale.ROOT);
            String email = user.getEmail() == null ? "" : user.getEmail().trim().toLowerCase(Locale.ROOT);
            String studentId = user.getStudentId() == null ? "" : user.getStudentId().trim().toLowerCase(Locale.ROOT);
            if (!value.equals(email) && !value.equals(studentId)) {
                throw new IllegalArgumentException("FPT account verification failed.");
            }
        }
    }

    private void verifyGuestParticipant(
            GuestEventRegistration registration,
            VerificationMethod method,
            AttendanceCheckInRequest request
    ) {
        if (method != VerificationMethod.PHONE_LAST4 && method != VerificationMethod.MANUAL_OVERRIDE) {
            throw new IllegalArgumentException("Guest check-in requires phone last 4 verification.");
        }
        if (method == VerificationMethod.MANUAL_OVERRIDE) {
            return;
        }
        String phone = StringUtils.hasText(registration.getGuestPhoneNormalized())
                ? registration.getGuestPhoneNormalized()
                : registration.getGuestPhone();
        String expectedLast4 = phone == null || phone.length() < 4 ? phone : phone.substring(phone.length() - 4);
        if (!StringUtils.hasText(request.getVerificationValue()) || !request.getVerificationValue().trim().equals(expectedLast4)) {
            throw new IllegalArgumentException("Guest phone verification failed.");
        }
        if (StringUtils.hasText(request.getGuestFullName())
                && !normalizeSpaces(request.getGuestFullName()).equalsIgnoreCase(normalizeSpaces(registration.getGuestFullName()))) {
            throw new IllegalArgumentException("Guest name verification failed.");
        }
    }

    private AttendanceRecord snapshot(AttendanceRecord record) {
        AttendanceRecord copy = new AttendanceRecord();
        copy.setRecordID(record.getRecordID());
        copy.setSessionID(record.getSessionID());
        copy.setRegistrationID(record.getRegistrationID());
        copy.setGuestRegistrationID(record.getGuestRegistrationID());
        copy.setAttendanceStatus(record.getAttendanceStatus());
        copy.setCheckInMethod(record.getCheckInMethod());
        copy.setVerificationMethod(record.getVerificationMethod());
        copy.setCheckedInBy(record.getCheckedInBy());
        copy.setCheckedInAt(record.getCheckedInAt());
        copy.setOverrideReason(record.getOverrideReason());
        copy.setNote(record.getNote());
        return copy;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private VerificationMethod parseVerificationMethod(String value) {
        String normalized = normalize(value);
        if (normalized.isBlank() || "MANUAL".equals(normalized)) {
            return VerificationMethod.MANUAL_OVERRIDE;
        }
        return VerificationMethod.fromValue(normalized);
    }

    private String normalizeSpaces(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }
}

