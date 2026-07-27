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

import java.time.Duration;
import java.time.LocalDateTime;
import java.math.BigDecimal;
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
        validateCoreFields(event);
        validateCapacity(event);
        validatePolicies(event, policies);
    }

    private void validateEventWindow(Event event) {
        if (event.getStartDate() == null || event.getEndDate() == null) {
            throw new BusinessRuleException("startDate and endDate are required.", HttpStatus.BAD_REQUEST);
        }
        if (Duration.between(event.getStartDate(), event.getEndDate()).toMinutes() < 30) {
            throw new BusinessRuleException("Giờ kết thúc phải cách giờ bắt đầu ít nhất 30 phút.", HttpStatus.BAD_REQUEST);
        }
        if (!event.getStartDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("startDate must be in the future.", HttpStatus.BAD_REQUEST);
        }
        if (event.getRegistrationOpenAt() != null && event.getRegistrationCloseAt() != null
                && !event.getRegistrationOpenAt().isBefore(event.getRegistrationCloseAt())) {
            throw new BusinessRuleException("registrationOpenAt must be before registrationCloseAt.", HttpStatus.BAD_REQUEST);
        }
        if (event.getRegistrationOpenAt() != null && !event.getRegistrationOpenAt().isBefore(event.getStartDate())) {
            throw new BusinessRuleException("registrationOpenAt must be before startDate.", HttpStatus.BAD_REQUEST);
        }
        if (event.getRegistrationCloseAt() != null && event.getRegistrationCloseAt().isAfter(event.getStartDate())) {
            throw new BusinessRuleException("registrationCloseAt must be on or before startDate.", HttpStatus.BAD_REQUEST);
        }
        if (event.getCheckInOpenAt() != null && event.getCheckInCloseAt() != null
                && !event.getCheckInOpenAt().isBefore(event.getCheckInCloseAt())) {
            throw new BusinessRuleException("checkInOpenAt must be before checkInCloseAt.", HttpStatus.BAD_REQUEST);
        }
        if (event.getCheckInOpenAt() != null && event.getCheckInOpenAt().isAfter(event.getEndDate())) {
            throw new BusinessRuleException("checkInOpenAt must be on or before endDate.", HttpStatus.BAD_REQUEST);
        }
        if (event.getCheckInCloseAt() != null && event.getCheckInCloseAt().isAfter(event.getEndDate())) {
            throw new BusinessRuleException("checkInCloseAt must be on or before endDate.", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateCoreFields(Event event) {
        String name = event.getEventName() == null ? "" : event.getEventName().trim();
        if (name.length() < 5 || name.length() > 150) {
            throw new BusinessRuleException("eventName must be between 5 and 150 characters.", HttpStatus.BAD_REQUEST);
        }
        String plainDescription = event.getDescription() == null
                ? "" : org.jsoup.Jsoup.parse(event.getDescription()).text().trim();
        if (plainDescription.length() < 30 || plainDescription.length() > 1000) {
            throw new BusinessRuleException("description must be between 30 and 1000 characters.", HttpStatus.BAD_REQUEST);
        }
        if (event.getBudget() == null || event.getBudget().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("budget must be greater than or equal to 0.", HttpStatus.BAD_REQUEST);
        }
        if (Boolean.TRUE.equals(event.getIsPaidEvent())) {
            if (event.getTicketPrice() == null || event.getTicketPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("ticketPrice must be greater than 0 for a paid event.", HttpStatus.BAD_REQUEST);
            }
            if (event.getTicketCurrency() == null || event.getTicketCurrency().isBlank()) {
                throw new BusinessRuleException("ticketCurrency is required for a paid event.", HttpStatus.BAD_REQUEST);
            }
        }
    }

    private void validateCapacity(Event event) {
        if (event.getTotalCapacity() == null || event.getTotalCapacity() <= 0) {
            throw new BusinessRuleException("totalCapacity must be greater than 0.", HttpStatus.BAD_REQUEST);
        }
        if (event.getMaxParticipants() == null || event.getMaxParticipants() <= 0) {
            throw new BusinessRuleException("maxParticipants must be greater than 0.", HttpStatus.BAD_REQUEST);
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
