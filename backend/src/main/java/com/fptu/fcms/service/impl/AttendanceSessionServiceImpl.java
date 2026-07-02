package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.AttendanceCorrectionRequest;
import com.fptu.fcms.dto.request.AttendanceSessionRequest;
import com.fptu.fcms.dto.response.AttendanceRegistrationSearchResponse;
import com.fptu.fcms.dto.response.AttendanceSessionResponse;
import com.fptu.fcms.dto.response.AttendanceSummaryResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.AttendanceSessionService;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceSessionServiceImpl implements AttendanceSessionService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public AttendanceSessionResponse create(Integer eventId, AttendanceSessionRequest request, Integer actorId) {
        eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        AttendanceSession session = new AttendanceSession();
        session.setEventID(eventId);
        session.setSessionName(request.getName());
        session.setStatus(AttendanceSessionStatus.DRAFT.name());
        session.setOpensAt(request.getOpensAt());
        session.setClosesAt(request.getClosesAt());
        session.setCreatedBy(actorId);
        session.setCreatedAt(LocalDateTime.now());
        session.setIsDeleted(false);
        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    @Override
    @Transactional
    public AttendanceSessionResponse update(Integer sessionId, AttendanceSessionRequest request) {
        AttendanceSession session = findSession(sessionId);
        if (!AttendanceSessionStatus.DRAFT.name().equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ATTENDANCE_SESSION_NOT_DRAFT");
        }
        session.setSessionName(request.getName());
        session.setOpensAt(request.getOpensAt());
        session.setClosesAt(request.getClosesAt());
        session.setUpdatedAt(LocalDateTime.now());
        return toSessionResponse(attendanceSessionRepository.save(session));
    }


    @Override
    @Transactional(readOnly = true)
    public AttendanceSessionResponse getByEvent(Integer eventId) {
        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATTENDANCE_SESSION_NOT_FOUND"));
        return toSessionResponse(session);
    }
    @Override
    @Transactional
    public AttendanceSessionResponse open(Integer sessionId, Integer actorId) {
        AttendanceSession session = findSession(sessionId);
        if (!AttendanceSessionStatus.DRAFT.name().equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ATTENDANCE_SESSION_TRANSITION_INVALID");
        }
        session.setStatus(AttendanceSessionStatus.OPEN.name());
        session.setOpenedBy(actorId);
        session.setCheckInTime(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    @Override
    @Transactional
    public AttendanceSessionResponse close(Integer sessionId, Integer actorId) {
        AttendanceSession session = findSession(sessionId);
        if (AttendanceSessionStatus.CLOSED.name().equals(session.getStatus())) {
            return toSessionResponse(session);
        }
        if (!AttendanceSessionStatus.OPEN.name().equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ATTENDANCE_SESSION_NOT_OPEN");
        }
        List<EventRegistration> confirmed = eventRegistrationRepository.findByEventIDAndIsDeletedFalse(session.getEventID()).stream()
                .filter(this::isConfirmed)
                .toList();
        Set<Integer> existingRegistrationIds = attendanceRecordRepository.findBySessionID(sessionId).stream()
                .map(AttendanceRecord::getRegistrationID)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        LocalDateTime now = LocalDateTime.now();
        List<AttendanceRecord> absentRows = confirmed.stream()
                .filter(reg -> !existingRegistrationIds.contains(reg.getRegistrationID()))
                .map(reg -> {
                    AttendanceRecord record = new AttendanceRecord();
                    record.setSessionID(sessionId);
                    record.setRegistrationID(reg.getRegistrationID());
                    record.setUserID(reg.getUserID());
                    record.setParticipantTypeSnapshot(reg.getUserID() == null ? "GUEST" : reg.getParticipantType().name());
                    record.setAttendanceStatus(AttendanceStatus.ABSENT);
                    record.setCreatedAt(now);
                    record.setMarkedAt(now);
                    record.setIsDeleted(false);
                    return record;
                })
                .toList();
        attendanceRecordRepository.saveAll(absentRows);
        session.setStatus(AttendanceSessionStatus.CLOSED.name());
        session.setClosedBy(actorId);
        session.setClosesAt(now);
        session.setUpdatedAt(now);
        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRegistrationSearchResponse> searchRegistrations(Integer sessionId, String keyword) {
        AttendanceSession session = findSession(sessionId);
        String normalized = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        Map<Integer, AttendanceStatus> attendanceByRegistration = attendanceRecordRepository.findBySessionID(sessionId).stream()
                .filter(record -> record.getRegistrationID() != null)
                .collect(Collectors.toMap(AttendanceRecord::getRegistrationID, AttendanceRecord::getAttendanceStatus, (a, b) -> a));
        Map<Integer, UserAccount> users = loadUsers(session.getEventID());
        return eventRegistrationRepository.findByEventIDAndIsDeletedFalse(session.getEventID()).stream()
                .filter(reg -> matches(reg, users.get(reg.getUserID()), normalized))
                .map(reg -> toSearchResponse(reg, users.get(reg.getUserID()), attendanceByRegistration.get(reg.getRegistrationID())))
                .limit(20)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceRegistrationSearchResponse preview(Integer sessionId, Integer registrationId) {
        AttendanceSession session = findSession(sessionId);
        EventRegistration registration = (EventRegistration) eventRegistrationRepository.findByRegistrationIDAndIsDeletedFalse(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "REGISTRATION_NOT_FOUND"));
        if (!session.getEventID().equals(registration.getEventID())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REGISTRATION_NOT_IN_SESSION_EVENT");
        }
        UserAccount user = registration.getUserID() == null ? null : userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);
        AttendanceStatus attendance = attendanceRecordRepository.findBySessionIDAndRegistrationID(sessionId, registrationId)
                .map(AttendanceRecord::getAttendanceStatus)
                .orElse(null);
        return toSearchResponse(registration, user, attendance);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSummaryResponse summary(Integer eventId) {
        AttendanceSession session = attendanceSessionRepository.findByEventID(eventId).orElse(null);
        List<AttendanceRecord> records = session == null ? List.of() : attendanceRecordRepository.findBySessionID(session.getSessionID());
        long present = records.stream().filter(row -> AttendanceStatus.PRESENT.equals(row.getAttendanceStatus())).count();
        long absent = records.stream().filter(row -> AttendanceStatus.ABSENT.equals(row.getAttendanceStatus())).count();
        long confirmed = eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId).stream().filter(this::isConfirmed).count();
        return new AttendanceSummaryResponse(eventId, confirmed, present, absent);
    }

    @Override
    @Transactional
    public AttendanceRegistrationSearchResponse correct(Integer recordId, AttendanceCorrectionRequest request, Integer actorId) {
        AttendanceRecord record = attendanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATTENDANCE_RECORD_NOT_FOUND"));
        String status = normalize(request.getAttendanceStatus());
        if (!AttendanceStatus.PRESENT.name().equals(status) && !AttendanceStatus.ABSENT.name().equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ATTENDANCE_STATUS_INVALID");
        }
        AttendanceRecord before = snapshot(record);
        record.setAttendanceStatus(AttendanceStatus.fromValue(status));
        record.setOverrideReason(request.getOverrideReason());
        record.setNote(request.getNote());
        record.setUpdatedAt(LocalDateTime.now());
        AttendanceRecord savedRecord = attendanceRecordRepository.save(record);
        auditLogService.record(actorId, "AttendanceRecord", savedRecord.getRecordID(), "ATTENDANCE_CORRECTION", before, savedRecord, request.getOverrideReason());
        return preview(record.getSessionID(), record.getRegistrationID());
    }

    private AttendanceSession findSession(Integer sessionId) {
        return attendanceSessionRepository.findBySessionIDAndIsDeletedFalse(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATTENDANCE_SESSION_NOT_FOUND"));
    }

    private AttendanceSessionResponse toSessionResponse(AttendanceSession session) {
        return new AttendanceSessionResponse(
                session.getSessionID(),
                session.getEventID(),
                session.getSessionName(),
                session.getStatus(),
                session.getOpensAt(),
                session.getClosesAt()
        );
    }

    private Map<Integer, UserAccount> loadUsers(Integer eventId) {
        List<Integer> userIds = eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .map(EventRegistration::getUserID)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return userRepository.findAllByUserIDIn(userIds).stream()
                .collect(Collectors.toMap(UserAccount::getUserID, Function.identity(), (a, b) -> a));
    }

    private boolean matches(EventRegistration reg, UserAccount user, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        return contains(reg.getGuestFullName(), keyword)
                || contains(reg.getGuestEmail(), keyword)
                || contains(reg.getGuestPhone(), keyword)
                || phoneLast4Matches(reg.getGuestPhone(), keyword)
                || contains(reg.getRegistrationCode(), keyword)
                || (user != null && (contains(user.getFullName(), keyword)
                || contains(user.getEmail(), keyword)
                || contains(user.getPhoneNumber(), keyword)
                || contains(user.getStudentId(), keyword)));
    }

    private AttendanceRegistrationSearchResponse toSearchResponse(EventRegistration reg, UserAccount user, AttendanceStatus attendanceStatus) {
        String participantType = reg.getUserID() == null ? "GUEST" : reg.getParticipantType().name();
        String displayName = user != null ? user.getFullName() : reg.getGuestFullName();
        String email = user != null ? user.getEmail() : reg.getGuestEmail();
        String phone = user != null ? user.getPhoneNumber() : reg.getGuestPhone();
        String verification = reg.getUserID() == null
                ? "PHONE_LAST4"
                : "STUDENT_CARD";
        return new AttendanceRegistrationSearchResponse(
                reg.getRegistrationID(),
                reg.getRegistrationCode(),
                displayName,
                participantType,
                reg.getStatus(),
                attendanceStatus == null ? null : attendanceStatus.name(),
                maskEmail(email),
                maskPhone(phone),
                verification
        );
    }

    private boolean isConfirmed(EventRegistration registration) {
        return registration != null
                && RegistrationLifecycle.CONFIRMED_STATUSES.contains(registration.getRegistrationStatus());
    }

    private AttendanceRecord snapshot(AttendanceRecord record) {
        AttendanceRecord copy = new AttendanceRecord();
        copy.setRecordID(record.getRecordID());
        copy.setSessionID(record.getSessionID());
        copy.setRegistrationID(record.getRegistrationID());
        copy.setAttendanceStatus(record.getAttendanceStatus());
        copy.setOverrideReason(record.getOverrideReason());
        copy.setNote(record.getNote());
        copy.setUpdatedAt(record.getUpdatedAt());
        return copy;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }


    private boolean phoneLast4Matches(String phone, String keyword) {
        if (phone == null || keyword == null) {
            return false;
        }
        String digits = phone.replaceAll("\\D", "");
        String queryDigits = keyword.replaceAll("\\D", "");
        return queryDigits.length() >= 2 && digits.endsWith(queryDigits);
    }
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "";
        }
        int at = email.indexOf('@');
        String prefix = email.substring(0, Math.min(2, at));
        return prefix + "***" + email.substring(at);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() <= 4) {
            return "****";
        }
        return "******" + phone.substring(phone.length() - 4);
    }
}
