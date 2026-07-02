package com.fptu.fcms.service;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;

public interface RegistrationAllocationPort {
    String allocateGuest(Event event, EventRegistration registration);
}