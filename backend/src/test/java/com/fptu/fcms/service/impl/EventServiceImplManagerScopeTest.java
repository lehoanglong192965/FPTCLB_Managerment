package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.UpdateEventRequest;
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

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class EventServiceImplManagerScopeTest {

    private static final Integer EVENT_ID = 100;

    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventServiceImpl service;

    @Test
    void crossClubLeaderIsDeniedBeforeEveryManagerScopedMethodReadsOrMutatesEvent() {
        UserPrincipal currentUser = principal();
        BusinessRuleException deniedForCrossClub = new BusinessRuleException(
                ApiErrorCode.FORBIDDEN.name(),
                "You are not authorized to manage this event.",
                HttpStatus.FORBIDDEN
        );
        doThrow(deniedForCrossClub).when(eventAssignmentAccessService)
                .ensureCanManageEvent(eq(EVENT_ID), same(currentUser));

        assertAll(
                () -> assertSame(
                        deniedForCrossClub,
                        assertThrows(
                                BusinessRuleException.class,
                                () -> service.getManagedEventDetail(EVENT_ID, currentUser)
                        )
                ),
                () -> assertSame(
                        deniedForCrossClub,
                        assertThrows(
                                BusinessRuleException.class,
                                () -> service.submitEventProposal(EVENT_ID, currentUser)
                        )
                ),
                () -> assertSame(
                        deniedForCrossClub,
                        assertThrows(
                                BusinessRuleException.class,
                                () -> service.openRegistration(EVENT_ID, currentUser)
                        )
                ),
                () -> assertSame(
                        deniedForCrossClub,
                        assertThrows(
                                BusinessRuleException.class,
                                () -> service.closeRegistration(EVENT_ID, currentUser)
                        )
                ),
                () -> assertSame(
                        deniedForCrossClub,
                        assertThrows(
                                BusinessRuleException.class,
                                () -> service.updateEvent(EVENT_ID, new UpdateEventRequest(), currentUser)
                        )
                ),
                () -> assertSame(
                        deniedForCrossClub,
                        assertThrows(
                                BusinessRuleException.class,
                                () -> service.deleteDraftEvent(EVENT_ID, currentUser)
                        )
                )
        );

        verify(eventAssignmentAccessService, times(6)).ensureCanManageEvent(EVENT_ID, currentUser);
        verifyNoInteractions(eventRepository);
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
