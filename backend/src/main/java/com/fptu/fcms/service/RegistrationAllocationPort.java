package com.fptu.fcms.service;

import com.fptu.fcms.entity.Event;

public interface RegistrationAllocationPort {
    String allocateGuest(Event event);
}