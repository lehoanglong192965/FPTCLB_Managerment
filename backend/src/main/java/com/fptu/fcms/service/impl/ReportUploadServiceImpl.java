package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.config.CloudinaryFolders;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.ReportUploadService;
import com.fptu.fcms.service.DocumentStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
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

    @Override
    public EventReport getReportByEventId(Integer eventId) {
        return eventReportRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found for event " + eventId));
    }

    @Override
    @Transactional
    public Map<String, String> uploadEventReport(CreateEventReportRequest request, Integer uploadedBy) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(request.getEventID())
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));

        if (!EventStatus.COMPLETED.equals(event.getEventStatus())
                && !EventStatus.ONGOING.equals(event.getEventStatus())
                && !EventStatus.REPORT_REJECTED.equals(event.getEventStatus())) {
            throw new IllegalArgumentException("Only Completed, Ongoing, or ReportRejected events can have reports uploaded.");
        }

        MultipartFile file = request.getFile();
        validatePdf(file);
        clamAvScanService.scan(file);

        CloudinaryUploadResult uploaded = documentStorageService.uploadPdf(file, CloudinaryFolders.EVENT_REPORTS);
        String previousPublicId = null;
        try {
            EventReport report = eventReportRepository.findByEventIDAndIsDeletedFalse(event.getEventID())
                    .orElseGet(EventReport::new);
            previousPublicId = report.getCloudinaryPublicId();
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
            eventReportRepository.saveAndFlush(report);

            event.setEventStatus(STATUS_REPORT_UPLOADED);
            eventRepository.saveAndFlush(event);

            deletePreviousCloudinaryFile(previousPublicId, uploaded.getPublicId());

            return Map.of(
                    "reportID", String.valueOf(report.getReportID()),
                    "eventID", String.valueOf(event.getEventID()),
                    "filename", report.getOriginalFilename(),
                    "url", report.getReportUrl()
            );
        } catch (RuntimeException ex) {
            rollbackUpload(uploaded.getPublicId());
            throw ex;
        }
    }

    private void deletePreviousCloudinaryFile(String previousPublicId, String currentPublicId) {
        if (!StringUtils.hasText(previousPublicId) || previousPublicId.equals(currentPublicId)) {
            return;
        }
        try {
            documentStorageService.deleteDocument(previousPublicId);
        } catch (RuntimeException ex) {
            log.warn("New report was saved but the previous Cloudinary file could not be removed. publicId={}",
                    previousPublicId, ex);
        }
    }

    private void rollbackUpload(String publicId) {
        try {
            documentStorageService.deleteDocument(publicId);
        } catch (RuntimeException cleanupError) {
            log.warn("Could not rollback Cloudinary report upload. publicId={}", publicId, cleanupError);
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
