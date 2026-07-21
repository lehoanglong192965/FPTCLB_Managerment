package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationAllocationServiceImplTicketTest {

    @Mock
    private EventRegistrationRepository registrationRepository;
    @Mock
    private GuestEventRegistrationRepository guestRegistrationRepository;

    @InjectMocks
    private RegistrationAllocationServiceImpl service;

    @Test
    void promotedWaitlistRegistrationReceivesStaticTicket() {
        EventRegistration waitlisted = new EventRegistration();
        waitlisted.setRegistrationID(42);
        waitlisted.setEventID(12);
        waitlisted.setRegistrationStatus(RegistrationStatus.WAITLISTED);
        waitlisted.setStatus(RegistrationStatus.WAITLISTED.name());

        when(registrationRepository.countByEventIDAndRegistrationStatusInAndCapacityExemptFalseAndIsDeletedFalse(
                12,
                RegistrationLifecycle.CONFIRMED_STATUSES
        )).thenReturn(0L);
        when(guestRegistrationRepository.countByEventIDAndRegistrationStatusInAndIsDeletedFalse(
                12,
                RegistrationLifecycle.CONFIRMED_STATUSES
        )).thenReturn(0L);
        when(registrationRepository.findByEventIDAndRegistrationStatusAndIsDeletedFalseOrderByRegisteredAtAsc(
                12,
                RegistrationLifecycle.STATUS_WAITLISTED
        )).thenReturn(List.of(waitlisted));
        when(registrationRepository.save(any(EventRegistration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(1, service.promoteWaitlisted(12, 1));
        assertEquals(RegistrationStatus.CONFIRMED, waitlisted.getRegistrationStatus());
        assertNotNull(waitlisted.getTicketCode());
        assertNotNull(waitlisted.getTicketIssuedAt());
    }
}
