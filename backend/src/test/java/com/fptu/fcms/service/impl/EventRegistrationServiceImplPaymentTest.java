package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.ConfirmEventPaymentRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.enums.PaymentMethod;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventRegistrationServiceImplPaymentTest {

    @Mock private EventRegistrationRepository registrationRepository;
    @Mock private EventRepository eventRepository;

    @InjectMocks private EventRegistrationServiceImpl service;

    @Test
    void reportingBankTransferDoesNotIssueTicketOrMarkPaid() {
        Event event = new Event();
        event.setEventID(12);
        event.setEventName("Paid event");
        event.setEventStatus(EventStatus.REGISTRATION_OPEN);
        event.setIsPaidEvent(true);

        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(44);
        registration.setEventID(12);
        registration.setUserID(7);
        registration.setPurchaserUserID(7);
        registration.setGuestFullName("Ticket holder");
        registration.setGuestEmail("holder@example.com");
        registration.setTicketOrderCode("SINGLE-ORDER");
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        registration.setPaymentStatus(PaymentStatus.PENDING);
        registration.setAmountDue(new BigDecimal("100000"));
        registration.setAmountPaid(BigDecimal.ZERO);
        registration.setPaymentReference("EVT-12-ABCDEF123456");
        registration.setPaymentExpiresAt(LocalDateTime.now().plusMinutes(20));

        when(registrationRepository.findByRegistrationIDAndIsDeletedFalse(44)).thenReturn(Optional.of(registration));
        when(eventRepository.findByEventIDAndIsDeletedFalse(12)).thenReturn(Optional.of(event));
        when(registrationRepository.findByTicketOrderCodeAndPurchaserUserIDAndIsDeletedFalse("SINGLE-ORDER", 7))
                .thenReturn(List.of(registration));
        when(registrationRepository.saveAll(List.of(registration))).thenReturn(List.of(registration));

        ConfirmEventPaymentRequest request = new ConfirmEventPaymentRequest();
        request.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        service.confirmPayment(44, 7, request);

        assertEquals(PaymentStatus.AWAITING_VERIFICATION, registration.getPaymentStatus());
        assertEquals(BigDecimal.ZERO, registration.getAmountPaid());
        assertNull(registration.getPaidAt());
        assertNull(registration.getTicketCode());
        assertNull(registration.getTicketIssuedAt());
    }
}
