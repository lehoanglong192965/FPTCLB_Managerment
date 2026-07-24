package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateEventReportRequest;

import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.DocumentStorageService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventExportService;
import com.fptu.fcms.service.EventReportStatisticsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportUploadServiceImplAuthorizationTest {

    @Mock private EventRepository eventRepository;
    @Mock private EventReportRepository eventReportRepository;
    @Mock private ClamAvScanService clamAvScanService;
    @Mock private DocumentStorageService documentStorageService;
    @Mock private EventExportService eventExportService;
    @Mock private EventReportStatisticsService eventReportStatisticsService;
    @Mock private EventAssignmentAccessService eventAssignmentAccessService;

    @InjectMocks private ReportUploadServiceImpl service;

    @Test
    void uploadReportDoesNotLoadEventOrUploadFilesWhenAccessDenied() {
        UserPrincipal principal = mock(UserPrincipal.class);
        CreateEventReportRequest request = new CreateEventReportRequest();
        request.setEventID(42);
        BusinessRuleException denied =
                new BusinessRuleException("FORBIDDEN", "denied", HttpStatus.FORBIDDEN);
        doThrow(denied).when(eventAssignmentAccessService).ensureCanManageEvent(42, principal);

        assertSame(denied, assertThrows(
                BusinessRuleException.class,
                () -> service.uploadEventReport(request, principal)
        ));

        verifyNoInteractions(
                eventRepository,
                eventReportRepository,
                documentStorageService,
                eventExportService
        );
    }

    @Test
    void getReportChecksEventAccessBeforeReadingReport() {
        UserPrincipal principal = mock(UserPrincipal.class);
        EventReport report = new EventReport();
        when(eventReportRepository.findByEventIDAndIsDeletedFalse(42)).thenReturn(Optional.of(report));

        assertSame(report, service.getReportByEventId(42, principal).orElseThrow());

        var ordered = inOrder(eventAssignmentAccessService, eventReportRepository);
        ordered.verify(eventAssignmentAccessService).ensureCanManageEvent(42, principal);
        ordered.verify(eventReportRepository).findByEventIDAndIsDeletedFalse(42);
    }

    @Test
    void getReportDoesNotQueryReportWhenEventAccessIsDenied() {
        UserPrincipal principal = mock(UserPrincipal.class);
        BusinessRuleException denied =
                new BusinessRuleException("FORBIDDEN", "denied", HttpStatus.FORBIDDEN);
        doThrow(denied).when(eventAssignmentAccessService).ensureCanManageEvent(42, principal);

        assertSame(denied, assertThrows(
                BusinessRuleException.class,
                () -> service.getReportByEventId(42, principal)
        ));

        verifyNoInteractions(eventReportRepository);
    }
}
