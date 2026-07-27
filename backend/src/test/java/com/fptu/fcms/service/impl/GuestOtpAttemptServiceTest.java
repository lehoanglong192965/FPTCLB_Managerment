package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.GuestVerificationOtp;
import com.fptu.fcms.enums.GuestOtpStatus;
import com.fptu.fcms.repository.GuestVerificationOtpRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestOtpAttemptServiceTest {

    @Mock
    private GuestVerificationOtpRepository otpRepository;

    @InjectMocks
    private GuestOtpAttemptService service;

    @Test
    void fifthInvalidAttemptLocksOtpAndFlushesState() {
        GuestVerificationOtp otp = new GuestVerificationOtp();
        otp.setOtpID(10);
        otp.setStatus(GuestOtpStatus.ACTIVE);
        otp.setAttemptCount(4);
        otp.setMaxAttempts(5);
        when(otpRepository.findById(10)).thenReturn(Optional.of(otp));

        service.recordInvalidAttempt(10, LocalDateTime.now());

        assertEquals(5, otp.getAttemptCount());
        assertEquals(GuestOtpStatus.LOCKED, otp.getStatus());
        verify(otpRepository).saveAndFlush(otp);
    }
}
