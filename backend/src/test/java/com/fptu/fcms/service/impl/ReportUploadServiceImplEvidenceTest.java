package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateEventReportRequest;
import com.fptu.fcms.dto.response.CloudinaryUploadResult;
import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.dto.response.EventReportStatisticsResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.DocumentStorageService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventExportService;
import com.fptu.fcms.service.EventReportStatisticsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportUploadServiceImplEvidenceTest {

    private static final int EVENT_ID = 42;

    @Mock private EventRepository eventRepository;
    @Mock private EventReportRepository eventReportRepository;
    @Mock private ClamAvScanService clamAvScanService;
    @Mock private DocumentStorageService documentStorageService;
    @Mock private EventExportService eventExportService;
    @Mock private EventReportStatisticsService eventReportStatisticsService;
    @Mock private EventAssignmentAccessService eventAssignmentAccessService;

    @InjectMocks private ReportUploadServiceImpl service;

    private Event event;
    private EventReport report;
    private CreateEventReportRequest request;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        TransactionSynchronizationManager.initSynchronization();

        event = new Event();
        event.setEventID(EVENT_ID);
        event.setEventStatus(EventStatus.COMPLETED);

        report = new EventReport();
        report.setReportID(9);
        report.setCloudinaryPublicId("old-pdf");
        report.setRegistrationEvidencePublicId("old-registration");
        report.setAttendanceEvidencePublicId("old-attendance");

        request = new CreateEventReportRequest();
        request.setEventID(EVENT_ID);
        request.setSummary("Summary");
        request.setFile(new MockMultipartFile(                "file",
                "report.pdf",
                "application/pdf",
                "%PDF-1.7\nreport".getBytes(StandardCharsets.UTF_8)
        ));
        principal = new UserPrincipal(7, "leader@example.edu", 3, List.of());

        lenient().when(eventRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(Optional.of(event));
        lenient().when(eventReportRepository.findByEventIDAndIsDeletedFalse(EVENT_ID))
                .thenReturn(Optional.of(report));
        lenient().when(eventReportStatisticsService.calculate(EVENT_ID, principal))
                .thenReturn(EventReportStatisticsResponse.builder()
                        .attendanceSessionsClosed(true)
                        .pendingPaymentCount(0)
                        .calculatedAt(java.time.LocalDateTime.now())
                        .revenue(java.math.BigDecimal.ZERO)
                        .attendanceRate(java.math.BigDecimal.ZERO)
                        .averageOverallRating(java.math.BigDecimal.ZERO)
                        .feedbackResponseRate(java.math.BigDecimal.ZERO)
                        .build());
        lenient().when(eventExportService.exportRegistrations(EVENT_ID, principal))
                .thenReturn(new CsvExportResult("registration".getBytes(StandardCharsets.UTF_8), 3));
        lenient().when(eventExportService.exportAttendance(EVENT_ID, principal))
                .thenReturn(new CsvExportResult("attendance".getBytes(StandardCharsets.UTF_8), 2));
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void registrationEvidenceUploadFailureCleansNewPdf() {
        when(documentStorageService.uploadPdf(any(), anyString()))
                .thenReturn(upload("new-pdf"))
                .thenThrow(new IllegalStateException("registration upload failed"));

        assertThrows(
                IllegalStateException.class,
                () -> service.uploadEventReport(request, principal)
        );

        verify(documentStorageService).deleteDocument("new-pdf");
        verify(eventReportRepository, never()).saveAndFlush(any());
    }

    @Test
    void attendanceEvidenceUploadFailureCleansPdfAndRegistrationEvidence() {
        when(documentStorageService.uploadPdf(any(), anyString()))
                .thenReturn(upload("new-pdf"))
                .thenReturn(upload("new-registration"))
                .thenThrow(new IllegalStateException("attendance upload failed"));

        assertThrows(
                IllegalStateException.class,
                () -> service.uploadEventReport(request, principal)
        );

        verify(documentStorageService).deleteDocument("new-pdf");
        verify(documentStorageService).deleteDocument("new-registration");
        verify(eventReportRepository, never()).saveAndFlush(any());
    }

    @Test
    void databaseSaveFailureCleansAllNewFiles() {
        stubSuccessfulUploads();
        when(eventReportRepository.saveAndFlush(any()))
                .thenThrow(new IllegalStateException("database save failed"));

        assertThrows(
                IllegalStateException.class,
                () -> service.uploadEventReport(request, principal)
        );

        verifyNewFilesDeleted();
    }

    @Test
    void successfulCommitDeletesPreviousFilesAfterCommitAndPersistsMetadata() {
        stubSuccessfulUploads();

        service.uploadEventReport(request, principal);

        verify(documentStorageService, never()).deleteDocument(anyString());

        ArgumentCaptor<EventReport> reportCaptor = ArgumentCaptor.forClass(EventReport.class);
        verify(eventReportRepository).saveAndFlush(reportCaptor.capture());
        EventReport saved = reportCaptor.getValue();
        assertEquals("new-registration-url", saved.getRegistrationEvidenceUrl());        assertEquals("new-registration", saved.getRegistrationEvidencePublicId());
        assertEquals("new-attendance-url", saved.getAttendanceEvidenceUrl());
        assertEquals("new-attendance", saved.getAttendanceEvidencePublicId());
        assertEquals(3, saved.getEvidenceRegistrationRowCount());
        assertEquals(2, saved.getEvidenceAttendanceRowCount());
        assertNotNull(saved.getRegistrationEvidenceHash());
        assertNotNull(saved.getAttendanceEvidenceHash());

        completeTransaction(true);

        verify(documentStorageService).deleteDocument("old-pdf");
        verify(documentStorageService).deleteDocument("old-registration");
        verify(documentStorageService).deleteDocument("old-attendance");
        verify(documentStorageService, never()).deleteDocument("new-pdf");
        verify(documentStorageService, never()).deleteDocument("new-registration");
        verify(documentStorageService, never()).deleteDocument("new-attendance");
    }

    @Test
    void rollbackDeletesNewFilesAndKeepsPreviousFiles() {
        stubSuccessfulUploads();

        service.uploadEventReport(request, principal);
        completeTransaction(false);

        verifyNewFilesDeleted();
        verify(documentStorageService, never()).deleteDocument("old-pdf");
        verify(documentStorageService, never()).deleteDocument("old-registration");
        verify(documentStorageService, never()).deleteDocument("old-attendance");
    }

    @Test
    void cleanupFailureAfterCommitDoesNotFailTransactionCallbacks() {
        stubSuccessfulUploads();
        doThrow(new IllegalStateException("cleanup unavailable"))
                .when(documentStorageService).deleteDocument("old-pdf");

        service.uploadEventReport(request, principal);

        assertDoesNotThrow(() -> completeTransaction(true));
        verify(documentStorageService).deleteDocument("old-registration");
        verify(documentStorageService).deleteDocument("old-attendance");
    }

    private void stubSuccessfulUploads() {
        when(documentStorageService.uploadPdf(any(), anyString()))
                .thenReturn(upload("new-pdf"))
                .thenReturn(upload("new-registration"))
                .thenReturn(upload("new-attendance"));
    }

    private CloudinaryUploadResult upload(String publicId) {
        return CloudinaryUploadResult.builder()
                .publicId(publicId)
                .secureUrl(publicId + "-url")
                .bytes(100L)
                .build();
    }

    private void verifyNewFilesDeleted() {
        verify(documentStorageService).deleteDocument("new-pdf");
        verify(documentStorageService).deleteDocument("new-registration");
        verify(documentStorageService).deleteDocument("new-attendance");
    }

    private void completeTransaction(boolean committed) {
        List<TransactionSynchronization> synchronizations =
                TransactionSynchronizationManager.getSynchronizations();
        if (committed) {
            synchronizations.forEach(TransactionSynchronization::afterCommit);
        }
        int status = committed
                ? TransactionSynchronization.STATUS_COMMITTED
                : TransactionSynchronization.STATUS_ROLLED_BACK;
        synchronizations.forEach(synchronization -> synchronization.afterCompletion(status));
    }
}
