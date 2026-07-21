package com.fptu.fcms.service.impl;

import com.fptu.fcms.config.CloudinaryFolders;
import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.DocumentStorageService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventExportService;
import com.fptu.fcms.service.ReportUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportUploadServiceImpl implements ReportUploadService {

    private static final long MAX_PDF_SIZE_BYTES = 10L * 1024 * 1024;
    private static final byte[] PDF_MAGIC = new byte[] {'%', 'P', 'D', 'F', '-'};
    private static final EventStatus STATUS_REPORT_UPLOADED = EventStatus.REPORT_UPLOADED;

    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final ClamAvScanService clamAvScanService;
    private final DocumentStorageService documentStorageService;
    private final EventExportService eventExportService;
    private final EventAssignmentAccessService eventAssignmentAccessService;

    @Override
    public EventReport getReportByEventId(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        return eventReportRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found for event " + eventId));
    }

    @Override
    @Transactional
    public Map<String, String> uploadEventReport(CreateEventReportRequest request, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(request.getEventID(), currentUser);
        Integer uploadedBy = currentUser.getUserId();
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(request.getEventID())
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));

        if (!EventStatus.COMPLETED.equals(event.getEventStatus())
                && !EventStatus.REPORT_REJECTED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException(
                    "Chỉ được nộp báo cáo khi sự kiện đã kết thúc (Completed) hoặc báo cáo trước đó bị từ chối (Report Rejected).");
        }

        MultipartFile file = request.getFile();
        validatePdf(file);
        clamAvScanService.scan(file);

        List<String> newPublicIds = new ArrayList<>();
        List<String> previousPublicIds = new ArrayList<>();
        boolean compensationRegistered = false;
        try {
            CloudinaryUploadResult uploaded =
                    documentStorageService.uploadPdf(file, CloudinaryFolders.EVENT_REPORTS);
            addPublicId(newPublicIds, uploaded.getPublicId());

            EventReport report = eventReportRepository.findByEventIDAndIsDeletedFalse(event.getEventID())
                    .orElseGet(EventReport::new);
            addPublicId(previousPublicIds, report.getCloudinaryPublicId());
            addPublicId(previousPublicIds, report.getRegistrationEvidencePublicId());
            addPublicId(previousPublicIds, report.getAttendanceEvidencePublicId());

            report.setEventID(event.getEventID());
            report.setReportUrl(uploaded.getSecureUrl());
            report.setCloudinaryPublicId(uploaded.getPublicId());
            report.setOriginalFilename(StringUtils.cleanPath(file.getOriginalFilename()));
            report.setFileSize(uploaded.getBytes() != null ? uploaded.getBytes() : file.getSize());
            report.setMimeType("application/pdf");
            report.setSummary(request.getSummary());
            report.setUploadedBy(uploadedBy);
            report.setUploadedAt(LocalDateTime.now());
            report.setStatus(EventReportStatus.UPLOADED);
            report.setApprovedBy(null);
            report.setApprovedAt(null);
            report.setRejectedBy(null);
            report.setRejectedAt(null);
            report.setRejectionReason(null);
            report.setIsDeleted(false);

            generateAndAttachEvidence(report, event.getEventID(), currentUser, newPublicIds);

            eventReportRepository.saveAndFlush(report);
            event.setEventStatus(STATUS_REPORT_UPLOADED);
            eventRepository.saveAndFlush(event);

            registerStorageCompensation(newPublicIds, previousPublicIds);
            compensationRegistered = true;

            return Map.of(
                    "reportID", String.valueOf(report.getReportID()),
                    "eventID", String.valueOf(event.getEventID()),
                    "filename", report.getOriginalFilename(),
                    "url", report.getReportUrl()
            );
        } catch (RuntimeException ex) {
            if (!compensationRegistered) {
                deleteBestEffort(newPublicIds, "new report upload rollback");
            }
            throw ex;
        }
    }

    private void generateAndAttachEvidence(
            EventReport report,            Integer eventId,
            UserPrincipal currentUser,
            List<String> newPublicIds
    ) {
        CsvExportResult registrationExport =
                eventExportService.exportRegistrations(eventId, currentUser);
        CsvExportResult attendanceExport =
                eventExportService.exportAttendance(eventId, currentUser);

        CloudinaryUploadResult registrationUpload = documentStorageService.uploadPdf(
                toMultipartFile(
                        registrationExport.content(),
                        "registrations_evidence_" + eventId + ".csv"
                ),
                CloudinaryFolders.EVENT_REPORTS
        );
        addPublicId(newPublicIds, registrationUpload.getPublicId());

        CloudinaryUploadResult attendanceUpload = documentStorageService.uploadPdf(
                toMultipartFile(
                        attendanceExport.content(),
                        "attendance_evidence_" + eventId + ".csv"
                ),
                CloudinaryFolders.EVENT_REPORTS
        );
        addPublicId(newPublicIds, attendanceUpload.getPublicId());

        report.setRegistrationEvidenceUrl(registrationUpload.getSecureUrl());
        report.setRegistrationEvidencePublicId(registrationUpload.getPublicId());
        report.setRegistrationEvidenceHash(sha256(registrationExport.content()));
        report.setAttendanceEvidenceUrl(attendanceUpload.getSecureUrl());
        report.setAttendanceEvidencePublicId(attendanceUpload.getPublicId());
        report.setAttendanceEvidenceHash(sha256(attendanceExport.content()));
        report.setEvidenceGeneratedAt(LocalDateTime.now());
        report.setEvidenceRegistrationRowCount(registrationExport.dataRowCount());
        report.setEvidenceAttendanceRowCount(attendanceExport.dataRowCount());

        log.info(
                "Evidence snapshots generated for event {}. Registration rows: {}, Attendance rows: {}",
                eventId,
                registrationExport.dataRowCount(),
                attendanceExport.dataRowCount()
        );
    }

    private void registerStorageCompensation(
            List<String> newPublicIds,
            List<String> previousPublicIds
    ) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Transaction synchronization is required for report upload.");
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
                    deleteBestEffort(newIdsSnapshot, "new report rollback");
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
            } catch (RuntimeException cleanupError) {
                log.warn("Cloudinary cleanup failed. reason={}, publicId={}", reason, publicId, cleanupError);
            }
        }
    }

    private MultipartFile toMultipartFile(byte[] content, String filename) {
        return new MultipartFile() {
            @Override public String getName() { return "evidence"; }
            @Override public String getOriginalFilename() { return filename; }
            @Override public String getContentType() { return "text/csv"; }
            @Override public boolean isEmpty() { return content.length == 0; }
            @Override public long getSize() { return content.length; }
            @Override public byte[] getBytes() { return content; }
            @Override public InputStream getInputStream() { return new java.io.ByteArrayInputStream(content); }
            @Override public void transferTo(java.io.File dest) throws IOException {
                java.nio.file.Files.write(dest.toPath(), content);
            }
        };
    }

    private String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("PDF file is required.");
        }
        if (file.getSize() > MAX_PDF_SIZE_BYTES) {
            throw new IllegalArgumentException("PDF size must be <= 10MB.");
        }

        String originalName = file.getOriginalFilename();
        if (!StringUtils.hasText(originalName) || !originalName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = inputStream.readNBytes(PDF_MAGIC.length);
            if (header.length < PDF_MAGIC.length) {
                throw new IllegalArgumentException("Invalid PDF header.");
            }
            for (int i = 0; i < PDF_MAGIC.length; i++) {
                if (header[i] != PDF_MAGIC[i]) {
                    throw new IllegalArgumentException("Invalid PDF header.");
                }
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot inspect uploaded file.", ex);
        }
    }
}