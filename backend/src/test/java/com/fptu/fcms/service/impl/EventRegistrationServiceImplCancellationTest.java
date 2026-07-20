package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.exception.ApiErrorCode;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventRegistrationServiceImplCancellationTest {

    @Mock
    private EventRegistrationRepository registrationRepo;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;
    @Mock
    private EventAssignmentAccessService eventAssignmentAccessService;

    @InjectMocks
    private EventRegistrationServiceImpl service;

    @Test
    void selfCancelAfterEventStartIsRejectedBeforeTicketRevocationOrWaitlistPromotion() {
        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(42);
        registration.setEventID(11);
        registration.setUserID(5);
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);

        Event event = new Event();
        event.setEventID(11);
        event.setEventStatus(EventStatus.ONGOING);

        UserPrincipal owner = new UserPrincipal(
                5,
                "owner@fpt.edu.vn",
                3,
                "Student",
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_Student"))
        );

        when(registrationRepo.findById(42)).thenReturn(Optional.of(registration));
        doThrow(new BusinessRuleException(ApiErrorCode.FORBIDDEN.name(), "Forbidden.", HttpStatus.FORBIDDEN))
                .when(eventAssignmentAccessService).ensureCanManageEvent(11, owner);
        when(eventRepository.findByEventIDAndIsDeletedFalseForUpdate(11)).thenReturn(Optional.of(event));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> service.cancelRegistration(42, owner)
        );

        assertEquals(ApiErrorCode.REGISTRATION_CANCEL_WINDOW_CLOSED.name(), error.getErrorCode());
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, error.getStatus());
        verify(registrationRepo, never()).save(registration);
        verifyNoInteractions(attendanceRecordRepository);
    }
}
