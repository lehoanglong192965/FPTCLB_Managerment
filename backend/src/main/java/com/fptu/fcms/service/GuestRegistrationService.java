package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.GuestOtpVerifyRequest;
import com.fptu.fcms.dto.request.GuestRegistrationRequest;
import com.fptu.fcms.dto.response.GuestOtpVerifyResponse;
import com.fptu.fcms.dto.response.GuestRegistrationResponse;
import com.fptu.fcms.dto.response.GuestRegistrationStatusResponse;
import com.fptu.fcms.dto.request.ConfirmEventPaymentRequest;
import com.fptu.fcms.dto.request.GuestRecoveryRequest;
import com.fptu.fcms.dto.response.GuestRecoveryChallengeResponse;
import com.fptu.fcms.dto.response.GuestRecoveryVerifyResponse;

public interface GuestRegistrationService {
    GuestRegistrationResponse createGuestRegistration(Integer eventId, GuestRegistrationRequest request);

    GuestOtpVerifyResponse verifyOtp(String guestReference, GuestOtpVerifyRequest request);

    GuestRegistrationResponse resendOtp(String guestReference);

    GuestRegistrationStatusResponse getStatus(String guestReference);

    GuestRegistrationStatusResponse cancel(String guestReference, String reason);
    GuestRegistrationStatusResponse confirmPayment(String guestReference, ConfirmEventPaymentRequest request);
    GuestRecoveryChallengeResponse requestRecovery(GuestRecoveryRequest request);
    GuestRecoveryVerifyResponse verifyRecovery(String challenge, GuestOtpVerifyRequest request);
}
