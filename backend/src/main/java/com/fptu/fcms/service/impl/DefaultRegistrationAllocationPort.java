package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.service.RegistrationAllocationPort;
import com.fptu.fcms.service.event.RegistrationAllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DefaultRegistrationAllocationPort implements RegistrationAllocationPort {

    private final RegistrationAllocationService allocationService;

    @Override
    public String allocateGuest(Event event, EventRegistration registration) {
        return allocationService.allocateInitial(event.getEventID(), event.getMaxParticipants(), false).status();
    }
}