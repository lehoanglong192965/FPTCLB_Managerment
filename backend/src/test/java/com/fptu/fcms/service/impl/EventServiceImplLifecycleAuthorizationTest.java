package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CancelEventRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventAssignmentAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplLifecycleAuthorizationTest {

    private static final Integer EVENT_ID = 100;

    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventServiceImpl service;

    @Test
    void crossClubLeaderIsDeniedBeforeStartCanLoadOrMutateEvent() {
        UserPrincipal currentUser = principal();
        BusinessRuleException denied = new BusinessRuleException(
                ApiErrorCode.FORBIDDEN.name(),
                "You are not authorized to manage this event.",
                HttpStatus.FORBIDDEN
        );
        doThrow(denied).when(eventAssignmentAccessService).ensureCanManageEvent(EVENT_ID, currentUser);

        BusinessRuleException actual = assertThrows(
                BusinessRuleException.class,
                () -> service.startEvent(EVENT_ID, currentUser)
        );

        assertSame(denied, actual);
        verifyNoInteractions(eventRepository);
    }

    @Test
    void cancelRejectsMismatchedClubIdAfterScopedAuthorization() {
        UserPrincipal currentUser = principal();
        Event event = new Event();
        event.setEventID(EVENT_ID);
        event.setClubID(10);
        event.setEventStatus(EventStatus.APPROVED);
        when(eventRepository.findByEventIDAndIsDeletedFalse(EVENT_ID)).thenReturn(Optional.of(event));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.cancelEvent(20, EVENT_ID, new CancelEventRequest(), currentUser)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
        verify(eventAssignmentAccessService).ensureCanManageEvent(EVENT_ID, currentUser);
        verify(eventRepository, never()).save(any(Event.class));
    }

    private UserPrincipal principal() {
        return new UserPrincipal(
                17,
                "leader@fpt.edu.vn",
                3,
                "Leader",
                "Leader",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_Leader"))
        );
    }
}
