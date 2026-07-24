package com.fptu.fcms.dto.response;

public record GuestRecoveryVerifyResponse(
        String guestReference,
        String registrationStatus,
        String paymentStatus
) { }
