package com.fptu.fcms.dto.response;

import java.time.LocalDateTime;

public record GuestRecoveryChallengeResponse(
        String challenge,
        String emailMasked,
        LocalDateTime otpExpiresAt
) { }
