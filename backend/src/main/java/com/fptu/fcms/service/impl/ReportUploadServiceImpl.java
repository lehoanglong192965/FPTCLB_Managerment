package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.ReportUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportUploadServiceImpl implements ReportUploadService {

    private static final long MAX_PDF_SIZE_BYTES = 10L * 1024 * 1024;
    private static final byte[] PDF_MAGIC = new byte[] {'%', 'P', 'D', 'F', '-'};

    private static final EventStatus STATUS_REPORT_UPLOADED = EventStatus.REPORT_UPLOADED;

    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final ClamAvScanService clamAvScanService;

    @Value("${app.reports.storage-dir:reports}")
    private String storageDir;

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

        String fileName = UUID.randomUUID() + ".pdf";
        Path baseDir = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(baseDir);
            Path target = baseDir.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            EventReport report = new EventReport();
            report.setEventID(event.getEventID());
            report.setReportUrl("/api/uploads/" + fileName);
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
            eventReportRepository.save(report);

            event.setEventStatus(STATUS_REPORT_UPLOADED);
            eventRepository.save(event);

            return Map.of(
                    "reportID", String.valueOf(report.getReportID()),
                    "eventID", String.valueOf(event.getEventID()),
                    "filename", fileName,
                    "url", report.getReportUrl()
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store report file.", ex);
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
