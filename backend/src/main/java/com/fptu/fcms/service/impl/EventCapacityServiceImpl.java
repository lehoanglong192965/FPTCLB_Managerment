package com.fptu.fcms.service.impl;

import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.service.EventCapacityService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventCapacityServiceImpl implements EventCapacityService {

    private final EventRegistrationRepository registrationRepository;

    @Override
    public boolean reserveSeat(Integer eventId, Integer maxParticipants) {
        if (eventId == null || maxParticipants == null || maxParticipants <= 0) {
            return true;
        }

        long currentRegistrations = registrationRepository.countByEventIDAndStatusInAndIsDeletedFalse(
                eventId,
                RegistrationLifecycle.CONFIRMED_STATUSES
        );
        return currentRegistrations < maxParticipants;
    }

    @Override
    public void releaseSeat(Integer eventId) {
        // DB-based capacity does not need an explicit release step.
    }

    @Override
    public void resetCapacity(Integer eventId, Integer maxParticipants) {
        // DB-based capacity is derived from active registrations.
    }
}
