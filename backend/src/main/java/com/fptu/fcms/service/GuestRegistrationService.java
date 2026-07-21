package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.GuestOtpVerifyRequest;
import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.response.GuestOtpVerifyResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;
import com.fptu.fcms.dto.response.GuestRegistrationStatusResponse;
import com.fptu.fcms.dto.request.ConfirmEventPaymentRequest;

public interface GuestRegistrationService {
    GuestRegistrationResponse createGuestRegistration(Integer eventId, GuestRegistrationRequest request);

    GuestOtpVerifyResponse verifyOtp(String guestReference, GuestOtpVerifyRequest request);

    GuestRegistrationResponse resendOtp(String guestReference);

    GuestRegistrationStatusResponse getStatus(String guestReference);

    GuestRegistrationStatusResponse cancel(String guestReference);

    GuestRegistrationStatusResponse confirmPayment(String guestReference, ConfirmEventPaymentRequest request);
}
