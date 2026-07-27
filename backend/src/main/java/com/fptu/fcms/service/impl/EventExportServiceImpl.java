package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.repository.projection.HistoricalUserView;
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
    public CsvExportResult exportRegistrations(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        boolean canViewGuestContact = eventAssignmentAccessService.canViewGuestContact(eventId, currentUser);

        List<EventRegistration> registrations =
                eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        List<GuestEventRegistration> guestRegistrations =
                guestEventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        Map<Integer, HistoricalUserView> usersById = historicalUsersById(collectUserIds(registrations));

        List<RegistrationExportRow> rows = buildRegistrationExportRows(registrations, guestRegistrations, usersById, canViewGuestContact);
        auditExport(currentUser, eventId, "EVENT_REGISTRATIONS_EXPORTED", rows.size());
        return new CsvExportResult(toCsv(buildRegistrationCsvRows(rows)), rows.size());
    }

    @Override
    public CsvExportResult exportRegistrations(EventReportingDataset dataset) {
        return exportRegistrations(dataset, true);
    }

    @Override
    public CsvExportResult exportRegistrations(EventReportingDataset dataset, boolean canViewGuestContact) {
        List<EventRegistration> registrations = dataset.registrations() != null ? dataset.registrations() : List.of();
        List<GuestEventRegistration> guestRegistrations = dataset.guestRegistrations() != null ? dataset.guestRegistrations() : List.of();
        Map<Integer, HistoricalUserView> usersById = dataset.usersById() != null ? dataset.usersById() : Map.of();

        List<RegistrationExportRow> rows = buildRegistrationExportRows(registrations, guestRegistrations, usersById, canViewGuestContact);
        return new CsvExportResult(toCsv(buildRegistrationCsvRows(rows)), rows.size());
    }

    @Override
    @Transactional
    public CsvExportResult exportAttendance(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);

        List<AttendanceSession> sessions =
                attendanceSessionRepository.findByEventIDAndIsDeletedFalseOrderByCheckInTimeAsc(eventId);
        if (sessions.isEmpty()) {
            auditExport(currentUser, eventId, "EVENT_ATTENDANCE_EXPORTED", 0);
            return new CsvExportResult(toCsv(List.of(buildAttendanceHeaderRow())), 0);
        }

        Map<Integer, AttendanceSession> sessionsById = sessions.stream()
                .filter(session -> session.getSessionID() != null)
                .collect(Collectors.toMap(AttendanceSession::getSessionID, Function.identity(), (first, ignored) -> first));

        List<AttendanceRecord> records = attendanceRecordRepository
                .findBySessionIDInAndIsDeletedFalse(new ArrayList<>(sessionsById.keySet()));
        Map<Integer, HistoricalUserView> usersById = historicalUsersById(collectAttendanceUserIds(records));
        Map<Integer, EventRegistration> registrationsById = eventRegistrationRepository
                .findByEventIDAndIsDeletedFalse(eventId)
                .stream()
                .filter(r -> r.getRegistrationID() != null)
                .collect(Collectors.toMap(EventRegistration::getRegistrationID, Function.identity(), (first, ignored) -> first));
        Map<Integer, GuestEventRegistration> guestRegistrationsById = guestEventRegistrationRepository
                .findByEventIDAndIsDeletedFalse(eventId)
                .stream()
                .filter(g -> g.getGuestRegistrationID() != null)
                .collect(Collectors.toMap(GuestEventRegistration::getGuestRegistrationID, Function.identity(), (first, ignored) -> first));

        List<AttendanceExportRow> rows = buildAttendanceExportRows(records, sessionsById, usersById, registrationsById, guestRegistrationsById);
        auditExport(currentUser, eventId, "EVENT_ATTENDANCE_EXPORTED", rows.size());
        return new CsvExportResult(toCsv(buildAttendanceCsvRows(rows)), rows.size());
    }

    @Override
    public CsvExportResult exportAttendance(EventReportingDataset dataset) {
        List<AttendanceSession> sessions = dataset.attendanceSessions() != null ? dataset.attendanceSessions() : List.of();
        List<AttendanceRecord> records = dataset.attendanceRecords() != null ? dataset.attendanceRecords() : List.of();
        Map<Integer, HistoricalUserView> usersById = dataset.usersById() != null ? dataset.usersById() : Map.of();

        if (sessions.isEmpty()) {
            return new CsvExportResult(toCsv(List.of(buildAttendanceHeaderRow())), 0);
        }

        Map<Integer, AttendanceSession> sessionsById = sessions.stream()
                .filter(s -> s.getSessionID() != null)
                .collect(Collectors.toMap(AttendanceSession::getSessionID, Function.identity(), (first, ignored) -> first));

        Map<Integer, EventRegistration> registrationsById = dataset.registrations() == null ? Map.of() :
                dataset.registrations().stream().filter(r -> r.getRegistrationID() != null)
                        .collect(Collectors.toMap(EventRegistration::getRegistrationID, Function.identity(), (first, ignored) -> first));

        Map<Integer, GuestEventRegistration> guestRegistrationsById = dataset.guestRegistrations() == null ? Map.of() :
                dataset.guestRegistrations().stream().filter(g -> g.getGuestRegistrationID() != null)
                        .collect(Collectors.toMap(GuestEventRegistration::getGuestRegistrationID, Function.identity(), (first, ignored) -> first));

        List<AttendanceExportRow> rows = buildAttendanceExportRows(records, sessionsById, usersById, registrationsById, guestRegistrationsById);
        return new CsvExportResult(toCsv(buildAttendanceCsvRows(rows)), rows.size());
    }

    private List<RegistrationExportRow> buildRegistrationExportRows(
            List<EventRegistration> registrations,
            List<GuestEventRegistration> guestRegistrations,
            Map<Integer, HistoricalUserView> usersById,
            boolean canViewGuestContact
    ) {
        List<RegistrationExportRow> rows = new ArrayList<>();
        int sortIndex = 0;
        for (EventRegistration registration : registrations) {
            HistoricalUserView user = usersById.get(registration.getUserID());
            HistoricalUserView purchaser = usersById.get(registration.getPurchaserUserID());
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
                    value(purchaser == null ? null : purchaser.getEmail()),
                    registration.getTicketIssuedAt(),
                    registration.getTicketRevokedAt(),
                    value(registration.getSchoolOrOrganization()),
                    value(registration.getDiscoverySource()),
                    registration.getCancelledAt(),
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
                    registration.getTicketIssuedAt(),
                    registration.getTicketRevokedAt(),
                    value(registration.getSchoolOrOrganization()),
                    value(registration.getDiscoverySource()),
                    registration.getCancelledAt(),
                    sortIndex++
            ));
        }

        rows.sort(Comparator
                .comparing(RegistrationExportRow::registeredAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(RegistrationExportRow::fullName)
                .thenComparingInt(RegistrationExportRow::sortIndex));

        return rows;
    }

    private List<List<String>> buildRegistrationCsvRows(List<RegistrationExportRow> rows) {
        List<List<String>> csvRows = new ArrayList<>();
        csvRows.add(List.of(
                "MSSV", "Họ tên", "Email", "Loại người tham gia", "Trạng thái", "Thời điểm đăng ký",
                "Kênh", "Trạng thái thanh toán", "Số tiền phải trả", "Số tiền đã trả", "Tiền tệ",
                "Phương thức thanh toán", "Mã đối chiếu giao dịch", "Thời điểm thanh toán", "Mã vé",
                "Mã đơn vé", "Email người mua", "Thời điểm cấp vé", "Thời điểm thu hồi vé",
                "Trường/Tổ chức", "Nguồn biết đến", "Thời điểm hủy đăng ký"
        ));
        for (RegistrationExportRow row : rows) {
            csvRows.add(List.of(
                    row.studentId(), row.fullName(), row.email(), row.participantType(), row.status(),
                    formatDateTime(row.registeredAt()), row.registrationChannel(), row.paymentStatus(),
                    row.amountDue(), row.amountPaid(), row.paymentCurrency(), row.paymentMethod(),
                    row.paymentReference(), formatDateTime(row.paidAt()), row.ticketCode(),
                    row.ticketOrderCode(), row.purchaserEmail(), formatDateTime(row.ticketIssuedAt()),
                    formatDateTime(row.ticketRevokedAt()), row.schoolOrOrganization(),
                    row.discoverySource(), formatDateTime(row.cancelledAt())
            ));
        }
        return csvRows;
    }

    private List<AttendanceExportRow> buildAttendanceExportRows(
            List<AttendanceRecord> records,
            Map<Integer, AttendanceSession> sessionsById,
            Map<Integer, HistoricalUserView> usersById,
            Map<Integer, EventRegistration> registrationsById,
            Map<Integer, GuestEventRegistration> guestRegistrationsById
    ) {
        List<AttendanceExportRow> rows = new ArrayList<>();
        int sortIndex = 0;
        for (AttendanceRecord record : records) {
            AttendanceSession session = sessionsById.get(record.getSessionID());
            if (session == null) continue;

            AttendanceParticipant participant = resolveAttendanceParticipant(
                    record, usersById, registrationsById, guestRegistrationsById
            );
            HistoricalUserView checkedInBy = record.getCheckedInBy() == null ? null : usersById.get(record.getCheckedInBy());
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

        return rows;
    }

    private List<List<String>> buildAttendanceCsvRows(List<AttendanceExportRow> rows) {
        List<List<String>> csvRows = new ArrayList<>();
        csvRows.add(buildAttendanceHeaderRow());
        for (AttendanceExportRow row : rows) {
            csvRows.add(List.of(
                    row.sessionName(), row.studentId(), row.fullName(), row.participantType(),
                    row.attendanceStatus(), formatDateTime(row.checkedInAt()), row.checkInMethod(),
                    row.verificationMethod(), row.checkedInBy()
            ));
        }
        return csvRows;
    }

    private List<String> buildAttendanceHeaderRow() {
        return List.of(
                "Phiên điểm danh", "MSSV", "Họ tên", "Loại người tham gia", "Trạng thái điểm danh",
                "Thời điểm check-in", "Hình thức điểm danh", "Phương thức xác minh", "Người điểm danh"
        );
    }

    private Set<Integer> collectUserIds(List<EventRegistration> registrations) {
        Set<Integer> userIds = new LinkedHashSet<>();
        for (EventRegistration registration : registrations) {
            if (registration.getUserID() != null) userIds.add(registration.getUserID());
            if (registration.getPurchaserUserID() != null) userIds.add(registration.getPurchaserUserID());
        }
        return userIds;
    }

    private Set<Integer> collectAttendanceUserIds(List<AttendanceRecord> records) {
        Set<Integer> userIds = new LinkedHashSet<>();
        for (AttendanceRecord record : records) {
            if (record.getUserID() != null) userIds.add(record.getUserID());
            if (record.getCheckedInBy() != null) userIds.add(record.getCheckedInBy());
        }
        return userIds;
    }

    private Map<Integer, HistoricalUserView> historicalUsersById(Set<Integer> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return userRepository.findHistoricalUsersByIds(userIds).stream()
                .filter(user -> user.getUserId() != null)
                .collect(Collectors.toMap(HistoricalUserView::getUserId, Function.identity(), (first, ignored) -> first));
    }

    private AttendanceParticipant resolveAttendanceParticipant(
            AttendanceRecord record,
            Map<Integer, HistoricalUserView> usersById,
            Map<Integer, EventRegistration> registrationsById,
            Map<Integer, GuestEventRegistration> guestRegistrationsById
    ) {
        String snapshotParticipantType = value(record.getParticipantTypeSnapshot());
        if (record.getUserID() != null) {
            HistoricalUserView user = usersById.get(record.getUserID());
            return new AttendanceParticipant(
                    value(user == null ? null : user.getStudentId()),
                    value(user == null ? null : user.getFullName()),
                    snapshotParticipantType.isBlank() ? "PARTICIPANT" : snapshotParticipantType
            );
        }

        GuestEventRegistration guestRegistration = guestRegistrationsById.get(record.getGuestRegistrationID());
        if (guestRegistration == null && record.getRegistrationID() != null) {
            EventRegistration legacyGuestRegistration = registrationsById.get(record.getRegistrationID());
            if (legacyGuestRegistration != null) {
                return new AttendanceParticipant(
                        "",
                        value(legacyGuestRegistration.getGuestFullName()),
                        snapshotParticipantType.isBlank() ? registrationParticipantType(legacyGuestRegistration) : snapshotParticipantType
                );
            }
        }
        return new AttendanceParticipant(
                "",
                value(guestRegistration == null ? null : guestRegistration.getGuestFullName()),
                snapshotParticipantType.isBlank()
                        ? (guestRegistration == null ? "GUEST" : enumName(guestRegistration.getParticipantType()))
                        : snapshotParticipantType
        );
    }

    private String registrationParticipantType(EventRegistration registration) {
        String participantType = enumName(registration.getParticipantType());
        if (!participantType.isBlank()) return participantType;
        return registration.getUserID() == null ? "GUEST" : "PARTICIPANT";
    }

    private String enumName(Enum<?> value) {
        return value == null ? "" : value.name();
    }

    private void auditExport(UserPrincipal currentUser, Integer eventId, String actionType, int rowCount) {
        auditLogService.recordWithRefs(
                currentUser.getUserId(), "Event", eventId, actionType, null,
                "rows=" + rowCount, eventId, null, null, null
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
            if (index > 0) csv.append(',');
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
        if (leadingTrimmed.isEmpty()) return rawValue;

        char firstMeaningfulCharacter = leadingTrimmed.charAt(0);
        if (firstMeaningfulCharacter == '=' || firstMeaningfulCharacter == '+' || firstMeaningfulCharacter == '-' || firstMeaningfulCharacter == '@') {
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
            String studentId, String fullName, String email, String participantType, String status,
            LocalDateTime registeredAt, String registrationChannel, String paymentStatus, String amountDue,
            String amountPaid, String paymentCurrency, String paymentMethod, String paymentReference,
            LocalDateTime paidAt, String ticketCode, String ticketOrderCode, String purchaserEmail,
            LocalDateTime ticketIssuedAt, LocalDateTime ticketRevokedAt, String schoolOrOrganization,
            String discoverySource, LocalDateTime cancelledAt, int sortIndex
    ) {}

    private record AttendanceExportRow(
            String sessionName, String studentId, String fullName, String participantType,
            String attendanceStatus, LocalDateTime checkedInAt, String checkInMethod,
            String verificationMethod, String checkedInBy, LocalDateTime sessionCheckInTime, int sortIndex
    ) {}

    private record AttendanceParticipant(String studentId, String fullName, String participantType) {}
}
