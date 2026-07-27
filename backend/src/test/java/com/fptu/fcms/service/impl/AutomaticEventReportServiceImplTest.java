package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.reporting.EventReportSnapshot;
import com.fptu.fcms.dto.reporting.EventReportingDataset;
import com.fptu.fcms.dto.request.AutomaticEventReportRequest;
import com.fptu.fcms.dto.response.CsvExportResult;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.DocumentStorageService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventExportService;
import com.fptu.fcms.service.EventReportCalculationService;
import com.fptu.fcms.service.EventReportPdfRenderer;
import com.fptu.fcms.service.EventReportingDatasetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomaticEventReportServiceImplTest {

    @Mock private EventReportingDatasetService datasetService;
    @Mock private EventReportCalculationService calculationService;
    @Mock private EventExportService exportService;
    @Mock private EventReportPdfRenderer pdfRenderer;
    @Mock private DocumentStorageService documentStorageService;
    @Mock private EventRepository eventRepository;
    @Mock private EventReportRepository eventReportRepository;
    @Mock private EventAssignmentAccessService eventAssignmentAccessService;

    private AutomaticEventReportServiceImpl automaticReportService;
    private UserPrincipal mockUser;

    @BeforeEach
    void setUp() {
        automaticReportService = new AutomaticEventReportServiceImpl(
                datasetService,
                calculationService,
                exportService,
                pdfRenderer,
                documentStorageService,
                eventRepository,
                eventReportRepository,
                eventAssignmentAccessService,
                new ObjectMapper()
        );

        mockUser = new UserPrincipal(10, "leader@fpt.edu.vn", 1, "Leader", "Leader", 1, List.of());
    }

    @Test
    @DisplayName("previewAuto returns PDF byte array starting with %PDF- without side effects")
    void testPreviewAuto() {
        Integer eventId = 1;
        Event event = new Event();
        event.setEventID(eventId);
        event.setEventCode("EVT-01");
        event.setEventName("Test Event");
        event.setEventStatus(EventStatus.COMPLETED);

        EventReportingDataset dataset = new EventReportingDataset(event, List.of(), List.of(), List.of(), List.of(), List.of(), Map.of(), LocalDateTime.now());

        EventReportSnapshot.EventOverview overview = new EventReportSnapshot.EventOverview(
                eventId, "EVT-01", "Test Event", "CLB F-Code", "SPRING 2026", "Room A", "Detail", "Desc", false,
                LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(),
                100, false, false, BigDecimal.ZERO, "VND", BigDecimal.ZERO, "COMPLETED"
        );

        EventReportSnapshot snapshot = new EventReportSnapshot(
                overview,
                new EventReportSnapshot.RegistrationMetrics(10, 10, 0, 0, 10, 0, 0, 100.0, 0.0, Map.of(), Map.of()),
                new EventReportSnapshot.TicketMetrics(10, 10, 0, 0, 10, 0, 10, 0, 1.0, 1),
                new EventReportSnapshot.PaymentMetrics(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, 0, 0, 10, 100.0, BigDecimal.ZERO, BigDecimal.ZERO, Map.of(), Map.of()),
                new EventReportSnapshot.AttendanceMetrics(1, 10, 8, 2, 80.0, 20.0, 0, 8, 0, 0, 0, 8, Map.of(), Map.of()),
                new EventReportSnapshot.FeedbackMetrics(0, BigDecimal.ZERO, BigDecimal.ZERO),
                List.of(),
                new EventReportSnapshot.ReportReadiness(true, true, true, true, true, 0),
                LocalDateTime.now(), "1.0.0", "1.0.0"
        );

        byte[] fakePdf = "%PDF-1.7 Fake PDF Content".getBytes();

        when(eventRepository.findByEventIDAndIsDeletedFalse(eventId)).thenReturn(Optional.of(event));
        when(datasetService.loadDataset(eq(eventId), any())).thenReturn(dataset);
        when(calculationService.calculateSnapshot(dataset)).thenReturn(snapshot);
        when(exportService.exportRegistrations(eq(dataset), anyBoolean())).thenReturn(new CsvExportResult("header\r\n".getBytes(), 0));
        when(exportService.exportAttendance(dataset)).thenReturn(new CsvExportResult("header\r\n".getBytes(), 0));
        when(pdfRenderer.renderPdf(any(), any(), any(), any())).thenReturn(fakePdf);

        byte[] result = automaticReportService.previewAuto(eventId, new AutomaticEventReportRequest("Good", "", "", "", "", ""), mockUser);

        assertNotNull(result);
        assertTrue(result.length > 0);
        assertEquals('%', result[0]);
        assertEquals('P', result[1]);
        assertEquals('D', result[2]);
        assertEquals('F', result[3]);

        verify(eventReportRepository, never()).save(any());
    }

    @Test
    @DisplayName("submitAuto fails when report readiness has blocking warnings")
    void testSubmitAutoNotReadyThrowsException() {
        Integer eventId = 2;
        Event event = new Event();
        event.setEventID(eventId);
        event.setEventStatus(EventStatus.COMPLETED);

        EventReportingDataset dataset = new EventReportingDataset(event, List.of(), List.of(), List.of(), List.of(), List.of(), Map.of(), LocalDateTime.now());

        EventReportSnapshot.ReportReadiness unready = new EventReportSnapshot.ReportReadiness(false, true, false, true, true, 1);
        EventReportSnapshot snapshot = mock(EventReportSnapshot.class);
        when(snapshot.readiness()).thenReturn(unready);

        when(eventRepository.findByEventIDAndIsDeletedFalse(eventId)).thenReturn(Optional.of(event));
        when(datasetService.loadDataset(eq(eventId), any())).thenReturn(dataset);
        when(calculationService.calculateSnapshot(dataset)).thenReturn(snapshot);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                automaticReportService.submitAuto(eventId, new AutomaticEventReportRequest("", "", "", "", "", ""), mockUser)
        );

        assertTrue(ex.getMessage().contains("Dữ liệu sự kiện chưa đủ điều kiện"));
    }

    @Test
    @DisplayName("getAutoData throws exception when user has no access to manage event")
    void testAuthorizationFailureThrowsException() {
        Integer eventId = 99;
        doThrow(new org.springframework.security.access.AccessDeniedException("Truy cập bị từ chối"))
                .when(eventAssignmentAccessService).ensureCanManageEvent(eventId, mockUser);

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () ->
                automaticReportService.getAutoData(eventId, mockUser)
        );
    }

    @Test
    @DisplayName("previewAuto passes eventId to canViewGuestContact permission check, not clubId")
    void testPreviewAutoPassesEventIdToCanViewGuestContact() {
        Integer eventId = 42;
        Integer clubId = 7;
        Event event = new Event();
        event.setEventID(eventId);
        event.setClubID(clubId);
        event.setEventCode("EVT-42");
        event.setEventName("Event 42");
        event.setEventStatus(EventStatus.COMPLETED);

        EventReportingDataset dataset = new EventReportingDataset(event, List.of(), List.of(), List.of(), List.of(), List.of(), Map.of(), LocalDateTime.now());
        EventReportSnapshot.EventOverview overview = new EventReportSnapshot.EventOverview(
                eventId, "EVT-42", "Event 42", "CLB A", "SPRING 2026", "Room A", "Detail", "Desc", false,
                LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(), LocalDateTime.now(),
                100, false, false, BigDecimal.ZERO, "VND", BigDecimal.ZERO, "COMPLETED"
        );
        EventReportSnapshot snapshot = new EventReportSnapshot(
                overview,
                new EventReportSnapshot.RegistrationMetrics(0, 0, 0, 0, 0, 0, 0, 0.0, 0.0, Map.of(), Map.of()),
                new EventReportSnapshot.TicketMetrics(0, 0, 0, 0, 0, 0, 0, 0, 0.0, 0),
                new EventReportSnapshot.PaymentMetrics(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, 0, 0, 0, 0.0, BigDecimal.ZERO, BigDecimal.ZERO, Map.of(), Map.of()),
                new EventReportSnapshot.AttendanceMetrics(1, 0, 0, 0, 0.0, 0.0, 0, 0, 0, 0, 0, 0, Map.of(), Map.of()),
                new EventReportSnapshot.FeedbackMetrics(0, BigDecimal.ZERO, BigDecimal.ZERO),
                List.of(),
                new EventReportSnapshot.ReportReadiness(true, true, true, true, true, 0),
                LocalDateTime.now(), "1.0.0", "1.0.0"
        );

        when(eventRepository.findByEventIDAndIsDeletedFalse(eventId)).thenReturn(Optional.of(event));
        when(datasetService.loadDataset(eq(eventId), any())).thenReturn(dataset);
        when(calculationService.calculateSnapshot(dataset)).thenReturn(snapshot);
        when(eventAssignmentAccessService.canViewGuestContact(eventId, mockUser)).thenReturn(true);
        when(exportService.exportRegistrations(eq(dataset), eq(true))).thenReturn(new CsvExportResult("header\r\n".getBytes(), 0));
        when(exportService.exportAttendance(dataset)).thenReturn(new CsvExportResult("header\r\n".getBytes(), 0));
        when(pdfRenderer.renderPdf(any(), any(), any(), any())).thenReturn("%PDF-1.7".getBytes());

        automaticReportService.previewAuto(eventId, new AutomaticEventReportRequest("", "", "", "", "", ""), mockUser);

        verify(eventAssignmentAccessService).canViewGuestContact(eq(eventId), eq(mockUser));
        verify(eventAssignmentAccessService, never()).canViewGuestContact(eq(clubId), any());
    }
}
