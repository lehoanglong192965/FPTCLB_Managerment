package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.response.FeedbackCompetitionInput;
import com.fptu.fcms.entity.AttendanceRecord;
import com.fptu.fcms.entity.AttendanceSession;
import com.fptu.fcms.entity.Event;
import com.fptu.fcms.entity.EventFeedback;
import com.fptu.fcms.entity.EventRegistration;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.FeedbackAssessmentStatus;
import com.fptu.fcms.repository.AttendanceRecordRepository;
import com.fptu.fcms.repository.AttendanceSessionRepository;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.repository.EventFeedbackRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.FeedbackSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackSummaryServiceImpl implements FeedbackSummaryService {

    @Value("${fcms.feedback.min-eligible-external-present:10}")
    private int minEligibleExternalPresent;

    @Value("${fcms.feedback.min-response-count:5}")
    private int minResponseCount;

    @Value("${fcms.feedback.min-response-rate:0.20}")
    private double minResponseRate;

    @Value("${fcms.feedback.good-average-rating:4.00}")
    private double goodAverageRating;

    @Value("${fcms.feedback.good-positive-rate:0.70}")
    private double goodPositiveRate;

    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EventFeedbackRepository eventFeedbackRepository;
    private final ClubMembershipRepository clubMembershipRepository;

    @Override
    public FeedbackCompetitionInput getCompetitionInput(Integer eventId) {
        Event event = eventRepository.findByEventIDAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new IllegalArgumentException("EVENT_NOT_FOUND"));

        Map<Integer, EventRegistration> registrations = eventRegistrationRepository.findByEventIDAndIsDeletedFalse(eventId)
                .stream()
                .collect(Collectors.toMap(EventRegistration::getRegistrationID, Function.identity(), (a, b) -> a));

        Set<Integer> presentRegistrationIds = attendanceSessionRepository.findByEventID(eventId)
                .map(AttendanceSession::getSessionID)
                .map(attendanceRecordRepository::findBySessionID)
                .orElseGet(java.util.List::of)
                .stream()
                .filter(record -> AttendanceStatus.PRESENT.name().equals(normalizeStatus(record.getAttendanceStatus())))
                .map(AttendanceRecord::getRegistrationID)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Set<Integer> eligibleExternalRegistrationIds = registrations.values().stream()
                .filter(registration -> presentRegistrationIds.contains(registration.getRegistrationID()))
                .filter(registration -> isExternalParticipant(event, registration))
                .map(EventRegistration::getRegistrationID)
                .collect(Collectors.toSet());

        var externalFeedbacks = eventFeedbackRepository.findByEventIDAndIsDeletedFalse(eventId).stream()
                .filter(feedback -> eligibleExternalRegistrationIds.contains(feedback.getRegistrationID()))
                .filter(feedback -> Boolean.TRUE.equals(feedback.getIsIncludedInExternalScore()))
                .toList();

        long eligibleExternalPresentCount = eligibleExternalRegistrationIds.size();
        long externalFeedbackResponseCount = externalFeedbacks.size();
        long positiveFeedbackCount = externalFeedbacks.stream()
                .filter(feedback -> feedback.getOverallRating() != null && feedback.getOverallRating() >= 4)
                .count();

        double responseRate = eligibleExternalPresentCount == 0
                ? 0.0
                : (double) externalFeedbackResponseCount / eligibleExternalPresentCount;
        double averageRating = externalFeedbacks.stream()
                .map(EventFeedback::getOverallRating)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        double positiveRate = externalFeedbackResponseCount == 0
                ? 0.0
                : (double) positiveFeedbackCount / externalFeedbackResponseCount;

        int requiredResponseCount = Math.max(
                minResponseCount,
                (int) Math.ceil(eligibleExternalPresentCount * minResponseRate)
        );
        FeedbackAssessmentStatus assessmentStatus = assess(
                eligibleExternalPresentCount,
                externalFeedbackResponseCount,
                averageRating,
                positiveRate,
                requiredResponseCount
        );

        return new FeedbackCompetitionInput(
                event.getEventID(),
                event.getClubID(),
                eligibleExternalPresentCount,
                externalFeedbackResponseCount,
                responseRate,
                averageRating,
                positiveFeedbackCount,
                positiveRate,
                assessmentStatus,
                minEligibleExternalPresent,
                requiredResponseCount,
                goodAverageRating,
                goodPositiveRate,
                LocalDateTime.now()
        );
    }

    private FeedbackAssessmentStatus assess(
            long eligibleExternalPresentCount,
            long externalFeedbackResponseCount,
            double averageRating,
            double positiveRate,
            int requiredResponseCount
    ) {
        if (eligibleExternalPresentCount < minEligibleExternalPresent) {
            return FeedbackAssessmentStatus.INSUFFICIENT_SAMPLE;
        }
        if (externalFeedbackResponseCount < requiredResponseCount) {
            return FeedbackAssessmentStatus.INSUFFICIENT_SAMPLE;
        }
        if (averageRating >= goodAverageRating && positiveRate >= goodPositiveRate) {
            return FeedbackAssessmentStatus.GOOD;
        }
        return FeedbackAssessmentStatus.NOT_GOOD;
    }

    private boolean isExternalParticipant(Event event, EventRegistration registration) {
        if (registration.getUserID() == null) {
            return true;
        }
        if (event.getClubID() == null) {
            return true;
        }
        boolean hostClubMember = event.getSemesterID() == null
                ? clubMembershipRepository.existsByClubIDAndUserIDAndIsDeletedFalse(event.getClubID(), registration.getUserID())
                : clubMembershipRepository.findByClubIDAndUserIDAndSemesterIDAndIsDeletedFalse(event.getClubID(), registration.getUserID(), event.getSemesterID()).isPresent();
        return !hostClubMember;
    }

    private String normalizeStatus(String status) {
        if (status == null) {
            return "";
        }
        return status.trim().toUpperCase(java.util.Locale.ROOT);
    }
}

