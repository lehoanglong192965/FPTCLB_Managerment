package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.EventSubmissionResponse;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.AuditLog;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.AuditLogRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AuditLogService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import com.fptu.fcms.service.EventRegistrationPolicyService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplSubmissionLimitTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private EventRegistrationPolicyService eventRegistrationPolicyService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private EventServiceImpl service;

    @Test
    void thirdSubmissionSucceedsAndStartsTwentyFourHourCooldown() {
        Event event = validEvent(EventStatus.DRAFT);
        event.setSubmissionAttemptCount(2);
        prepare(event);

        LocalDateTime beforeSubmit = LocalDateTime.now();
        EventSubmissionResponse response = service.submitEventProposal(event.getEventID(), principal());

        assertEquals(EventStatus.PENDING_APPROVAL, event.getEventStatus());
        assertEquals(3, event.getSubmissionAttemptCount());
        assertEquals(3, response.submissionAttemptCount());
        assertEquals(0, response.attemptsRemaining());
        assertNotNull(event.getLastSubmittedAt());
        assertNotNull(event.getSubmissionBlockedUntil());
        assertTrue(event.getSubmissionBlockedUntil().isAfter(beforeSubmit.plusHours(23)));
        verify(auditLogService).record(
                eq(17), eq("Event"), eq(event.getEventID()), eq("EVENT_PROPOSAL_SUBMITTED"),
                eq("DRAFT"), eq("PENDING_APPROVAL; attempt=3"), eq(null));
    }

    @Test
    void fourthSubmissionBeforeCooldownExpiresIsRejected() {
        Event event = validEvent(EventStatus.REJECTED);
        event.setSubmissionAttemptCount(3);
        event.setSubmissionBlockedUntil(LocalDateTime.now().plusHours(2));
        prepareForLookup(event);

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.submitEventProposal(event.getEventID(), principal()));

        assertEquals("EVENT_SUBMISSION_COOLDOWN", error.getErrorCode());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, error.getStatus());
        assertEquals(EventStatus.REJECTED, event.getEventStatus());
        verify(eventRegistrationPolicyService, never()).validateBeforeSubmit(any());
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void expiredCooldownResetsCounterAndAllowsRejectedEventToBeResubmitted() {
        Event event = validEvent(EventStatus.REJECTED);
        event.setSubmissionAttemptCount(3);
        event.setSubmissionBlockedUntil(LocalDateTime.now().minusMinutes(1));
        event.setRejectionReason("Cần cập nhật địa điểm");
        prepare(event);

        EventSubmissionResponse response = service.submitEventProposal(event.getEventID(), principal());

        assertEquals(1, response.submissionAttemptCount());
        assertEquals(2, response.attemptsRemaining());
        assertNull(event.getSubmissionBlockedUntil());
        assertNull(event.getRejectionReason());
        assertTrue(Boolean.TRUE.equals(event.getIsResubmitted()));
        assertEquals(EventStatus.PENDING_APPROVAL, event.getEventStatus());
    }

    private void prepare(Event event) {
        prepareForLookup(event);
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void prepareForLookup(Event event) {
        when(eventRepository.findByEventIDAndIsDeletedFalseForUpdate(event.getEventID()))
                .thenReturn(Optional.of(event));
        long recentAttempts = event.getSubmissionBlockedUntil() != null
                && event.getSubmissionBlockedUntil().isBefore(LocalDateTime.now())
                ? 0L
                : event.getSubmissionAttemptCount();
        when(auditLogRepository.countByActorIDAndActionTypeAndExecutedAtGreaterThanEqual(
                eq(17), eq("EVENT_PROPOSAL_SUBMITTED"), any(LocalDateTime.class)))
                .thenReturn(recentAttempts);
        if (recentAttempts >= 3) {
            AuditLog firstAttempt = new AuditLog();
            firstAttempt.setExecutedAt(LocalDateTime.now().minusHours(22));
            when(auditLogRepository
                    .findFirstByActorIDAndActionTypeAndExecutedAtGreaterThanEqualOrderByExecutedAtAsc(
                            eq(17), eq("EVENT_PROPOSAL_SUBMITTED"), any(LocalDateTime.class)))
                    .thenReturn(Optional.of(firstAttempt));
        }
    }

    private Event validEvent(EventStatus status) {
        Event event = new Event();
        event.setEventID(14);
        event.setCreatedBy(17);
        event.setEventStatus(status);
        event.setStartDate(LocalDateTime.now().plusDays(10));
        event.setEndDate(LocalDateTime.now().plusDays(10).plusHours(2));
        event.setTotalCapacity(100);
        event.setSubmissionAttemptCount(0);
        event.setIsDeleted(false);
        return event;
    }

    private UserPrincipal principal() {
        return new UserPrincipal(17, "leader@fpt.edu.vn", 3, List.of());
    }
}
