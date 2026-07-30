package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.RegistrationCancelRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.repository.GuestVerificationOtpRepository;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.GuestPaymentEmailService;
import com.fptu.fcms.service.RegistrationAllocationPort;
import com.fptu.fcms.service.RegistrationNotificationService;
import com.fptu.fcms.service.event.RegistrationAllocationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestRegistrationServiceImplCancellationTest {

    @Mock EventRepository eventRepository;
    @Mock EventRegistrationRepository eventRegistrationRepository;
    @Mock GuestEventRegistrationRepository guestEventRegistrationRepository;
    @Mock GuestVerificationOtpRepository guestVerificationOtpRepository;
    @Mock RegistrationAllocationPort registrationAllocationPort;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @Mock GuestPaymentEmailService guestPaymentEmailService;
    @Mock RegistrationNotificationService registrationNotificationService;
    @Mock RegistrationAllocationService registrationAllocationService;
    @Mock AttendanceSessionRepository attendanceSessionRepository;
    @Mock AttendanceRecordRepository attendanceRecordRepository;

    @InjectMocks GuestRegistrationServiceImpl service;

    @Test
    void paidGuestCancellationStoresRefundRecipientBeforeChangingPaymentStatus() {
        GuestEventRegistration registration = new GuestEventRegistration();
        registration.setGuestRegistrationID(12);
        registration.setEventID(7);
        registration.setGuestFullName("Nguyen Van A");
        registration.setGuestEmail("guest@example.com");
        registration.setGuestPhone("0900000000");
        registration.setRegistrationStatus(RegistrationStatus.CONFIRMED);
        registration.setStatus(RegistrationStatus.CONFIRMED.name());
        registration.setPaymentStatus(PaymentStatus.PAID);
        registration.setAmountPaid(new BigDecimal("30000"));

        Event event = new Event();
        event.setEventID(7);
        event.setStartDate(LocalDateTime.now().plusDays(2));
        event.setMaxParticipants(100);

        RegistrationCancelRequest request = new RegistrationCancelRequest();
        request.setReason("Không thể tham gia");
        request.setRefundBankCode("970422");
        request.setRefundBankName("MB Bank");
        request.setRefundAccountNumber("0796578863");
        request.setRefundAccountHolder("NGUYEN VAN A");

        when(guestEventRegistrationRepository.findByGuestReferenceHashAndIsDeletedFalse(anyString()))
                .thenReturn(Optional.of(registration));
        when(eventRepository.findByEventIDAndIsDeletedFalseForUpdate(7)).thenReturn(Optional.of(event));
        when(attendanceSessionRepository.findByEventID(7)).thenReturn(Optional.empty());

        var response = service.cancel("guest-reference", request);

        assertEquals(RegistrationStatus.CANCELLED, registration.getRegistrationStatus());
        assertEquals(PaymentStatus.REFUND_PENDING, registration.getPaymentStatus());
        assertEquals("970422", registration.getRefundBankCode());
        assertEquals("0796578863", registration.getRefundAccountNumber());
        assertEquals(new BigDecimal("50.00"), registration.getRefundRate());
        assertEquals(new BigDecimal("15000.00"), registration.getRefundAmount());
        assertEquals("TIME_BASED_REFUND_V2:AT_LEAST_24_HOURS_50", registration.getRefundPolicySnapshot());
        assertNotNull(registration.getRefundRequestedAt());
        assertEquals(PaymentStatus.REFUND_PENDING, response.getPaymentStatus());
        verify(guestEventRegistrationRepository).save(registration);
        verify(registrationNotificationService).notifyGuestRegistrationStatus(registration);
    }
}
