package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Contribution;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.entity.MemberPerformance;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.repository.ContributionRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.repository.MemberPerformanceRepository;
import com.fptu.fcms.service.ContributionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContributionServiceImpl implements ContributionService {

    private static final EventStatus CONTRIBUTION_CALCULATED = EventStatus.CONTRIBUTION_CALCULATED;

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final MemberPerformanceRepository memberPerformanceRepository;
    private final ContributionRepository contributionRepository;

    @Override
    @Transactional
    public void calculateEventContributions(Integer eventId, BigDecimal multiplier) {
        if (multiplier == null || multiplier.compareTo(BigDecimal.ZERO) < 0 || multiplier.compareTo(new BigDecimal("1.5")) > 0) {
            throw new IllegalArgumentException("multiplier must be between 0.0 and 1.5");
        }

        Event event = eventRepository.findByEventIDAndIsDeletedFalseForUpdate(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));

        List<EventRegistration> registrations = eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId);
        for (EventRegistration registration : registrations) {
            Integer basePoints = resolveBasePoints(eventId, registration.getUserID());
            int finalPoints = BigDecimal.valueOf(basePoints)
                    .multiply(multiplier)
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValueExact();

            Contribution contribution = new Contribution();
            contribution.setEventID(eventId);
            contribution.setUserID(registration.getUserID());
            contribution.setBasePoints(basePoints);
            contribution.setMultiplier(multiplier);
            contribution.setFinalPoints(finalPoints);
            contribution.setCalculatedAt(LocalDateTime.now());
            contribution.setIsDeleted(false);
            contributionRepository.save(contribution);

            MemberPerformance performance = memberPerformanceRepository
                    .findByEventIDAndUserIDAndIsDeletedFalse(eventId, registration.getUserID())
                    .orElseGet(MemberPerformance::new);
            performance.setEventID(eventId);
            performance.setUserID(registration.getUserID());
            performance.setBasePoints(basePoints);
            performance.setBonusPoints(finalPoints);
            performance.setUpdatedAt(LocalDateTime.now());
            performance.setIsDeleted(false);
            memberPerformanceRepository.save(performance);
        }

        event.setEventStatus(CONTRIBUTION_CALCULATED);
        eventRepository.save(event);
    }

    private Integer resolveBasePoints(Integer eventId, Integer userId) {
        return eventRegistrationRepository.findByEventIDAndUserIDAndIsDeletedFalse(eventId, userId)
                .map(registration -> 100)
                .orElse(0);
    }
}
