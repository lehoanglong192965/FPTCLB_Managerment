package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistrationPolicy;
import com.fptu.fcms.enums.ParticipantType;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.service.OTPService;
import com.fptu.fcms.service.event.EventProposalValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventProposalValidatorImpl implements EventProposalValidator {

    private final OTPService otpService;

    @Override
    public void validate(Event event, List<EventRegistrationPolicy> policies) {
        if (event == null) {
            throw new BusinessRuleException("Event not found.", HttpStatus.NOT_FOUND);
        }
        validateEventWindow(event);
        validateCapacity(event);
        validatePolicies(event, policies);
    }

    private void validateEventWindow(Event event) {
        if (event.getStartDate() == null || event.getEndDate() == null) {
            throw new BusinessRuleException("startDate and endDate are required.", HttpStatus.BAD_REQUEST);
        }
        if (!event.getEndDate().isAfter(event.getStartDate())) {
            throw new BusinessRuleException("endDate must be after startDate.", HttpStatus.BAD_REQUEST);
        }
        if (!event.getStartDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("startDate must be in the future.", HttpStatus.BAD_REQUEST);
        }
        if (event.getRegistrationOpenAt() != null && event.getRegistrationCloseAt() != null
                && !event.getRegistrationOpenAt().isBefore(event.getRegistrationCloseAt())) {
            throw new BusinessRuleException("registrationOpenAt must be before registrationCloseAt.", HttpStatus.BAD_REQUEST);
        }
        if (event.getCheckInOpenAt() != null && event.getCheckInCloseAt() != null
                && !event.getCheckInOpenAt().isBefore(event.getCheckInCloseAt())) {
            throw new BusinessRuleException("checkInOpenAt must be before checkInCloseAt.", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateCapacity(Event event) {
        if (event.getTotalCapacity() != null && event.getTotalCapacity() < 0) {
            throw new BusinessRuleException("totalCapacity cannot be negative.", HttpStatus.BAD_REQUEST);
        }
        if (event.getMaxParticipants() != null && event.getMaxParticipants() < 0) {
            throw new BusinessRuleException("maxParticipants cannot be negative.", HttpStatus.BAD_REQUEST);
        }
    }

    private void validatePolicies(Event event, List<EventRegistrationPolicy> policies) {
        if (policies == null || policies.size() != 3) {
            throw new BusinessRuleException("Exactly 3 registration policies are required.", HttpStatus.BAD_REQUEST);
        }

        long distinctTypes = policies.stream()
                .map(EventRegistrationPolicy::getParticipantType)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();
        if (distinctTypes != 3) {
            throw new BusinessRuleException("All 3 participant types must be present.", HttpStatus.BAD_REQUEST);
        }

        if (policies.stream().noneMatch(p -> Boolean.TRUE.equals(p.getIsEnabled()))) {
            throw new BusinessRuleException("At least one registration policy must be enabled.", HttpStatus.BAD_REQUEST);
        }

        for (EventRegistrationPolicy policy : policies) {
            if (policy == null || policy.getParticipantType() == null) {
                throw new BusinessRuleException("participantType is required.", HttpStatus.BAD_REQUEST);
            }
            if (policy.getQuota() != null && policy.getQuota() < 0) {
                throw new BusinessRuleException("quota must be >= 0.", HttpStatus.BAD_REQUEST);
            }
            if (policy.getQuotaReleaseAt() != null) {
                if (policy.getWaitlistEnabled() == null || !policy.getWaitlistEnabled()) {
                    throw new BusinessRuleException("quotaReleaseAt requires waitlistEnabled to be true.", HttpStatus.BAD_REQUEST);
                }
                if (event.getRegistrationCloseAt() != null && policy.getQuotaReleaseAt().isAfter(event.getRegistrationCloseAt())) {
                    throw new BusinessRuleException("quotaReleaseAt must be on or before registrationCloseAt.", HttpStatus.BAD_REQUEST);
                }
                if (policy.getQuota() == null) {
                    throw new BusinessRuleException("quotaReleaseAt requires quota to be configured.", HttpStatus.BAD_REQUEST);
                }
            }
        }

        boolean guestEnabled = policies.stream()
                .filter(p -> ParticipantType.PARTICIPANT.equals(p.getParticipantType()))
                .anyMatch(p -> Boolean.TRUE.equals(p.getIsEnabled()));
        if (guestEnabled && otpService == null) {
            throw new BusinessRuleException("Guest registration requires OTP support.", HttpStatus.BAD_REQUEST);
        }
    }
}
