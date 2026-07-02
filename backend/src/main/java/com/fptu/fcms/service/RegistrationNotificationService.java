package com.fptu.fcms.service;

import com.fptu.fcms.entity.EventRegistration;

public interface RegistrationNotificationService {
    void notifyRegistrationStatus(EventRegistration registration);
}