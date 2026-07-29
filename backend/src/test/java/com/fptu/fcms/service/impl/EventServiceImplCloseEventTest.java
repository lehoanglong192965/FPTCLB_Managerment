package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.ContributionBatch;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventReport;
import com.fptu.fcms.enums.ContributionBatchStatus;
import com.fptu.fcms.enums.EventReportStatus;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.ContributionBatchRepository;
import com.fptu.fcms.repository.EventReportRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.event.EventStateMachineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * P1-BE-5: closeEvent phải tra ContributionBatch bằng truy vấn chịu được dữ liệu trùng.
 * Bản findByEventIDAndIsDeletedFalse trả Optional nên Spring Data ném
 * IncorrectResultSizeDataAccessException khi một event có 2 batch active ⇒ HTTP 500,
 * sự kiện không bao giờ đóng được.
 */
@ExtendWith(MockitoExtension.class)
class EventServiceImplCloseEventTest {

    private static final Integer EVENT_ID = 100;

    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventStateMachineService eventStateMachineService;
    @Mock
    private EventReportRepository eventReportRepository;
    @Mock
    private ContributionBatchRepository contributionBatchRepository;

    @InjectMocks
    private EventServiceImpl service;

    private Event event;

    @BeforeEach
    void setUp() {
        event = new Event();
        event.setEventID(EVENT_ID);
        event.setEventStatus(EventStatus.REPORT_APPROVED);
        when(eventRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(Optional.of(event));
    }

    private void givenApprovedReport() {
        EventReport report = new EventReport();
        report.setStatus(EventReportStatus.APPROVED);
        when(eventReportRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(Optional.of(report));
    }

    private ContributionBatch batch(ContributionBatchStatus status) {
        ContributionBatch batch = new ContributionBatch();
        batch.setEventID(EVENT_ID);
        batch.setStatus(status);
        batch.setCreatedAt(LocalDateTime.now());
        return batch;
    }

    @Test
    @DisplayName("closeEvent tra batch bằng findFirst...OrderByCreatedAtDesc, không dùng bản trả Optional")
    void closeEventUsesDuplicateTolerantLookup() {
        givenApprovedReport();
        when(contributionBatchRepository.findFirstByEventIDAndIsDeletedFalseOrderByCreatedAtDesc(EVENT_ID))
                .thenReturn(Optional.of(batch(ContributionBatchStatus.FINALIZED)));

        service.closeEvent(EVENT_ID, principal());

        ArgumentCaptor<Event> saved = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(saved.capture());
        assertEquals(EventStatus.CLOSED, saved.getValue().getEventStatus());
    }

    @Test
    @DisplayName("Batch chưa FINALIZED thì chặn đóng sự kiện bằng lỗi nghiệp vụ, không phải 500")
    void closeEventRejectsWhenBatchNotFinalized() {
        givenApprovedReport();
        when(contributionBatchRepository.findFirstByEventIDAndIsDeletedFalseOrderByCreatedAtDesc(EVENT_ID))
                .thenReturn(Optional.of(batch(ContributionBatchStatus.SCORING)));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.closeEvent(EVENT_ID, principal()));

        assertEquals("CONTRIBUTION_BATCH_NOT_FINALIZED", error.getMessage());
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    @DisplayName("Chưa có batch nào thì cũng chặn, không NPE")
    void closeEventRejectsWhenBatchMissing() {
        givenApprovedReport();
        when(contributionBatchRepository.findFirstByEventIDAndIsDeletedFalseOrderByCreatedAtDesc(EVENT_ID))
                .thenReturn(Optional.empty());

        assertThrows(BusinessRuleException.class, () -> service.closeEvent(EVENT_ID, principal()));
        verify(eventRepository, never()).save(any(Event.class));
    }

    private UserPrincipal principal() {
        return new UserPrincipal(
                17, "leader@fpt.edu.vn", 3, "Leader", "Leader", null,
                List.of(new SimpleGrantedAuthority("ROLE_Leader")));
    }
}
