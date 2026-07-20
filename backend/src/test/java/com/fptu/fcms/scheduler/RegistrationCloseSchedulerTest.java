package com.fptu.fcms.scheduler;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.SchedulerLog;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.SchedulerLogRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationCloseSchedulerTest {

    @Mock
    private SchedulerLogRepository schedulerLogRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventService eventService;

    @InjectMocks
    private RegistrationCloseScheduler scheduler;

    @Test
    void expiredRegistrationUsesInternalAutomaticCloseInsteadOfSyntheticPrincipal() {
        Event expiredEvent = new Event();
        expiredEvent.setEventID(100);
        expiredEvent.setRegistrationCloseAt(LocalDateTime.now().minusMinutes(1));

        when(schedulerLogRepository.existsByJobNameAndExecutionDate(anyString(), any(LocalDate.class)))
                .thenReturn(false);
        when(schedulerLogRepository.findByJobNameAndExecutionDate(anyString(), any(LocalDate.class)))
                .thenReturn(Optional.of(new SchedulerLog()));
        when(eventRepository.findByEventStatusAndIsDeletedFalse(EventStatus.REGISTRATION_OPEN))
                .thenReturn(List.of(expiredEvent));

        scheduler.closeExpiredRegistrations();

        verify(eventService).closeRegistrationAutomatically(100);
        verify(eventService, never()).closeRegistration(eq(100), any(UserPrincipal.class));
    }
}
