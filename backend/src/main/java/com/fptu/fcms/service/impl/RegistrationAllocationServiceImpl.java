package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.service.event.RegistrationAllocationResult;
import com.fptu.fcms.service.event.RegistrationAllocationService;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationAllocationServiceImpl implements RegistrationAllocationService {

    private final EventRegistrationRepository registrationRepository;

    @Override
    @Transactional(readOnly = true)
    public RegistrationAllocationResult allocateInitial(Integer eventId, Integer maxParticipants, boolean requiresApproval) {
        validateInputs(eventId, maxParticipants);

        if (requiresApproval) {
            return new RegistrationAllocationResult(RegistrationLifecycle.STATUS_PENDING_APPROVAL, false);
        }

        return hasAvailableSeat(eventId, maxParticipants)
                ? new RegistrationAllocationResult(RegistrationLifecycle.STATUS_CONFIRMED, true)
                : new RegistrationAllocationResult(RegistrationLifecycle.STATUS_WAITLISTED, false);
    }

    @Override
    @Transactional(readOnly = true)
    public RegistrationAllocationResult allocateOnApproval(Integer eventId, Integer maxParticipants) {
        validateInputs(eventId, maxParticipants);

        return hasAvailableSeat(eventId, maxParticipants)
                ? new RegistrationAllocationResult(RegistrationLifecycle.STATUS_CONFIRMED, true)
                : new RegistrationAllocationResult(RegistrationLifecycle.STATUS_WAITLISTED, false);
    }

    @Override
    @Transactional
    public int promoteWaitlisted(Integer eventId, Integer maxParticipants) {
        validateInputs(eventId, maxParticipants);

        long confirmedCount = countConfirmedRegistrations(eventId);
        if (confirmedCount >= maxParticipants) {
            return 0;
        }

        List<EventRegistration> waitlisted = registrationRepository
                .findByEventIDAndStatusAndIsDeletedFalseOrderByRegisteredAtAsc(eventId, RegistrationLifecycle.STATUS_WAITLISTED);

        int promoted = 0;
        for (EventRegistration registration : waitlisted) {
            if (confirmedCount >= maxParticipants) {
                break;
            }
            registration.setStatus(RegistrationLifecycle.STATUS_CONFIRMED);
            registrationRepository.save(registration);
            confirmedCount++;
            promoted++;
        }
        return promoted;
    }

    private boolean hasAvailableSeat(Integer eventId, Integer maxParticipants) {
        if (maxParticipants == 0) {
            return false;
        }
        long confirmedCount = countConfirmedRegistrations(eventId);
        return confirmedCount < maxParticipants;
    }

    private long countConfirmedRegistrations(Integer eventId) {
        return registrationRepository.countByEventIDAndStatusInAndIsDeletedFalse(
                eventId,
                RegistrationLifecycle.CONFIRMED_STATUSES
        );
    }

    private void validateInputs(Integer eventId, Integer maxParticipants) {
        if (eventId == null) {
            throw new IllegalArgumentException("eventId is required.");
        }
        if (maxParticipants == null) {
            throw new IllegalArgumentException("maxParticipants is required.");
        }
        if (maxParticipants < 0) {
            throw new IllegalArgumentException("maxParticipants cannot be negative.");
        }
    }
}
