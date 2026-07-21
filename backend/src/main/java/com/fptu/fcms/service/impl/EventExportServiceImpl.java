package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventExportServiceImpl implements EventExportService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final UserRepository userRepository;
    private final EventAssignmentAccessService eventAssignmentAccessService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public byte[] exportRegistrations(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        boolean canViewGuestContact = eventAssignmentAccessService.canViewGuestContact(eventId, currentUser);

        List<EventRegistration> registrations =
                eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        List<GuestEventRegistration> guestRegistrations =
                guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        Map<Integer, UserAccount> usersById = activeUsersById(collectUserIds(registrations));

        List<RegistrationExportRow> rows = new ArrayList<>();
        int sortIndex = 0;
        for (EventRegistration registration : registrations) {
            UserAccount user = usersById.get(registration.getUserID());
            boolean isLegacyGuestRegistration = registration.getUserID() == null;
            rows.add(new RegistrationExportRow(
                    isLegacyGuestRegistration ? "" : value(user == null ? null : user.getStudentId()),
                    isLegacyGuestRegistration ? value(registration.getGuestFullName())
                            : value(user == null ? null : user.getFullName()),
                    isLegacyGuestRegistration
                            ? (canViewGuestContact ? value(registration.getGuestEmail()) : "")
                            : value(user == null ? null : user.getEmail()),
                    registrationParticipantType(registration),
                    enumName(registration.getRegistrationStatus()),
                    registration.getRegisteredAt(),
                    enumName(registration.getRegistrationChannel()),
                    enumName(registration.getPaymentStatus()),
                    decimal(registration.getAmountDue()),
                    decimal(registration.getAmountPaid()),
                    value(registration.getPaymentCurrency()),
                    enumName(registration.getPaymentMethod()),
                    value(registration.getPaymentReference()),
                    registration.getPaidAt(),
                    value(registration.getTicketCode()),
                    value(registration.getTicketOrderCode()),
                    registration.getPurchaserUserID() == null ? "" : userRepository
                            .findByUserIDAndIsDeletedFalse(registration.getPurchaserUserID())
                            .map(UserAccount::getEmail).orElse(""),
                    sortIndex++
            ));
        }
        for (GuestEventRegistration registration : guestRegistrations) {
            rows.add(new RegistrationExportRow(
                    "",
                    value(registration.getGuestFullName()),
                    canViewGuestContact ? value(registration.getGuestEmail()) : "",
                    enumName(registration.getParticipantType()),
                    enumName(registration.getRegistrationStatus()),
                    registration.getRegisteredAt(),
                    enumName(registration.getRegistrationChannel()),
                    enumName(registration.getPaymentStatus()),
                    decimal(registration.getAmountDue()),
                    decimal(registration.getAmountPaid()),
                    value(registration.getPaymentCurrency()),
                    enumName(registration.getPaymentMethod()),
                    value(registration.getPaymentReference()),
                    registration.getPaidAt(),
                    value(registration.getTicketCode()),
                    "",
                    "",
                    sortIndex++
            ));
        }

        rows.sort(Comparator
                .comparing(RegistrationExportRow::registeredAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(RegistrationExportRow::fullName)
                .thenComparingInt(RegistrationExportRow::sortIndex));

        List<List<String>> csvRows = new ArrayList<>();
        csvRows.add(List.of(
                "MSSV",
                "H\u1ecd t\u00ean",
                "Email",
                "Lo\u1ea1i ng\u01b0\u1eddi tham gia",
                "Tr\u1ea1ng th\u00e1i",
                "Th\u1eddi \u0111i\u1ec3m \u0111\u0103ng k\u00fd",
                "K\u00eanh",
                "Tr\u1ea1ng th\u00e1i thanh to\u00e1n",
                "S\u1ed1 ti\u1ec1n ph\u1ea3i tr\u1ea3",
                "S\u1ed1 ti\u1ec1n \u0111\u00e3 tr\u1ea3",
                "Ti\u1ec1n t\u1ec7",
                "Ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n",
                "M\u00e3 \u0111\u1ed1i chi\u1ebfu giao d\u1ecbch",
                "Th\u1eddi \u0111i\u1ec3m thanh to\u00e1n",
                "M\u00e3 v\u00e9",
                "M\u00e3 \u0111\u01a1n v\u00e9",
                "Email ng\u01b0\u1eddi mua"
        ));
        for (RegistrationExportRow row : rows) {
            csvRows.add(List.of(
                    row.studentId(),
                    row.fullName(),
                    row.email(),
                    row.participantType(),
                    row.status(),
                    formatDateTime(row.registeredAt()),
                    row.registrationChannel(),
                    row.paymentStatus(),
                    row.amountDue(),
                    row.amountPaid(),
                    row.paymentCurrency(),
                    row.paymentMethod(),
                    row.paymentReference(),
                    formatDateTime(row.paidAt()),
                    row.ticketCode(),
                    row.ticketOrderCode(),
                    row.purchaserEmail()
            ));
        }

        auditExport(currentUser, eventId, "EVENT_REGISTRATIONS_EXPORTED", rows.size());
        return toCsv(csvRows);
    }

    @Override
    @Transactional
    public byte[] exportAttendance(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);

        List<AttendanceSession> sessions =
                attendanceSessionRepository.findByEventIDAndIsDeletedFalseOrderByCheckInTimeAsc(eventId);
        if (sessions.isEmpty()) {
            auditExport(currentUser, eventId, "EVENT_ATTENDANCE_EXPORTED", 0);
            return toCsv(List.of(List.of(
                    "Phi\u00ean \u0111i\u1ec3m danh",
                    "MSSV",
                    "H\u1ecd t\u00ean",
                    "Lo\u1ea1i ng\u01b0\u1eddi tham gia",
                    "Tr\u1ea1ng th\u00e1i \u0111i\u1ec3m danh",
                    "Th\u1eddi \u0111i\u1ec3m check-in",
                    "H\u00ecnh th\u1ee9c \u0111i\u1ec3m danh",
                    "Ph\u01b0\u01a1ng th\u1ee9c x\u00e1c minh",
                    "Ng\u01b0\u1eddi \u0111i\u1ec3m danh"
            )));
        }

        Map<Integer, AttendanceSession> sessionsById = sessions.stream()
                .filter(session -> session.getSessionID() != null)
                .collect(Collectors.toMap(
                        AttendanceSession::getSessionID,
                        Function.identity(),
                        (first, ignored) -> first
                ));
        List<AttendanceRecord> records = attendanceRecordRepository
                .findBySessionIDInAndIsDeletedFalse(new ArrayList<>(sessionsById.keySet()));
        Map<Integer, UserAccount> usersById = activeUsersById(collectAttendanceUserIds(records));
        Map<Integer, EventRegistration> registrationsById = eventRegistrationRepository
                .findByEventIDAndIsDeletedFalse(eventId)
                .stream()
                .filter(registration -> registration.getRegistrationID() != null)
                .collect(Collectors.toMap(
                        EventRegistration::getRegistrationID,
                        Function.identity(),
                        (first, ignored) -> first
                ));
        Map<Integer, GuestEventRegistration> guestRegistrationsById = guestEventRegistrationRepository
                .findByEventIDAndIsDeletedFalse(eventId)
                .stream()
                .filter(registration -> registration.getGuestRegistrationID() != null)
                .collect(Collectors.toMap(
                        GuestEventRegistration::getGuestRegistrationID,
                        Function.identity(),
                        (first, ignored) -> first
                ));

        List<AttendanceExportRow> rows = new ArrayList<>();
        int sortIndex = 0;
        for (AttendanceRecord record : records) {
            AttendanceSession session = sessionsById.get(record.getSessionID());
            if (session == null) {
                continue;
            }
            AttendanceParticipant participant =
                    resolveAttendanceParticipant(
                            record,
                            usersById,
                            registrationsById,
                            guestRegistrationsById
                    );
            UserAccount checkedInBy = record.getCheckedInBy() == null ? null : usersById.get(record.getCheckedInBy());
            rows.add(new AttendanceExportRow(
                    value(session.getSessionName()),
                    participant.studentId(),
                    participant.fullName(),
                    participant.participantType(),
                    enumName(record.getAttendanceStatus()),
                    record.getCheckedInAt(),
                    enumName(record.getCheckInMethod()),
                    value(record.getVerificationMethod()),
                    value(checkedInBy == null ? null : checkedInBy.getFullName()),
                    session.getCheckInTime(),
                    sortIndex++
            ));
        }

        rows.sort(Comparator
                .comparing(AttendanceExportRow::sessionCheckInTime, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(AttendanceExportRow::checkedInAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(AttendanceExportRow::sessionName)
                .thenComparingInt(AttendanceExportRow::sortIndex));

        List<List<String>> csvRows = new ArrayList<>();
        csvRows.add(List.of(
                "Phi\u00ean \u0111i\u1ec3m danh",
                "MSSV",
                "H\u1ecd t\u00ean",
                "Lo\u1ea1i ng\u01b0\u1eddi tham gia",
                "Tr\u1ea1ng th\u00e1i \u0111i\u1ec3m danh",
                "Th\u1eddi \u0111i\u1ec3m check-in",
                "H\u00ecnh th\u1ee9c \u0111i\u1ec3m danh",
                "Ph\u01b0\u01a1ng th\u1ee9c x\u00e1c minh",
                "Ng\u01b0\u1eddi \u0111i\u1ec3m danh"
        ));
        for (AttendanceExportRow row : rows) {
            csvRows.add(List.of(
                    row.sessionName(),
                    row.studentId(),
                    row.fullName(),
                    row.participantType(),
                    row.attendanceStatus(),
                    formatDateTime(row.checkedInAt()),
                    row.checkInMethod(),
                    row.verificationMethod(),
                    row.checkedInBy()
            ));
        }

        auditExport(currentUser, eventId, "EVENT_ATTENDANCE_EXPORTED", rows.size());
        return toCsv(csvRows);
    }

    private Set<Integer> collectUserIds(List<EventRegistration> registrations) {
        Set<Integer> userIds = new LinkedHashSet<>();
        for (EventRegistration registration : registrations) {
            if (registration.getUserID() != null) {
                userIds.add(registration.getUserID());
            }
        }
        return userIds;
    }

    private Set<Integer> collectAttendanceUserIds(List<AttendanceRecord> records) {
        Set<Integer> userIds = new LinkedHashSet<>();
        for (AttendanceRecord record : records) {
            if (record.getUserID() != null) {
                userIds.add(record.getUserID());
            }
            if (record.getCheckedInBy() != null) {
                userIds.add(record.getCheckedInBy());
            }
        }
        return userIds;
    }

    private Map<Integer, UserAccount> activeUsersById(Set<Integer> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllByUserIDInAndIsDeletedFalse(userIds).stream()
                .filter(user -> user.getUserID() != null)
                .collect(Collectors.toMap(
                        UserAccount::getUserID,
                        Function.identity(),
                        (first, ignored) -> first
                ));
    }

    private AttendanceParticipant resolveAttendanceParticipant(
            AttendanceRecord record,
            Map<Integer, UserAccount> usersById,
            Map<Integer, EventRegistration> registrationsById,
            Map<Integer, GuestEventRegistration> guestRegistrationsById
    ) {
        String snapshotParticipantType = value(record.getParticipantTypeSnapshot());
        if (record.getUserID() != null) {
            UserAccount user = usersById.get(record.getUserID());
            return new AttendanceParticipant(
                    value(user == null ? null : user.getStudentId()),
                    value(user == null ? null : user.getFullName()),
                    snapshotParticipantType.isBlank() ? "PARTICIPANT" : snapshotParticipantType
            );
        }

        GuestEventRegistration guestRegistration =
                guestRegistrationsById.get(record.getGuestRegistrationID());
        if (guestRegistration == null && record.getRegistrationID() != null) {
            EventRegistration legacyGuestRegistration = registrationsById.get(record.getRegistrationID());
            if (legacyGuestRegistration != null) {
                return new AttendanceParticipant(
                        "",
                        value(legacyGuestRegistration.getGuestFullName()),
                        snapshotParticipantType.isBlank()
                                ? registrationParticipantType(legacyGuestRegistration)
                                : snapshotParticipantType
                );
            }
        }
        return new AttendanceParticipant(
                "",
                value(guestRegistration == null ? null : guestRegistration.getGuestFullName()),
                snapshotParticipantType.isBlank()
                        ? (guestRegistration == null
                                ? "GUEST"
                                : enumName(guestRegistration.getParticipantType()))
                        : snapshotParticipantType
        );
    }

    private String registrationParticipantType(EventRegistration registration) {
        String participantType = enumName(registration.getParticipantType());
        if (!participantType.isBlank()) {
            return participantType;
        }
        return registration.getUserID() == null ? "GUEST" : "PARTICIPANT";
    }

    private String enumName(Enum<?> value) {
        return value == null ? "" : value.name();
    }

    private void auditExport(UserPrincipal currentUser, Integer eventId, String actionType, int rowCount) {
        auditLogService.recordWithRefs(
                currentUser.getUserId(),
                "Event",
                eventId,
                actionType,
                null,
                "rows=" + rowCount,
                eventId,
                null,
                null,
                null
        );
    }

    private byte[] toCsv(List<List<String>> rows) {
        StringBuilder csv = new StringBuilder().append('\uFEFF');
        for (List<String> row : rows) {
            appendCsvRow(csv, row);
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void appendCsvRow(StringBuilder csv, List<String> values) {
        for (int index = 0; index < values.size(); index++) {
            if (index > 0) {
                csv.append(',');
            }
            csv.append(csvField(values.get(index)));
        }
        csv.append("\r\n");
    }

    private String csvField(String value) {
        String neutralized = neutralizeSpreadsheetFormula(value);
        return "\"" + neutralized.replace("\"", "\"\"") + "\"";
    }

    private String neutralizeSpreadsheetFormula(String value) {
        String rawValue = value(value);
        String leadingTrimmed = rawValue.stripLeading();
        if (leadingTrimmed.isEmpty()) {
            return rawValue;
        }

        char firstMeaningfulCharacter = leadingTrimmed.charAt(0);
        if (firstMeaningfulCharacter == '='
                || firstMeaningfulCharacter == '+'
                || firstMeaningfulCharacter == '-'
                || firstMeaningfulCharacter == '@') {
            return "'" + rawValue;
        }
        return rawValue;
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "" : DATE_TIME_FORMATTER.format(value);
    }

    private String value(String value) {
        return value == null ? "" : value;
    }

    private String decimal(java.math.BigDecimal value) {
        return value == null ? "" : value.toPlainString();
    }

    private record RegistrationExportRow(
            String studentId,
            String fullName,
            String email,
            String participantType,
            String status,
            LocalDateTime registeredAt,
            String registrationChannel,
            String paymentStatus,
            String amountDue,
            String amountPaid,
            String paymentCurrency,
            String paymentMethod,
            String paymentReference,
            LocalDateTime paidAt,
            String ticketCode,
            String ticketOrderCode,
            String purchaserEmail,
            int sortIndex
    ) {
    }

    private record AttendanceExportRow(
            String sessionName,
            String studentId,
            String fullName,
            String participantType,
            String attendanceStatus,
            LocalDateTime checkedInAt,
            String checkInMethod,
            String verificationMethod,
            String checkedInBy,
            LocalDateTime sessionCheckInTime,
            int sortIndex
    ) {
    }

    private record AttendanceParticipant(
            String studentId,
            String fullName,
            String participantType
    ) {
    }
}
