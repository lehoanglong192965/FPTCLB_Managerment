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
import com.fptu.fcms.repository.EventFeedbackRepository;
import com.fptu.fcms.repository.EventRegistrationRepository;
import com.fptu.fcms.repository.EventRepository;
import com.fptu.fcms.service.event.RegistrationLifecycle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackSummaryServiceImplTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventRegistrationRepository eventRegistrationRepository;
    @Mock
    private AttendanceSessionRepository attendanceSessionRepository;
    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;
    @Mock
    private EventFeedbackRepository eventFeedbackRepository;

    @InjectMocks
    private FeedbackSummaryServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "minEligibleExternalPresent", 2);
        ReflectionTestUtils.setField(service, "minResponseCount", 1);
        ReflectionTestUtils.setField(service, "minResponseRate", 0.20);
        ReflectionTestUtils.setField(service, "goodAverageRating", 4.0);
        ReflectionTestUtils.setField(service, "goodPositiveRate", 0.70);
    }

    @Test
    void returnsInsufficientSampleWhenEligibleExternalPresentBelowThreshold() {
        arrangeEvent(List.of(guestRegistration(1)), List.of(record(1)), List.of(feedback(1, 5, true)));

        FeedbackCompetitionInput input = service.getCompetitionInput(99);

        assertEquals(FeedbackAssessmentStatus.INSUFFICIENT_SAMPLE, input.getFeedbackAssessmentStatus());
    }

    @Test
    void returnsGoodWhenAverageAndPositiveRateMeetThresholds() {
        arrangeEvent(
                List.of(guestRegistration(1), fptuParticipantRegistration(2)),
                List.of(record(1), record(2)),
                List.of(feedback(1, 5, true), feedback(2, 4, true))
        );

        FeedbackCompetitionInput input = service.getCompetitionInput(99);

        assertEquals(FeedbackAssessmentStatus.GOOD, input.getFeedbackAssessmentStatus());
        assertEquals(2, input.getEligibleExternalPresentCount());
        assertTrue(input.getAverageOverallRating() >= 4.0);
    }

    @Test
    void returnsNotGoodWhenSampleIsEnoughButScoresMissThreshold() {
        arrangeEvent(
                List.of(guestRegistration(1), fptuParticipantRegistration(2)),
                List.of(record(1), record(2)),
                List.of(feedback(1, 3, true), feedback(2, 4, true))
        );

        FeedbackCompetitionInput input = service.getCompetitionInput(99);

        assertEquals(FeedbackAssessmentStatus.NOT_GOOD, input.getFeedbackAssessmentStatus());
    }

    private void arrangeEvent(List<EventRegistration> registrations, List<AttendanceRecord> records, List<EventFeedback> feedbacks) {
        Event event = new Event();
        event.setEventID(99);
        event.setClubID(7);

        AttendanceSession session = new AttendanceSession();
        session.setSessionID(123);
        session.setEventID(99);

        when(eventRepository.findByEventIDAndIsDeletedFalse(99)).thenReturn(Optional.of(event));
        when(eventRegistrationRepository.findByEventIDAndIsDeletedFalse(99)).thenReturn(registrations);
        when(attendanceSessionRepository.findByEventID(99)).thenReturn(Optional.of(session));
        when(attendanceRecordRepository.findBySessionID(123)).thenReturn(records);
        when(eventFeedbackRepository.findByEventIDAndIsDeletedFalse(99)).thenReturn(feedbacks);
    }

    private EventRegistration guestRegistration(Integer id) {
        EventRegistration registration = baseRegistration(id);
        registration.setUserID(null);
        return registration;
    }

    private EventRegistration fptuParticipantRegistration(Integer id) {
        EventRegistration registration = baseRegistration(id);
        registration.setUserID(100 + id);
        registration.setParticipantType(RegistrationLifecycle.PARTICIPANT_TYPE_PARTICIPANT);
        return registration;
    }

    private EventRegistration baseRegistration(Integer id) {
        EventRegistration registration = new EventRegistration();
        registration.setRegistrationID(id);
        registration.setEventID(99);
        return registration;
    }

    private AttendanceRecord record(Integer registrationId) {
        AttendanceRecord record = new AttendanceRecord();
        record.setRegistrationID(registrationId);
        record.setAttendanceStatus(AttendanceStatus.valueOf(AttendanceStatus.PRESENT.name()));
        return record;
    }

    private EventFeedback feedback(Integer registrationId, Integer rating, boolean external) {
        EventFeedback feedback = new EventFeedback();
        feedback.setRegistrationID(registrationId);
        feedback.setEventID(99);
        feedback.setOverallRating(rating);
        feedback.setIsIncludedInExternalScore(external);
        return feedback;
    }
}