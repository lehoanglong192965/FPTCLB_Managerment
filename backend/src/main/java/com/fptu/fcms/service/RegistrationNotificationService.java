package com.fptu.fcms.service;

import com.fptu.fcms.entity.GuestEventRegistration;

public interface RegistrationNotificationService {
    void notifyGuestRegistrationStatus(GuestEventRegistration registration);
}