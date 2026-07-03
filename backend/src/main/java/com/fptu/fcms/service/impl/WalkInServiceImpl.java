package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.AttendanceCheckInRequest;
import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.request.WalkInFptuRequest;
import com.fptu.fcms.dto.request.WalkInGuestEmergencyOverrideRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.AttendanceSessionStatus;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.CheckInMethod;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.enums.RegistrationChannel;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.VerificationMethod;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.AttendanceService;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.GuestRegistrationService;
import com.fptu.fcms.service.RegistrationAllocationPort;
import com.fptu.fcms.service.WalkInService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class WalkInServiceImpl implements WalkInService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final UserRepository userRepository;
    private final RegistrationAllocationPort registrationAllocationPort;
    private final AttendanceService attendanceService;
    private final GuestRegistrationService guestRegistrationService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public AttendanceCheckInResponse walkInFptu(Integer sessionId, WalkInFptuRequest request, Integer actorId) {
        AttendanceSession session = requireWalkInOpenSession(sessionId);
        Event event = requireWalkInEvent(session.getEventID());
        UserAccount user = userRepository.findByStudentIdAndIsDeletedFalse(request.getStudentIdOrEmail())
                .or(() -> userRepository.findByEmailAndIsDeletedFalse(request.getStudentIdOrEmail().trim().toLowerCase(Locale.ROOT)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        EventRegistration registration = eventRegistrationRepository.findByEventIDAndUserIDAndIsDeletedFalse(event.getEventID(), user.getUserID())
                .orElseGet(() -> createFptuWalkInRegistration(event, user));
        RegistrationStatus registrationStatus = registration.getRegistrationStatus();
        if (registrationStatus == null && registration.getStatus() != null) {
            registrationStatus = RegistrationStatus.fromValue(registration.getStatus());
        }
        if (!RegistrationStatus.CONFIRMED.equals(registrationStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, registrationStatus == null ? "REGISTRATION_NOT_CONFIRMED" : registrationStatus.name());
        }

        AttendanceCheckInRequest checkIn = new AttendanceCheckInRequest();
        checkIn.setRegistrationId(registration.getRegistrationID());
        checkIn.setVerificationMethod(VerificationMethod.STUDENT_CARD.name());
        return attendanceService.checkIn(sessionId, checkIn, actorId);
    }

    @Override
    @Transactional
    public GuestRegistrationResponse walkInGuest(Integer sessionId, GuestRegistrationRequest request) {
        AttendanceSession session = requireWalkInOpenSession(sessionId);
        requireWalkInEvent(session.getEventID());
        return guestRegistrationService.createGuestRegistration(session.getEventID(), request);
    }

    @Override
    @Transactional
    public AttendanceCheckInResponse emergencyGuestOverride(Integer sessionId, WalkInGuestEmergencyOverrideRequest request, Integer actorId) {
        AttendanceSession session = requireWalkInOpenSession(sessionId);
        Event event = requireWalkInEvent(session.getEventID());
        EventRegistration registration = new EventRegistration();
        registration.setEventID(event.getEventID());
        registration.setGuestFullName(request.getFullName().trim());
        registration.setGuestEmail(request.getEmail().trim().toLowerCase(Locale.ROOT));
        registration.setGuestEmailNormalized(request.getEmail().trim().toLowerCase(Locale.ROOT));
        registration.setGuestPhone(request.getPhone().replaceAll("\\D", ""));
        registration.setGuestPhoneNormalized(request.getPhone().replaceAll("\\D", ""));
        registration.setSchoolOrOrganization(request.getSchoolOrOrganization());
        LocalDateTime now = LocalDateTime.now();
        registration.setConsentAccepted(request.isConsent());
        registration.setParticipantType(ParticipantType.GUEST);
        registration.setParticipantTypeSnapshotAt(now);
        registration.setRegistrationChannel(RegistrationChannel.WALK_IN);
        registration.setDiscoverySource(request.getDiscoverySource());
        registration.setStatus(RegistrationStatus.CONFIRMED.name());
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        registration.setRegisteredAt(now);
        registration.setVerifiedAt(now);
        registration.setCreatedAt(now);
        registration.setUpdatedAt(now);
        registration.setIsDeleted(false);
        EventRegistration saved = eventRegistrationRepository.save(registration);

        if (attendanceRecordRepository.existsBySessionIDAndRegistrationIDAndIsDeletedFalse(sessionId, saved.getRegistrationID())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ATTENDANCE_ALREADY_CHECKED_IN");
        }
        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(sessionId);
        record.setRegistrationID(saved.getRegistrationID());
        record.setParticipantTypeSnapshot("GUEST");
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        record.setCheckInMethod(CheckInMethod.EMERGENCY_OVERRIDE);
        record.setVerificationMethod(VerificationMethod.MANUAL_OVERRIDE.name());
        record.setCheckedInAt(now);
        record.setCheckedInBy(actorId);
        record.setOverrideReason(request.getReason());
        record.setNote(request.getNote());
        record.setCreatedAt(now);
        record.setMarkedAt(now);
        record.setIsDeleted(false);
        AttendanceRecord savedRecord = attendanceRecordRepository.save(record);
        auditLogService.record(actorId, "AttendanceRecord", savedRecord.getRecordID(), "ATTENDANCE_EMERGENCY_OVERRIDE", null, savedRecord, request.getReason());
        return new AttendanceCheckInResponse(event.getEventID(), saved.getRegistrationID(), null, AttendanceStatus.PRESENT, "Emergency walk-in check-in successful.");
    }

    private EventRegistration createFptuWalkInRegistration(Event event, UserAccount user) {
        EventRegistration registration = new EventRegistration();
        registration.setEventID(event.getEventID());
        registration.setUserID(user.getUserID());
        registration.setRegistrationChannel(RegistrationChannel.WALK_IN);
        LocalDateTime now = LocalDateTime.now();
        registration.setParticipantType(RegistrationLifecycle.PARTICIPANT_TYPE_PARTICIPANT);
        registration.setParticipantTypeSnapshotAt(now);
        registration.setRegisteredAt(now);
        registration.setCreatedAt(now);
        registration.setUpdatedAt(now);
        registration.setIsDeleted(false);
        EventRegistration saved = eventRegistrationRepository.save(registration);
        RegistrationStatus status = RegistrationStatus.fromValue(registrationAllocationPort.allocateGuest(event, saved));
        saved.setStatus(status == null ? null : status.name());
        saved.setRegistrationStatus(status);
        return eventRegistrationRepository.save(saved);
    }

    private AttendanceSession requireWalkInOpenSession(Integer sessionId) {
        AttendanceSession session = attendanceSessionRepository.findBySessionIDAndIsDeletedFalse(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATTENDANCE_SESSION_NOT_FOUND"));
        if (session.getStatus() != AttendanceSessionStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ATTENDANCE_SESSION_NOT_OPEN");
        }
        return session;
    }

    private Event requireWalkInEvent(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!Boolean.TRUE.equals(event.getAllowWalkIn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WALK_IN_NOT_ALLOWED");
        }
        return event;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}

