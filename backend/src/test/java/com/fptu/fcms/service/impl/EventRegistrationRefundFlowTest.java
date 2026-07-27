package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CompleteRefundRequest;
import com.fptu.fcms.dto.request.RegistrationCancelRequest;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.PaymentStatus;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.EventAssignmentAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventRegistrationRefundFlowTest {

    @Mock private EventRegistrationRepository registrationRepository;
    @Mock private EventRepository eventRepository;
    @Mock private EventAssignmentAccessService eventAssignmentAccessService;
    @Mock private EmailService emailService;
    @InjectMocks private EventRegistrationServiceImpl service;

    @Test
    void purchaserRefundRecipientIsCopiedToEveryPendingTicketInOrder() {
        EventRegistration first = pendingRefund(1, 7, "ORDER-1");
        EventRegistration second = pendingRefund(2, 7, "ORDER-1");
        when(registrationRepository.findById(1)).thenReturn(Optional.of(first));
        when(registrationRepository.findByTicketOrderCodeAndPurchaserUserIDAndIsDeletedFalse("ORDER-1", 7))
                .thenReturn(List.of(first, second));

        RegistrationCancelRequest request = new RegistrationCancelRequest();
        request.setRefundBankCode("MB");
        request.setRefundBankName("MB Bank");
        request.setRefundAccountNumber("123456789");
        request.setRefundAccountHolder("NGUYEN VAN A");
        service.updateRefundRecipient(1, request, principal(7));

        assertEquals("123456789", first.getRefundAccountNumber());
        assertEquals("123456789", second.getRefundAccountNumber());
        verify(registrationRepository).saveAll(List.of(first, second));
    }

    @Test
    void completingOneRefundDoesNotMarkOtherTicketsInOrderRefunded() {
        EventRegistration selected = pendingRefund(1, 7, "ORDER-1");
        selected.setEventID(99);
        selected.setGuestEmail("holder@example.com");
        selected.setRefundBankName("MB Bank");
        selected.setRefundAccountNumber("123456789");
        selected.setRefundAccountHolder("NGUYEN VAN A");
        selected.setRefundAmount(new BigDecimal("50000"));
        EventRegistration other = pendingRefund(2, 7, "ORDER-1");

        when(eventRepository.findByEventIDAndIsDeletedFalseForUpdate(99)).thenReturn(Optional.of(new Event()));
        when(registrationRepository.findById(1)).thenReturn(Optional.of(selected));
        when(registrationRepository.save(selected)).thenReturn(selected);
        CompleteRefundRequest request = new CompleteRefundRequest();
        request.setTransactionReference("FT-123");

        service.markMemberRefunded(99, 1, request, principal(9));

        assertEquals(PaymentStatus.REFUNDED, selected.getPaymentStatus());
        assertEquals(PaymentStatus.REFUND_PENDING, other.getPaymentStatus());
        verify(registrationRepository, never())
                .findByTicketOrderCodeAndPurchaserUserIDAndIsDeletedFalse("ORDER-1", 7);
    }

    private EventRegistration pendingRefund(Integer id, Integer purchaserId, String orderCode) {
        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(id);
        registration.setPurchaserUserID(purchaserId);
        registration.setTicketOrderCode(orderCode);
        registration.setPaymentStatus(PaymentStatus.REFUND_PENDING);
        registration.setPaymentCurrency("VND");
        return registration;
    }

    private UserPrincipal principal(Integer id) {
        return new UserPrincipal(id, "user@fpt.edu.vn", 3, "Student", null, null,
                List.of(new SimpleGrantedAuthority("ROLE_Student")));
    }
}
