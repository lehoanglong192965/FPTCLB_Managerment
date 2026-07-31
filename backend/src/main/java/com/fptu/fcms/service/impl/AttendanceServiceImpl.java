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
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.enums.VerificationMethod;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.AttendanceService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

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

    private final EventAssignmentAccessService eventAssignmentAccessService;
    @Override
    @Transactional
    public AttendanceCheckInResponse checkIn(Integer sessionId, AttendanceCheckInRequest request, Integer actorId) {
        if (VerificationMethod.QR_TICKET.name().equals(normalize(request.getVerificationMethod()))) {
            throw invalidQrTicket();
        }
        AttendanceSession session = attendanceSessionRepository.findBySessionIDForUpdate(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not found."));
        if (session.getStatus() == AttendanceSessionStatus.CLOSED) {
            throw new IllegalArgumentException("Attendance session is closed.");
        }
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
        ensureTicketEligibleForManualCheckIn(registration.getTicketRevokedAt(), registration.getPaymentStatus());
        UserAccount user = registration.getUserID() == null
                ? null
                : userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);

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
                    user != null ? user.getFullName() : null,
                    user != null ? user.getStudentId() : null,
                    registration.getParticipantType() != null ? registration.getParticipantType().name() : null,
                    AttendanceStatus.PRESENT,
                    "Participant already checked in."
            );
        }
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
                user != null ? user.getFullName() : null,
                user != null ? user.getStudentId() : null,
                registration.getParticipantType() != null ? registration.getParticipantType().name() : null,
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
        ensureTicketEligibleForManualCheckIn(registration.getTicketRevokedAt(), registration.getPaymentStatus());

        VerificationMethod verificationMethod = parseVerificationMethod(request.getVerificationMethod());
        var existingRecord = attendanceRecordRepository.findBySessionIDAndGuestRegistrationID(sessionId, registration.getGuestRegistrationID());
        if (existingRecord.isPresent()) {
            AttendanceRecord existing = existingRecord.get();
            if (existing.getAttendanceStatus() == AttendanceStatus.PRESENT
                    && verificationMethod == VerificationMethod.QR_TICKET) {
                throw alreadyCheckedIn();
            }
            if (existing.getAttendanceStatus() != AttendanceStatus.PRESENT) {
                AttendanceRecord before = snapshot(existing);
                LocalDateTime now = LocalDateTime.now();
                existing.setAttendanceStatus(AttendanceStatus.PRESENT);
                existing.setCheckInMethod(verificationMethod == VerificationMethod.QR_TICKET
                        ? CheckInMethod.QR_CODE : CheckInMethod.STAFF_LOOKUP);
                existing.setVerificationMethod(verificationMethod.name());
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
                    registration.getGuestFullName(),
                    null,
                    "GUEST",
                    AttendanceStatus.PRESENT,
                    "Participant already checked in."
            );
        }

        if (verificationMethod != VerificationMethod.QR_TICKET) {
            verifyGuestParticipant(registration, verificationMethod, request);
        }

        LocalDateTime now = LocalDateTime.now();
        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(sessionId);
        record.setGuestRegistrationID(registration.getGuestRegistrationID());
        record.setParticipantTypeSnapshotAt(registration.getParticipantTypeSnapshotAt());
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        record.setCheckInMethod(verificationMethod == VerificationMethod.QR_TICKET
                ? CheckInMethod.QR_CODE : CheckInMethod.STAFF_LOOKUP);
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
            if (verificationMethod == VerificationMethod.QR_TICKET) {
                throw alreadyCheckedIn();
            }
            throw new IllegalArgumentException("Participant already checked in.");
        }

        return new AttendanceCheckInResponse(
                event.getEventID(),
                registration.getGuestRegistrationID(),
                null,
                registration.getGuestFullName(),
                null,
                "GUEST",
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
    @Override
    @Transactional
    public AttendanceCheckInResponse checkIn(
            Integer sessionId,
            AttendanceCheckInRequest request,
            UserPrincipal currentUser
    ) {
        AttendanceSession session = attendanceSessionRepository.findBySessionIDForUpdate(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not found."));
        eventAssignmentAccessService.ensureCanManageCheckIn(session.getEventID(), currentUser);
        if (session.getStatus() == AttendanceSessionStatus.CLOSED) {
            throw new IllegalArgumentException("Attendance session is closed.");
        }
        if (session.getStatus() != AttendanceSessionStatus.OPEN) {
            throw new IllegalArgumentException("Attendance session is not open.");
        }

        Event event = eventRepository.findByEventIDAndIsDeletedFalse(session.getEventID())
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));
        EventStatus eventStatus = EventStatus.fromValue(String.valueOf(event.getEventStatus()));
        if (eventStatus != EventStatus.ONGOING && eventStatus != EventStatus.CHECKIN_OPEN) {
            throw new IllegalArgumentException("Event must be Ongoing for check-in.");
        }

        VerificationMethod verificationMethod = parseVerificationMethod(request.getVerificationMethod());
        if (verificationMethod != VerificationMethod.QR_TICKET) {
            Integer actorId = currentUser == null ? null : currentUser.getUserId();
            return checkIn(sessionId, request, actorId);
        }

        Integer actorId = currentUser == null ? null : currentUser.getUserId();
        return checkInQrTicket(session, event, request, actorId);
    }

    private AttendanceCheckInResponse checkInQrTicket(
            AttendanceSession session,
            Event event,
            AttendanceCheckInRequest request,
            Integer actorId
    ) {
        String ticketCode = request.getVerificationValue();
        var guestTicket = StringUtils.hasText(ticketCode)
                ? guestEventRegistrationRepository.findByEventIDAndTicketCodeAndIsDeletedFalse(event.getEventID(), ticketCode.trim())
                : Optional.<GuestEventRegistration>empty();
        if (guestTicket.isPresent()) {
            GuestEventRegistration guest = guestTicket.get();
            if (guest.getTicketRevokedAt() != null
                    || !isConfirmedForCheckIn(guest)
                    || !isPaymentEligibleForCheckIn(guest.getPaymentStatus())) {
                throw invalidQrTicket();
            }
            request.setGuestRegistrationId(guest.getGuestRegistrationID());
            return checkInGuest(session.getSessionID(), event, request, actorId);
        }
        EventRegistration registration = resolveQrTicket(event.getEventID(), ticketCode);
        Integer sessionId = session.getSessionID();

        UserAccount user = registration.getUserID() == null
                ? null
                : userRepository.findByUserIDAndIsDeletedFalse(registration.getUserID()).orElse(null);

        // One paid order can cover several attendees. Scanning any ticket of the order
        // checks in every ticket holder it paid for, so the group only queues once.
        List<EventRegistration> orderMembers = resolveTicketOrderMembers(event.getEventID(), registration);
        List<AttendanceCheckInResponse.GroupMemberResult> memberResults = new ArrayList<>();
        int checkedInCount = 0;
        int alreadyPresentCount = 0;

        for (EventRegistration member : orderMembers) {
            UserAccount memberUser = Objects.equals(member.getRegistrationID(), registration.getRegistrationID())
                    ? user
                    : (member.getUserID() == null
                            ? null
                            : userRepository.findByUserIDAndIsDeletedFalse(member.getUserID()).orElse(null));
            String memberName = memberUser != null ? memberUser.getFullName() : member.getGuestFullName();
            String memberStudentId = memberUser != null ? memberUser.getStudentId() : null;

            String skipReason = qrCheckInSkipReason(member);
            if (skipReason != null) {
                memberResults.add(new AttendanceCheckInResponse.GroupMemberResult(
                        member.getRegistrationID(), member.getUserID(), memberName, memberStudentId,
                        "SKIPPED", skipReason));
                continue;
            }

            boolean newlyCheckedIn = applyQrCheckIn(sessionId, member, actorId, request.getNote());
            if (newlyCheckedIn) {
                checkedInCount++;
            } else {
                alreadyPresentCount++;
            }
            memberResults.add(new AttendanceCheckInResponse.GroupMemberResult(
                    member.getRegistrationID(), member.getUserID(), memberName, memberStudentId,
                    newlyCheckedIn ? "CHECKED_IN" : "ALREADY_PRESENT", null));
        }

        if (checkedInCount == 0) {
            throw alreadyCheckedIn();
        }

        boolean isGroupOrder = orderMembers.size() > 1;
        return new AttendanceCheckInResponse(
                event.getEventID(),
                registration.getRegistrationID(),
                registration.getUserID(),
                user != null ? user.getFullName() : registration.getGuestFullName(),
                user != null ? user.getStudentId() : null,
                registration.getParticipantType() != null ? registration.getParticipantType().name() : null,
                AttendanceStatus.PRESENT,
                groupCheckInMessage(isGroupOrder, orderMembers.size(), checkedInCount, alreadyPresentCount),
                isGroupOrder ? registration.getTicketOrderCode() : null,
                isGroupOrder ? memberResults : null
        );
    }

    /**
     * Every non-deleted registration of the scanned ticket's order, scanned ticket first.
     * Falls back to the scanned registration alone when it carries no order code.
     */
    private List<EventRegistration> resolveTicketOrderMembers(Integer eventId, EventRegistration scanned) {
        if (!StringUtils.hasText(scanned.getTicketOrderCode())) {
            return List.of(scanned);
        }
        List<EventRegistration> members = eventRegistrationRepository
                .findByEventIDAndTicketOrderCodeAndIsDeletedFalseOrderByRegistrationIDAsc(
                        eventId, scanned.getTicketOrderCode());
        if (members.isEmpty()) {
            return List.of(scanned);
        }
        List<EventRegistration> ordered = new ArrayList<>();
        ordered.add(scanned);
        members.stream()
                .filter(member -> !Objects.equals(member.getRegistrationID(), scanned.getRegistrationID()))
                .forEach(ordered::add);
        return ordered;
    }

    /** Null when the registration may be checked in, otherwise a human readable reason to skip it. */
    private String qrCheckInSkipReason(EventRegistration registration) {
        if (registration.getTicketRevokedAt() != null) {
            return "Vé đã bị thu hồi.";
        }
        if (!isConfirmedForCheckIn(registration)) {
            return "Đăng ký chưa được xác nhận.";
        }
        if (!isPaymentEligibleForCheckIn(registration.getPaymentStatus())) {
            return "Vé chưa được thanh toán.";
        }
        return null;
    }

    /** Marks one registration present via QR. Returns false when it was already checked in. */
    private boolean applyQrCheckIn(
            Integer sessionId,
            EventRegistration registration,
            Integer actorId,
            String note
    ) {
        var existingRecord = attendanceRecordRepository.findBySessionIDAndRegistrationID(
                sessionId,
                registration.getRegistrationID()
        );
        if (existingRecord.isPresent()) {
            AttendanceRecord existing = existingRecord.get();
            if (existing.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                return false;
            }

            AttendanceRecord before = snapshot(existing);
            Integer existingRecordId = existing.getRecordID();
            LocalDateTime now = LocalDateTime.now();
            int updatedRows = attendanceRecordRepository.markPresentWithQrTicketIfNotAlreadyCheckedIn(
                    existingRecordId,
                    AttendanceStatus.PRESENT,
                    CheckInMethod.QR_CODE,
                    VerificationMethod.QR_TICKET.name(),
                    actorId,
                    now
            );
            if (updatedRows != 1) {
                return false;
            }

            AttendanceRecord after = snapshot(before);
            after.setAttendanceStatus(AttendanceStatus.PRESENT);
            after.setCheckInMethod(CheckInMethod.QR_CODE);
            after.setVerificationMethod(VerificationMethod.QR_TICKET.name());
            after.setMarkedAt(now);
            after.setUpdatedAt(now);
            after.setCheckedInBy(actorId);
            after.setCheckedInAt(now);
            auditLogService.record(
                    actorId,
                    "AttendanceRecord",
                    existingRecordId,
                    "ATTENDANCE_CHECK_IN_EXISTING",
                    before,
                    after,
                    note
            );
            return true;
        }

        LocalDateTime now = LocalDateTime.now();
        AttendanceRecord record = new AttendanceRecord();
        record.setSessionID(sessionId);
        record.setUserID(registration.getUserID());
        record.setRegistrationID(registration.getRegistrationID());
        record.setParticipantTypeSnapshotAt(registration.getParticipantTypeSnapshotAt());
        record.setAttendanceStatus(AttendanceStatus.PRESENT);
        record.setCheckInMethod(CheckInMethod.QR_CODE);
        record.setParticipantTypeSnapshot(
                registration.getParticipantType() == null
                        ? "PARTICIPANT"
                        : registration.getParticipantType().name()
        );
        record.setVerificationMethod(VerificationMethod.QR_TICKET.name());
        record.setCheckedInBy(actorId);
        record.setCheckedInAt(now);
        record.setManualReason(note);
        record.setNote(note);
        record.setMarkedAt(now);
        record.setCreatedAt(now);
        record.setIsVerifiedByAI(false);
        record.setIsDeleted(false);

        try {
            AttendanceRecord savedRecord = attendanceRecordRepository.saveAndFlush(record);
            auditLogService.record(
                    actorId,
                    "AttendanceRecord",
                    savedRecord.getRecordID(),
                    "ATTENDANCE_CHECK_IN",
                    null,
                    savedRecord,
                    note
            );
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
        return true;
    }

    private String groupCheckInMessage(boolean isGroupOrder, int total, int checkedIn, int alreadyPresent) {
        if (!isGroupOrder) {
            return "Check-in successful.";
        }
        StringBuilder message = new StringBuilder()
                .append("Đã điểm danh ").append(checkedIn).append("/").append(total)
                .append(" người trong đơn vé.");
        if (alreadyPresent > 0) {
            message.append(" ").append(alreadyPresent).append(" người đã điểm danh trước đó.");
        }
        int skipped = total - checkedIn - alreadyPresent;
        if (skipped > 0) {
            message.append(" ").append(skipped).append(" vé không đủ điều kiện.");
        }
        return message.toString();
    }

    private boolean isPaymentEligibleForCheckIn(PaymentStatus paymentStatus) {
        return paymentStatus == null
                || PaymentStatus.NOT_REQUIRED.equals(paymentStatus)
                || PaymentStatus.PAID.equals(paymentStatus);
    }

    private void ensureTicketEligibleForManualCheckIn(LocalDateTime ticketRevokedAt, PaymentStatus paymentStatus) {
        if (ticketRevokedAt != null) {
            throw new BusinessRuleException(
                    "TICKET_REVOKED",
                    "Vé đã bị thu hồi và không thể check-in.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        if (!isPaymentEligibleForCheckIn(paymentStatus)) {
            throw new BusinessRuleException(
                    "TICKET_PAYMENT_REQUIRED",
                    "Vé trả phí chưa được thanh toán hoặc xác nhận thanh toán.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }
    private EventRegistration resolveQrTicket(Integer eventId, String ticketCode) {
        if (!StringUtils.hasText(ticketCode)) {
            throw invalidQrTicket();
        }

        EventRegistration registration = eventRegistrationRepository
                .findByEventIDAndTicketCodeAndIsDeletedFalse(eventId, ticketCode.trim())
                .orElseThrow(this::invalidQrTicket);
        if (registration.getTicketRevokedAt() != null
                || !isConfirmedForCheckIn(registration)
                || !isPaymentEligibleForCheckIn(registration.getPaymentStatus())) {
            throw invalidQrTicket();
        }
        return registration;
    }

    private boolean isConfirmedForCheckIn(EventRegistration registration) {
        RegistrationStatus registrationStatus = registration.getRegistrationStatus();
        if (registrationStatus == null && registration.getStatus() != null) {
            registrationStatus = RegistrationStatus.fromValue(registration.getStatus());
        }
        return RegistrationLifecycle.CONFIRMED_STATUSES.contains(registrationStatus);
    }

    private boolean isConfirmedForCheckIn(GuestEventRegistration registration) {
        RegistrationStatus registrationStatus = registration.getRegistrationStatus();
        if (registrationStatus == null && registration.getStatus() != null) {
            registrationStatus = RegistrationStatus.fromValue(registration.getStatus());
        }
        return RegistrationLifecycle.CONFIRMED_STATUSES.contains(registrationStatus);
    }

    private BusinessRuleException alreadyCheckedIn() {
        return new BusinessRuleException(
                ApiErrorCode.ALREADY_CHECKED_IN.name(),
                "Người tham gia này đã được điểm danh.",
                HttpStatus.CONFLICT
        );
    }

    private BusinessRuleException invalidQrTicket() {
        return new BusinessRuleException(
                "TICKET_INVALID",
                "Vé QR không hợp lệ hoặc không còn đủ điều kiện để điểm danh.",
                HttpStatus.UNPROCESSABLE_ENTITY
        );
    }
}

