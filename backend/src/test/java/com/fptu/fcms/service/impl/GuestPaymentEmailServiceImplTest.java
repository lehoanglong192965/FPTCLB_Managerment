package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.GuestEventRegistration;
import com.fptu.fcms.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class GuestPaymentEmailServiceImplTest {

    @Mock
    private EmailService emailService;

    private GuestPaymentEmailServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GuestPaymentEmailServiceImpl(emailService);
        ReflectionTestUtils.setField(service, "bankName", "MB Bank");
        ReflectionTestUtils.setField(service, "accountNumber", "0796578863");
        ReflectionTestUtils.setField(service, "accountName", "LE HOANG LONG");
        ReflectionTestUtils.setField(service, "bankBranch", "MB Bank");
        ReflectionTestUtils.setField(service, "guestStatusBaseUrl", "http://localhost:5173/guest/status");
        ReflectionTestUtils.setField(service, "guestLookupUrl", "http://localhost:5173/guest/lookup");
    }

    @Test
    void instructionContainsPaymentReferenceBankDetailsDeadlineAndRecoveryLinks() {
        Event event = new Event();
        event.setEventName("Workshop kỹ năng");
        event.setEventCode("WS-01");
        event.setStartDate(LocalDateTime.of(2026, 8, 1, 8, 0));
        event.setEndDate(LocalDateTime.of(2026, 8, 1, 11, 0));
        event.setLocation("FPT University HCM");

        GuestEventRegistration registration = new GuestEventRegistration();
        registration.setGuestEmail("guest@example.com");
        registration.setGuestFullName("Nguyễn Văn A");
        registration.setRegistrationCode("REG-GUEST-26-ABC123");
        registration.setPaymentReference("GUEST5AE8DB45ED");
        registration.setAmountDue(new BigDecimal("33333"));
        registration.setPaymentCurrency("VND");
        registration.setPaymentExpiresAt(LocalDateTime.of(2026, 7, 25, 3, 30));

        service.sendPaymentInstruction(registration, event, "secure-reference");

        ArgumentCaptor<String> content = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendSimpleEmail(
                org.mockito.ArgumentMatchers.eq("guest@example.com"),
                org.mockito.ArgumentMatchers.contains("Hoàn tất thanh toán"),
                content.capture(),
                org.mockito.ArgumentMatchers.eq("secure-reference")
        );
        String email = content.getValue();
        assertTrue(email.contains("REG-GUEST-26-ABC123"));
        assertTrue(email.contains("GUEST5AE8DB45ED"));
        assertTrue(email.contains("0796578863"));
        assertTrue(email.contains("LE HOANG LONG"));
        assertTrue(email.contains("guest/status/secure-reference"));
        assertTrue(email.contains("guest/lookup"));
        assertTrue(email.contains("03:30 ngày 25/07/2026"));
    }
}
