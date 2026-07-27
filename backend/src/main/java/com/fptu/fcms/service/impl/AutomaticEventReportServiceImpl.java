package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.config.CloudinaryFolders;
import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.dto.reporting.EvidenceMetadata;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AutomaticEventReportService;
import com.fptu.fcms.service.DocumentStorageService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventExportService;
import com.fptu.fcms.service.EventReportCalculationService;
import com.fptu.fcms.service.EventReportPdfRenderer;
import com.fptu.fcms.service.EventReportingDatasetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AutomaticEventReportServiceImpl implements AutomaticEventReportService {

    private final EventReportingDatasetService datasetService;
    private final EventReportCalculationService calculationService;
    private final EventExportService exportService;
    private final EventReportPdfRenderer pdfRenderer;
    private final DocumentStorageService documentStorageService;
    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final EventAssignmentAccessService eventAssignmentAccessService;
    private final ObjectMapper objectMapper;

    public AutomaticEventReportServiceImpl(
            EventReportingDatasetService datasetService,
            EventReportCalculationService calculationService,
            EventExportService exportService,
            EventReportPdfRenderer pdfRenderer,
            DocumentStorageService documentStorageService,
            EventRepository eventRepository,
            EventReportRepository eventReportRepository,
            EventAssignmentAccessService eventAssignmentAccessService,
            ObjectMapper objectMapper
    ) {
        this.datasetService = datasetService;
        this.calculationService = calculationService;
        this.exportService = exportService;
        this.pdfRenderer = pdfRenderer;
        this.documentStorageService = documentStorageService;
        this.eventRepository = eventRepository;
        this.eventReportRepository = eventReportRepository;
        this.eventAssignmentAccessService = eventAssignmentAccessService;
        this.objectMapper = objectMapper != null ? objectMapper.copy().findAndRegisterModules() : new ObjectMapper().findAndRegisterModules();
    }

    @Override
    @Transactional(readOnly = true)
    public EventReportSnapshot getAutoData(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));
        ensureEventCanViewAutoData(event);

        EventReportingDataset dataset = datasetService.loadDataset(eventId, currentUser);
        return calculationService.calculateSnapshot(dataset);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] previewAuto(Integer eventId, AutomaticEventReportRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));
        ensureEventCanViewAutoData(event);

        EventReportingDataset dataset = datasetService.loadDataset(eventId, currentUser);
        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        boolean canViewGuestContact = currentUser != null && eventAssignmentAccessService.canViewGuestContact(event.getEventID(), currentUser);
        CsvExportResult regExport = exportService.exportRegistrations(dataset, canViewGuestContact);
        CsvExportResult attExport = exportService.exportAttendance(dataset);

        String regHash = sha256(regExport.content());
        String attHash = sha256(attExport.content());
        String snapshotJson = toJson(snapshot);
        String commentsJson = toJson(request);
        String dataHash = sha256((snapshotJson + "|" + commentsJson + "|" + regHash + "|" + attHash).getBytes(StandardCharsets.UTF_8));

        EvidenceMetadata evidenceMetadata = new EvidenceMetadata(
                "registrations_evidence_" + eventId + ".csv",
                regExport.dataRowCount(),
                regHash,
                "attendance_evidence_" + eventId + ".csv",
                attExport.dataRowCount(),
                attHash,
                dataHash
        );

        String authorName = currentUser != null ? currentUser.getUsername() : "Ban Chủ Nhiệm";
        return pdfRenderer.renderPdf(snapshot, request, evidenceMetadata, authorName);
    }

    @Override
    @Transactional
    public Map<String, String> submitAuto(Integer eventId, AutomaticEventReportRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sự kiện không tồn tại."));
        ensureEventCompletedOrRejected(event);

        EventReportingDataset dataset = datasetService.loadDataset(eventId, currentUser);
        EventReportSnapshot snapshot = calculationService.calculateSnapshot(dataset);

        if (!snapshot.readiness().isReady()) {
            throw new IllegalArgumentException(
                    "Dữ liệu sự kiện chưa đủ điều kiện để nộp báo cáo tự động. Vui lòng kiểm tra danh sách cảnh báo chặn (blocking warnings).");
        }

        boolean canViewGuestContact = currentUser != null && eventAssignmentAccessService.canViewGuestContact(event.getEventID(), currentUser);
        CsvExportResult regExport = exportService.exportRegistrations(dataset, canViewGuestContact);
        CsvExportResult attExport = exportService.exportAttendance(dataset);

        String regHash = sha256(regExport.content());
        String attHash = sha256(attExport.content());
        String snapshotJson = toJson(snapshot);
        String commentsJson = toJson(request);
        String dataHash = sha256((snapshotJson + "|" + commentsJson + "|" + regHash + "|" + attHash).getBytes(StandardCharsets.UTF_8));

        EvidenceMetadata evidenceMetadata = new EvidenceMetadata(
                "registrations_evidence_" + eventId + ".csv",
                regExport.dataRowCount(),
                regHash,
                "attendance_evidence_" + eventId + ".csv",
                attExport.dataRowCount(),
                attHash,
                dataHash
        );

        String authorName = currentUser != null ? currentUser.getUsername() : "Ban Chủ Nhiệm";
        byte[] pdfBytes = pdfRenderer.renderPdf(snapshot, request, evidenceMetadata, authorName);
        String pdfHash = sha256(pdfBytes);

        List<String> newPublicIds = new ArrayList<>();
        List<String> previousPublicIds = new ArrayList<>();
        boolean compensationRegistered = false;

        try {
            CloudinaryUploadResult pdfUpload = documentStorageService.uploadPdf(
                    toMultipartFile(pdfBytes, "event_report_auto_" + eventId + ".pdf", "application/pdf"),
                    CloudinaryFolders.EVENT_REPORTS
            );
            addPublicId(newPublicIds, pdfUpload.getPublicId());

            CloudinaryUploadResult regUpload = documentStorageService.uploadPdf(
                    toMultipartFile(regExport.content(), evidenceMetadata.registrationFilename(), "text/csv"),
                    CloudinaryFolders.EVENT_REPORTS
            );
            addPublicId(newPublicIds, regUpload.getPublicId());

            CloudinaryUploadResult attUpload = documentStorageService.uploadPdf(
                    toMultipartFile(attExport.content(), evidenceMetadata.attendanceFilename(), "text/csv"),
                    CloudinaryFolders.EVENT_REPORTS
            );
            addPublicId(newPublicIds, attUpload.getPublicId());

            EventReport report = eventReportRepository.findByEventIDAndIsDeletedFalse(event.getEventID())
                    .orElseGet(EventReport::new);

            addPublicId(previousPublicIds, report.getCloudinaryPublicId());
            addPublicId(previousPublicIds, report.getRegistrationEvidencePublicId());
            addPublicId(previousPublicIds, report.getAttendanceEvidencePublicId());

            report.setEventID(event.getEventID());
            report.setReportUrl(pdfUpload.getSecureUrl());
            report.setCloudinaryPublicId(pdfUpload.getPublicId());
            report.setOriginalFilename("event_report_auto_" + eventId + ".pdf");
            report.setFileSize((long) pdfBytes.length);
            report.setMimeType("application/pdf");
            report.setSummary(request != null && StringUtils.hasText(request.overallResult()) ? request.overallResult() : "Báo cáo tự động");
            report.setUploadedBy(currentUser.getUserId());
            report.setUploadedAt(LocalDateTime.now());
            report.setStatus(EventReportStatus.UPLOADED);
            report.setApprovedBy(null);
            report.setApprovedAt(null);
            report.setRejectedBy(null);
            report.setRejectedAt(null);
            report.setRejectionReason(null);
            report.setIsDeleted(false);

            // Automatic report fields
            report.setReportSource("AUTO_GENERATED");
            report.setAutoGeneratedAt(LocalDateTime.now());
            report.setGeneratorVersion(snapshot.generatorVersion());
            report.setTemplateVersion(snapshot.templateVersion());
            report.setReportDataHash(dataHash);
            report.setReportSnapshotJson(snapshotJson);
            report.setLeaderCommentsJson(commentsJson);
            report.setPdfHash(pdfHash);

            // Evidence fields
            report.setRegistrationEvidenceUrl(regUpload.getSecureUrl());
            report.setRegistrationEvidencePublicId(regUpload.getPublicId());
            report.setRegistrationEvidenceHash(regHash);
            report.setAttendanceEvidenceUrl(attUpload.getSecureUrl());
            report.setAttendanceEvidencePublicId(attUpload.getPublicId());
            report.setAttendanceEvidenceHash(attHash);
            report.setEvidenceGeneratedAt(LocalDateTime.now());
            report.setEvidenceRegistrationRowCount(regExport.dataRowCount());
            report.setEvidenceAttendanceRowCount(attExport.dataRowCount());

            // Metrics snapshot
            report.setSnapshotGeneratedAt(snapshot.generatedAt());
            report.setSnapshotTotalRegistrations((long) snapshot.registrations().totalRegistrations());
            report.setSnapshotConfirmedRegistrations((long) snapshot.registrations().confirmedRegistrations());
            report.setSnapshotCancelledRegistrations((long) snapshot.registrations().cancelledRegistrations());
            report.setSnapshotFptuRegistrations((long) snapshot.registrations().fptuRegistrations());
            report.setSnapshotGuestRegistrations((long) snapshot.registrations().guestRegistrations());
            report.setSnapshotPendingPaymentCount((long) snapshot.payments().pendingPaymentCount());
            report.setSnapshotPaidTicketCount((long) snapshot.tickets().paidTicketCount());
            report.setSnapshotRevenue(snapshot.payments().totalAmountPaid());
            report.setSnapshotCurrency(snapshot.event().currency());
            report.setSnapshotAttendanceSessionCount(snapshot.attendance().attendanceSessionCount());
            report.setSnapshotPresentParticipants((long) snapshot.attendance().presentParticipants());
            report.setSnapshotAbsentParticipants((long) snapshot.attendance().absentParticipants());
            report.setSnapshotWalkInParticipants((long) snapshot.attendance().walkInParticipants());
            report.setSnapshotAttendanceRate(java.math.BigDecimal.valueOf(snapshot.attendance().attendanceRate()));
            report.setSnapshotFeedbackCount((long) snapshot.feedback().feedbackCount());
            report.setSnapshotAverageRating(snapshot.feedback().averageOverallRating());
            report.setSnapshotFeedbackResponseRate(snapshot.feedback().feedbackResponseRate());
            report.setSnapshotPlannedBudget(snapshot.event().plannedBudget());

            eventReportRepository.saveAndFlush(report);
            event.setEventStatus(EventStatus.REPORT_UPLOADED);
            eventRepository.saveAndFlush(event);

            registerStorageCompensation(newPublicIds, previousPublicIds);
            compensationRegistered = true;

            return Map.of(
                    "reportID", String.valueOf(report.getReportID()),
                    "eventID", String.valueOf(event.getEventID()),
                    "reportUrl", report.getReportUrl(),
                    "registrationEvidenceUrl", report.getRegistrationEvidenceUrl(),
                    "attendanceEvidenceUrl", report.getAttendanceEvidenceUrl(),
                    "reportDataHash", dataHash,
                    "pdfHash", pdfHash
            );
        } catch (OptimisticLockingFailureException ex) {
            log.error("Concurrent report submission conflict for event {}", event.getEventID(), ex);
            deleteBestEffort(newPublicIds, "concurrent submission rollback");
            throw new IllegalStateException("Báo cáo đã bị thay đổi đồng thời bởi người dùng khác. Vui lòng tải lại trang.");
        } catch (RuntimeException ex) {
            if (!compensationRegistered) {
                deleteBestEffort(newPublicIds, "auto report upload rollback");
            }
            throw ex;
        }
    }

    private void ensureEventCanViewAutoData(Event event) {
        EventStatus status = event.getEventStatus();
        if (status == EventStatus.DRAFT
                || status == EventStatus.PENDING
                || status == EventStatus.PENDING_APPROVAL
                || status == EventStatus.APPROVED
                || status == EventStatus.ONGOING
                || status == EventStatus.CANCELLED
                || status == EventStatus.WITHDRAWN
                || status == EventStatus.REGISTRATION_OPEN
                || status == EventStatus.REGISTRATION_CLOSED) {
            throw new IllegalArgumentException(
                    "Chỉ được xem thông tin báo cáo khi sự kiện đã kết thúc.");
        }
    }

    private void ensureEventCompletedOrRejected(Event event) {
        if (!EventStatus.COMPLETED.equals(event.getEventStatus())
                && !EventStatus.REPORT_REJECTED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException(
                    "Chỉ được xem hoặc tạo báo cáo khi sự kiện đã kết thúc (Completed) hoặc báo cáo trước đó bị từ chối (Report Rejected).");
        }
    }

    private void registerStorageCompensation(List<String> newPublicIds, List<String> previousPublicIds) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Transaction synchronization is required.");
        }
        List<String> newIdsSnapshot = List.copyOf(newPublicIds);
        List<String> previousIdsSnapshot = List.copyOf(previousPublicIds);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteBestEffort(previousIdsSnapshot, "previous report cleanup");
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    deleteBestEffort(newIdsSnapshot, "auto report rollback");
                }
            }
        });
    }

    private void addPublicId(List<String> publicIds, String publicId) {
        if (StringUtils.hasText(publicId) && !publicIds.contains(publicId)) {
            publicIds.add(publicId);
        }
    }

    private void deleteBestEffort(List<String> publicIds, String reason) {
        for (String publicId : publicIds) {
            try {
                documentStorageService.deleteDocument(publicId);
            } catch (RuntimeException e) {
                log.warn("Storage cleanup warning: reason={}, publicId={}", reason, publicId, e);
            }
        }
    }

    private MultipartFile toMultipartFile(byte[] content, String filename, String contentType) {
        return new MultipartFile() {
            @Override public String getName() { return "file"; }
            @Override public String getOriginalFilename() { return filename; }
            @Override public String getContentType() { return contentType; }
            @Override public boolean isEmpty() { return content.length == 0; }
            @Override public long getSize() { return content.length; }
            @Override public byte[] getBytes() { return content; }
            @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }
            @Override public void transferTo(File dest) throws IOException {
                java.nio.file.Files.write(dest.toPath(), content);
            }
        };
    }

    private String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to serialize report object to JSON", e);
            throw new IllegalStateException("Lỗi đóng gói snapshot dữ liệu báo cáo sang JSON.", e);
        }
    }
}
