package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.GuestEventRegistrationRepository;
import com.fptu.fcms.service.RegistrationAllocationPort;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DefaultRegistrationAllocationPort implements RegistrationAllocationPort {

    private final EventRegistrationRepository eventRegistrationRepository;
    private final GuestEventRegistrationRepository guestEventRegistrationRepository;

    @Override
    public String allocateGuest(Event event) {
        Integer maxParticipants = event.getMaxParticipants();
        if (maxParticipants == null) {
            throw new IllegalArgumentException("maxParticipants is required.");
        }
        if (maxParticipants <= 0) {
            return RegistrationLifecycle.STATUS_WAITLISTED.name();
        }

        long confirmedCount = eventRegistrationRepository.countByEventIDAndRegistrationStatusInAndCapacityExemptFalseAndIsDeletedFalse(
                event.getEventID(),
                RegistrationLifecycle.CONFIRMED_STATUSES
        ) + guestEventRegistrationRepository.countByEventIDAndRegistrationStatusInAndIsDeletedFalse(
                event.getEventID(),
                RegistrationLifecycle.CONFIRMED_STATUSES
        );

        return confirmedCount < maxParticipants
                ? RegistrationLifecycle.STATUS_CONFIRMED.name()
                : RegistrationLifecycle.STATUS_WAITLISTED.name();
    }
}
