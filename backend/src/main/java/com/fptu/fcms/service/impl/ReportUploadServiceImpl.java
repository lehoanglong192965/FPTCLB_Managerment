package com.fptu.fcms.service.impl;

import com.fptu.fcms.config.CloudinaryFolders;
import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.dto.response.EventReportStatisticsResponse;
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
import com.fptu.fcms.service.EventReportStatisticsService;
import com.fptu.fcms.service.ReportUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Lớp triển khai dịch vụ tải lên báo cáo tổng kết sự kiện thủ công và tra cứu thống kê báo cáo.
 * Layer: Service Implementation.
 * Trách nhiệm chính: Xử lý upload file PDF báo cáo thủ công từ máy người dùng (quét virus bằng ClamAV, upload Cloudinary, tự động trích xuất minh chứng CSV đăng ký/điểm danh, lưu CSDL), tra cứu báo cáo theo eventId và thống kê báo cáo cho ICPDP/Leader.
 * Phụ thuộc/Sử dụng: Được gọi bởi ReportController cho các luồng làm việc với báo cáo thủ công.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportUploadServiceImpl implements ReportUploadService {

    private static final EventStatus STATUS_REPORT_UPLOADED = EventStatus.REPORT_UPLOADED;

    private final EventRepository eventRepository;
    private final EventReportRepository eventReportRepository;
    private final EventAssignmentAccessService eventAssignmentAccessService;
    private final EventReportStatisticsService eventReportStatisticsService;
    private final EventExportService eventExportService;
    private final DocumentStorageService documentStorageService;
    private final ClamAvScanService clamAvScanService;

    @Override
    @Transactional(readOnly = true)
    public Optional<EventReport> getReportByEventId(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        return eventReportRepository.findByEventIDAndIsDeletedFalse(eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public EventReportStatisticsResponse getStatistics(Integer eventId, UserPrincipal currentUser) {
        eventAssignmentAccessService.ensureCanManageEvent(eventId, currentUser);
        return eventReportStatisticsService.calculate(eventId, currentUser);
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
        if (!EventStatus.REPORT_REJECTED.equals(event.getEventStatus())
                && !Boolean.FALSE.equals(event.getFeedbackEnabled())
                && event.getFeedbackClosesAt() != null
                && LocalDateTime.now().isBefore(event.getFeedbackClosesAt())) {
            throw new IllegalArgumentException(
                    "Chưa thể nộp báo cáo khi thời gian thu thập đánh giá vẫn còn mở.");
        }

        EventReportStatisticsResponse statistics =
                eventReportStatisticsService.calculate(event.getEventID(), currentUser);
        if (!statistics.isAttendanceSessionsClosed()) {
            throw new IllegalArgumentException(
                    "Vui lòng đóng tất cả phiên điểm danh trước khi nộp báo cáo.");
        }
        if (statistics.getPendingPaymentCount() > 0) {
            throw new IllegalArgumentException(
                    "Vẫn còn giao dịch chờ thanh toán hoặc xác minh. Vui lòng xử lý trước khi nộp báo cáo.");
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

            // RESET AUTO METADATA ON MANUAL SUBMIT
            report.setReportSource("MANUAL_UPLOAD");
            report.setAutoGeneratedAt(null);
            report.setGeneratorVersion(null);
            report.setTemplateVersion(null);
            report.setReportDataHash(null);
            report.setReportSnapshotJson(null);
            report.setLeaderCommentsJson(null);
            try {
                report.setPdfHash(computeSha256(file.getBytes()));
            } catch (IOException e) {
                report.setPdfHash(null);
            }

            attachStatisticsSnapshot(report, statistics);

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
        } catch (OptimisticLockingFailureException ex) {
            log.error("Concurrent report submission conflict for event {}", event.getEventID(), ex);
            cleanupPublicIds(newPublicIds);
            throw new IllegalStateException("Báo cáo đã bị thay đổi đồng thời bởi người dùng khác. Vui lòng tải lại trang.");
        } catch (RuntimeException ex) {
            if (!compensationRegistered) {
                cleanupPublicIds(newPublicIds);
            }
            throw ex;
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file báo cáo PDF.");
        }
        if (!"application/pdf".equalsIgnoreCase(file.getContentType())
                && (file.getOriginalFilename() == null || !file.getOriginalFilename().toLowerCase().endsWith(".pdf"))) {
            throw new IllegalArgumentException("Chỉ chấp nhận file định dạng PDF.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Dung lượng file báo cáo không được vượt quá 5MB.");
        }
    }

    private void attachStatisticsSnapshot(EventReport report, EventReportStatisticsResponse stats) {
        report.setSnapshotGeneratedAt(stats.getCalculatedAt());
        report.setSnapshotTotalRegistrations(stats.getTotalRegistrations());
        report.setSnapshotConfirmedRegistrations(stats.getConfirmedRegistrations());
        report.setSnapshotCancelledRegistrations(stats.getCancelledRegistrations());
        report.setSnapshotFptuRegistrations(stats.getFptuRegistrations());
        report.setSnapshotGuestRegistrations(stats.getGuestRegistrations());
        report.setSnapshotPendingPaymentCount(stats.getPendingPaymentCount());
        report.setSnapshotPaidTicketCount(stats.getPaidTicketCount());
        report.setSnapshotRevenue(stats.getRevenue());
        report.setSnapshotCurrency(stats.getCurrency());
        report.setSnapshotAttendanceSessionCount(stats.getAttendanceSessionCount());
        report.setSnapshotPresentParticipants(stats.getPresentParticipants());
        report.setSnapshotAbsentParticipants(stats.getAbsentParticipants());
        report.setSnapshotWalkInParticipants(stats.getWalkInParticipants());
        report.setSnapshotAttendanceRate(stats.getAttendanceRate());
        report.setSnapshotFeedbackCount(stats.getFeedbackCount());
        report.setSnapshotAverageRating(stats.getAverageOverallRating());
        report.setSnapshotFeedbackResponseRate(stats.getFeedbackResponseRate());
        report.setSnapshotPlannedBudget(stats.getPlannedBudget());
    }

    private void generateAndAttachEvidence(
            EventReport report,
            Integer eventId,
            UserPrincipal currentUser,
            List<String> newPublicIds
    ) {
        LocalDateTime now = LocalDateTime.now();

        CsvExportResult registrationExport = eventExportService.exportRegistrations(eventId, currentUser);
        byte[] regBytes = registrationExport.content();
        String regHash = computeSha256(regBytes);
        String regFilename = String.format("event-%d-registrations-%tY%<tm%<td%<tH%<tM%<tS.csv", eventId, now);

        MultipartFile regFile = toMultipartFile(regBytes, regFilename, "text/csv");
        CloudinaryUploadResult regUpload = documentStorageService.uploadPdf(
                regFile, CloudinaryFolders.EVENT_REPORTS
        );
        addPublicId(newPublicIds, regUpload.getPublicId());

        CsvExportResult attendanceExport = eventExportService.exportAttendance(eventId, currentUser);
        byte[] attBytes = attendanceExport.content();
        String attHash = computeSha256(attBytes);
        String attFilename = String.format("event-%d-attendance-%tY%<tm%<td%<tH%<tM%<tS.csv", eventId, now);

        MultipartFile attFile = toMultipartFile(attBytes, attFilename, "text/csv");
        CloudinaryUploadResult attUpload = documentStorageService.uploadPdf(
                attFile, CloudinaryFolders.EVENT_REPORTS
        );
        addPublicId(newPublicIds, attUpload.getPublicId());

        report.setRegistrationEvidenceUrl(regUpload.getSecureUrl());
        report.setRegistrationEvidencePublicId(regUpload.getPublicId());
        report.setRegistrationEvidenceHash(regHash);
        report.setAttendanceEvidenceUrl(attUpload.getSecureUrl());
        report.setAttendanceEvidencePublicId(attUpload.getPublicId());
        report.setAttendanceEvidenceHash(attHash);
        report.setEvidenceGeneratedAt(now);
        report.setEvidenceRegistrationRowCount(registrationExport.dataRowCount());
        report.setEvidenceAttendanceRowCount(attendanceExport.dataRowCount());
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

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return DigestUtils.md5DigestAsHex(data);
        }
    }

    private void addPublicId(List<String> list, String publicId) {
        if (StringUtils.hasText(publicId)) {
            list.add(publicId);
        }
    }

    private void registerStorageCompensation(List<String> newPublicIds, List<String> previousPublicIds) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    cleanupPublicIds(previousPublicIds);
                } else {
                    cleanupPublicIds(newPublicIds);
                }
            }
        });
    }

    private void cleanupPublicIds(List<String> publicIds) {
        if (publicIds == null || publicIds.isEmpty()) return;
        for (String publicId : publicIds) {
            try {
                documentStorageService.deleteDocument(publicId);
            } catch (Exception ex) {
                log.warn("Failed to delete Cloudinary evidence file {}: {}", publicId, ex.getMessage());
            }
        }
    }
}
