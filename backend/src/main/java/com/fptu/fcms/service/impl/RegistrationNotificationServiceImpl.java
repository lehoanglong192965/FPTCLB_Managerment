package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.RegistrationStatus;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.RegistrationNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RegistrationNotificationServiceImpl implements RegistrationNotificationService {

    private final EmailService emailService;

    @Override
    public void notifyRegistrationStatus(EventRegistration registration) {
        if (registration.getGuestEmail() == null || registration.getUserID() != null) {
            return;
        }
        RegistrationStatus status = registration.getRegistrationStatus();
        if (status == null && registration.getStatus() != null) {
            status = RegistrationStatus.fromValue(registration.getStatus());
        }
        if (RegistrationStatus.CONFIRMED.equals(status)) {
            emailService.sendSimpleEmail(
                    registration.getGuestEmail(),
                    "FCMS Guest Registration Confirmed",
                    "Your registration is confirmed. Check-in does not use QR. Please ask staff to look you up on the event list and verify your full name plus the last 4 digits of your phone number."
            );
        } else if (RegistrationStatus.WAITLISTED.equals(status)) {
            emailService.sendSimpleEmail(
                    registration.getGuestEmail(),
                    "FCMS Guest Registration Waitlisted",
                    "Your registration is currently waitlisted. We will notify you if a slot becomes available."
            );
        } else if (RegistrationStatus.REJECTED.equals(status) || RegistrationStatus.CANCELLED.equals(status)) {
            emailService.sendSimpleEmail(
                    registration.getGuestEmail(),
                    "FCMS Guest Registration Update",
                    "Your registration status is now: " + status.name() + "."
            );
        }
    }
}
